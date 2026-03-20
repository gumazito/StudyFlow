/**
 * Push Notifications Cloud Functions (Firebase Cloud Messaging)
 * ==============================================================
 * Handles FCM token registration and push notification delivery.
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import cors from 'cors'

const corsHandler = cors({ origin: true })

/**
 * Register/update push notification token for a user
 */
export const subscribeToPush = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      const idToken = authHeader.split('Bearer ')[1]
      const decoded = await admin.auth().verifyIdToken(idToken)

      const { fcmToken } = req.body as { fcmToken?: string }
      if (!fcmToken) {
        res.status(400).json({ error: 'fcmToken required' })
        return
      }

      // Store token in Firestore
      await admin.firestore().doc(`push_tokens/${decoded.uid}`).set({
        tokens: admin.firestore.FieldValue.arrayUnion(fcmToken),
        updatedAt: Date.now(),
      }, { merge: true })

      res.json({ success: true })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })
})

/**
 * Send push notification to a specific user or all users
 */
export const sendPushNotification = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      const idToken = authHeader.split('Bearer ')[1]
      const decoded = await admin.auth().verifyIdToken(idToken)

      // Only admin can send push
      const userDoc = await admin.firestore().doc(`users/${decoded.uid}`).get()
      const userData = userDoc.data()
      if (!userData?.roles?.includes('admin') && decoded.email !== 'courtenay@hollis.family') {
        res.status(403).json({ error: 'Only admins can send push notifications' })
        return
      }

      const { targetUserId, title, body, data, sendToAll } = req.body as {
        targetUserId?: string
        title: string
        body: string
        data?: Record<string, string>
        sendToAll?: boolean
      }

      if (!title || !body) {
        res.status(400).json({ error: 'title and body required' })
        return
      }

      let tokens: string[] = []

      if (sendToAll) {
        const allTokens = await admin.firestore().collection('push_tokens').get()
        allTokens.docs.forEach(doc => {
          const t = doc.data().tokens || []
          tokens.push(...t)
        })
      } else if (targetUserId) {
        const tokenDoc = await admin.firestore().doc(`push_tokens/${targetUserId}`).get()
        if (tokenDoc.exists) {
          tokens = tokenDoc.data()?.tokens || []
        }
      } else {
        res.status(400).json({ error: 'targetUserId or sendToAll required' })
        return
      }

      if (tokens.length === 0) {
        res.json({ success: true, sent: 0, message: 'No push tokens found' })
        return
      }

      // Remove duplicates
      tokens = [...new Set(tokens)]

      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: { title, body },
        data: data || {},
        webpush: {
          notification: {
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-72.png',
          },
        },
      }

      const response = await admin.messaging().sendEachForMulticast(message)

      // Clean up invalid tokens
      const invalidTokens: string[] = []
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
          invalidTokens.push(tokens[idx])
        }
      })

      // Remove invalid tokens from Firestore
      if (invalidTokens.length > 0) {
        const batch = admin.firestore().batch()
        const allTokenDocs = await admin.firestore().collection('push_tokens').get()
        allTokenDocs.docs.forEach(doc => {
          const docTokens = doc.data().tokens || []
          const filtered = docTokens.filter((t: string) => !invalidTokens.includes(t))
          if (filtered.length !== docTokens.length) {
            batch.update(doc.ref, { tokens: filtered })
          }
        })
        await batch.commit()
      }

      res.json({
        success: true,
        sent: response.successCount,
        failed: response.failureCount,
        cleaned: invalidTokens.length,
      })
    } catch (err: any) {
      console.error('Push notification error:', err)
      res.status(500).json({ error: err.message || 'Push notification failed' })
    }
  })
})

/**
 * Firestore triggers for auto-push on key events
 */
export const onNewTestResult = functions.firestore
  .document('test_results/{resultId}')
  .onCreate(async (snap) => {
    const result = snap.data()
    if (!result.userId) return

    // Notify mentors of this learner
    const mentorSnap = await admin.firestore()
      .collection('mentor_requests')
      .where('learnerId', '==', result.userId)
      .where('status', '==', 'accepted')
      .get()

    if (mentorSnap.empty) return

    const score = result.score ?? (result.correct && result.total ? Math.round((result.correct / result.total) * 100) : null)
    const scoreText = score !== null ? ` — scored ${score}%` : ''

    for (const doc of mentorSnap.docs) {
      const mentorId = doc.data().mentorId
      const tokenDoc = await admin.firestore().doc(`push_tokens/${mentorId}`).get()
      if (!tokenDoc.exists) continue

      const tokens = tokenDoc.data()?.tokens || []
      if (tokens.length === 0) continue

      try {
        await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title: 'Mentee completed a test',
            body: `${result.userName || 'A student'} completed "${result.packageName || 'a test'}"${scoreText}`,
          },
          data: { type: 'test_result', userId: result.userId, packageId: result.packageId || '' },
        })
      } catch (err) {
        console.warn('Push to mentor failed:', err)
      }
    }
  })
