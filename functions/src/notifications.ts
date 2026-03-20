/**
 * Email & SMS Notification Cloud Functions
 * ==========================================
 * Email via SendGrid, SMS via Twilio.
 *
 * Config:
 *   firebase functions:config:set sendgrid.api_key="YOUR_KEY"
 *   firebase functions:config:set sendgrid.from_email="noreply@studyflow.app"
 *   firebase functions:config:set twilio.account_sid="YOUR_SID"
 *   firebase functions:config:set twilio.auth_token="YOUR_TOKEN"
 *   firebase functions:config:set twilio.from_number="+61XXXXXXXXX"
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import cors from 'cors'

const corsHandler = cors({ origin: true })

interface EmailRequest {
  to: string
  subject: string
  html: string
  templateId?: string
  dynamicData?: Record<string, any>
}

interface SmsRequest {
  to: string
  body: string
}

/**
 * Send email notification via SendGrid
 */
export const sendEmailNotification = functions.region('australia-southeast1').https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      // Verify Firebase auth
      const authHeader = req.headers.authorization
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      const idToken = authHeader.split('Bearer ')[1]
      const decoded = await admin.auth().verifyIdToken(idToken)

      // Only admin or system can send emails
      const userDoc = await admin.firestore().doc(`users/${decoded.uid}`).get()
      const userData = userDoc.data()
      if (!userData?.roles?.includes('admin') && decoded.email !== 'courtenay@hollis.family') {
        res.status(403).json({ error: 'Only admins can send notifications' })
        return
      }

      const { to, subject, html, templateId, dynamicData } = req.body as EmailRequest

      if (!to || (!html && !templateId)) {
        res.status(400).json({ error: 'to and html (or templateId) required' })
        return
      }

      const apiKey = functions.config().sendgrid?.api_key
      if (!apiKey) {
        res.status(500).json({ error: 'SendGrid not configured. Run: firebase functions:config:set sendgrid.api_key="YOUR_KEY"' })
        return
      }

      const fromEmail = functions.config().sendgrid?.from_email || 'noreply@studyflow.app'

      // Use dynamic import for SendGrid
      const sgMail = require('@sendgrid/mail')
      sgMail.setApiKey(apiKey)

      const msg: any = {
        to,
        from: { email: fromEmail, name: 'StudyFlow' },
        subject,
      }

      if (templateId) {
        msg.templateId = templateId
        msg.dynamicTemplateData = dynamicData || {}
      } else {
        msg.html = html
      }

      await sgMail.send(msg)

      // Log notification
      await admin.firestore().collection('notification_logs').add({
        type: 'email',
        to,
        subject,
        sentBy: decoded.uid,
        sentAt: Date.now(),
        status: 'sent',
      })

      res.json({ success: true, message: `Email sent to ${to}` })
    } catch (err: any) {
      console.error('Email error:', err)
      res.status(500).json({ error: err.message || 'Email sending failed' })
    }
  })
})

/**
 * Send SMS notification via Twilio
 */
export const sendSmsNotification = functions.region('australia-southeast1').https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      // Verify Firebase auth
      const authHeader = req.headers.authorization
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      const idToken = authHeader.split('Bearer ')[1]
      const decoded = await admin.auth().verifyIdToken(idToken)

      // Only admin or system can send SMS
      const userDoc = await admin.firestore().doc(`users/${decoded.uid}`).get()
      const userData = userDoc.data()
      if (!userData?.roles?.includes('admin') && decoded.email !== 'courtenay@hollis.family') {
        res.status(403).json({ error: 'Only admins can send SMS' })
        return
      }

      const { to, body } = req.body as SmsRequest

      if (!to || !body) {
        res.status(400).json({ error: 'to and body required' })
        return
      }

      const accountSid = functions.config().twilio?.account_sid
      const authToken = functions.config().twilio?.auth_token
      const fromNumber = functions.config().twilio?.from_number

      if (!accountSid || !authToken || !fromNumber) {
        res.status(500).json({ error: 'Twilio not configured. Set twilio.account_sid, twilio.auth_token, twilio.from_number.' })
        return
      }

      const twilio = require('twilio')
      const client = twilio(accountSid, authToken)

      const message = await client.messages.create({
        body: `[StudyFlow] ${body}`,
        from: fromNumber,
        to,
      })

      // Log notification
      await admin.firestore().collection('notification_logs').add({
        type: 'sms',
        to,
        body,
        sentBy: decoded.uid,
        sentAt: Date.now(),
        status: 'sent',
        twilioSid: message.sid,
      })

      res.json({ success: true, message: `SMS sent to ${to}`, sid: message.sid })
    } catch (err: any) {
      console.error('SMS error:', err)
      res.status(500).json({ error: err.message || 'SMS sending failed' })
    }
  })
})

/**
 * Firestore trigger: Auto-send email on new course announcement
 */
export const onNewAnnouncement = functions.region('australia-southeast1').firestore
  .document('announcements/{announcementId}')
  .onCreate(async (snap) => {
    const announcement = snap.data()
    if (announcement.type !== 'new_course') return

    const apiKey = functions.config().sendgrid?.api_key
    if (!apiKey) return // SendGrid not configured, skip

    try {
      // Get all users who opted in to email notifications
      const usersSnap = await admin.firestore()
        .collection('users')
        .where('emailNotifications', '==', true)
        .get()

      if (usersSnap.empty) return

      const sgMail = require('@sendgrid/mail')
      sgMail.setApiKey(apiKey)

      const fromEmail = functions.config().sendgrid?.from_email || 'noreply@studyflow.app'

      const emails = usersSnap.docs
        .map((d: any) => d.data().email)
        .filter((e: string) => e)

      if (emails.length === 0) return

      // Send batch email
      await sgMail.sendMultiple({
        to: emails,
        from: { email: fromEmail, name: 'StudyFlow' },
        subject: `New Course: ${announcement.packageName}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6C5CE7;">📚 New Course Available!</h2>
            <p><strong>${announcement.packageName}</strong> has just been published on StudyFlow.</p>
            <p>Log in to start learning now!</p>
            <a href="https://studyflow-app.web.app" style="display: inline-block; background: #6C5CE7; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Open StudyFlow</a>
            <p style="color: #888; font-size: 12px; margin-top: 24px;">You're receiving this because you have email notifications enabled. Update your preferences in Profile settings.</p>
          </div>
        `,
      })
    } catch (err) {
      console.error('Auto-email notification failed:', err)
    }
  })

/**
 * Weekly Progress Summary Email (Scheduled — every Monday 7am AEST)
 * Sends each user a digest of their week: tests taken, scores, streaks, courses progress.
 */
export const weeklyProgressSummary = functions.region('australia-southeast1').pubsub
  .schedule('0 7 * * 1')
  .timeZone('Australia/Sydney')
  .onRun(async () => {
    const apiKey = functions.config().sendgrid?.api_key
    if (!apiKey) {
      console.log('SendGrid not configured — skipping weekly summary')
      return null
    }

    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(apiKey)
    const fromEmail = functions.config().sendgrid?.from_email || 'noreply@studyflow.app'

    const now = Date.now()
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000

    // Get all users who opted in to email notifications
    const usersSnap = await admin.firestore()
      .collection('users')
      .where('emailNotifications', '==', true)
      .get()

    if (usersSnap.empty) return null

    const batch: any[] = []

    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data()
      if (!user.email) continue

      try {
        // Get test results from this week
        const resultsSnap = await admin.firestore()
          .collection('testResults')
          .where('userId', '==', userDoc.id)
          .where('completedAt', '>=', oneWeekAgo)
          .get()

        const testsTaken = resultsSnap.size
        let totalScore = 0
        let bestScore = 0
        const coursesStudied = new Set<string>()

        resultsSnap.docs.forEach((doc: any) => {
          const r = doc.data()
          const pct = r.totalQuestions > 0 ? Math.round((r.correctAnswers / r.totalQuestions) * 100) : 0
          totalScore += pct
          if (pct > bestScore) bestScore = pct
          if (r.packageId) coursesStudied.add(r.packageId)
        })

        const avgScore = testsTaken > 0 ? Math.round(totalScore / testsTaken) : 0

        // Get current streak from gamification
        const gamDoc = await admin.firestore().doc(`gamification/${userDoc.id}`).get()
        const streak = gamDoc.exists ? (gamDoc.data()?.currentStreak || 0) : 0

        // Skip if user had zero activity
        if (testsTaken === 0) continue

        const html = `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 24px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="background: linear-gradient(135deg, #a29bfe, #00cec9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px;">StudyFlow</h1>
              <p style="color: #666; font-size: 14px;">Your Weekly Progress Summary</p>
            </div>
            <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
              <h2 style="color: #333; margin-top: 0;">Hey ${user.displayName || 'there'}! 👋</h2>
              <p style="color: #555;">Here's what you accomplished this week:</p>
              <div style="display: flex; gap: 16px; margin: 20px 0; text-align: center;">
                <div style="flex: 1; background: #f0f0ff; padding: 16px; border-radius: 8px;">
                  <div style="font-size: 28px; font-weight: bold; color: #6C5CE7;">${testsTaken}</div>
                  <div style="font-size: 12px; color: #888;">Tests Taken</div>
                </div>
                <div style="flex: 1; background: #f0fff0; padding: 16px; border-radius: 8px;">
                  <div style="font-size: 28px; font-weight: bold; color: #00b894;">${avgScore}%</div>
                  <div style="font-size: 12px; color: #888;">Avg Score</div>
                </div>
                <div style="flex: 1; background: #fff8f0; padding: 16px; border-radius: 8px;">
                  <div style="font-size: 28px; font-weight: bold; color: #fdcb6e;">${streak}🔥</div>
                  <div style="font-size: 12px; color: #888;">Day Streak</div>
                </div>
              </div>
              <p style="color: #555;">Best score this week: <strong>${bestScore}%</strong> across <strong>${coursesStudied.size}</strong> course${coursesStudied.size !== 1 ? 's' : ''}.</p>
              ${streak >= 7 ? '<p style="color: #6C5CE7; font-weight: bold;">🏆 Amazing! You\'ve maintained a week-long streak!</p>' : ''}
              ${bestScore === 100 ? '<p style="color: #00b894; font-weight: bold;">🎯 Perfect score alert! Keep it up!</p>' : ''}
            </div>
            <div style="text-align: center;">
              <a href="https://studyflow-app.web.app" style="display: inline-block; background: linear-gradient(135deg, #a29bfe, #00cec9); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Continue Studying</a>
            </div>
            <p style="color: #aaa; font-size: 11px; text-align: center; margin-top: 24px;">You're receiving this because you have email notifications enabled. Update your preferences in Profile → Settings.</p>
          </div>
        `

        batch.push({
          to: user.email,
          from: { email: fromEmail, name: 'StudyFlow' },
          subject: `📊 Your Week in Review — ${testsTaken} tests, ${avgScore}% avg`,
          html,
        })
      } catch (err) {
        console.error(`Error building summary for ${userDoc.id}:`, err)
      }
    }

    // Send in batches of 100 (SendGrid limit)
    for (let i = 0; i < batch.length; i += 100) {
      const chunk = batch.slice(i, i + 100)
      try {
        await sgMail.send(chunk)
        console.log(`Sent ${chunk.length} weekly summaries (batch ${Math.floor(i / 100) + 1})`)
      } catch (err) {
        console.error('Weekly summary batch send failed:', err)
      }
    }

    // Log
    await admin.firestore().collection('notification_logs').add({
      type: 'weekly_summary',
      count: batch.length,
      sentAt: now,
      status: 'sent',
    })

    return null
  })

/**
 * Inactive User Reminder (Scheduled — daily at 5pm AEST)
 * Sends a gentle nudge to users who haven't been active for 7+ days.
 * Only sends once per inactivity period (tracked via lastReminderSent).
 */
export const inactiveUserReminder = functions.region('australia-southeast1').pubsub
  .schedule('0 17 * * *')
  .timeZone('Australia/Sydney')
  .onRun(async () => {
    const apiKey = functions.config().sendgrid?.api_key
    if (!apiKey) {
      console.log('SendGrid not configured — skipping inactive reminders')
      return null
    }

    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(apiKey)
    const fromEmail = functions.config().sendgrid?.from_email || 'noreply@studyflow.app'

    const now = Date.now()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

    // Get users who haven't been active in 7+ days and opted in to notifications
    const usersSnap = await admin.firestore()
      .collection('users')
      .where('emailNotifications', '==', true)
      .where('lastActive', '<=', sevenDaysAgo)
      .get()

    if (usersSnap.empty) return null

    const batch: any[] = []

    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data()
      if (!user.email) continue

      // Skip if we already sent a reminder since their last activity
      if (user.lastReminderSent && user.lastReminderSent > (user.lastActive || 0)) continue

      // Get their streak info
      const gamDoc = await admin.firestore().doc(`gamification/${userDoc.id}`).get()
      const streak = gamDoc.exists ? (gamDoc.data()?.currentStreak || 0) : 0
      const xp = gamDoc.exists ? (gamDoc.data()?.xp || 0) : 0

      const daysSinceActive = Math.floor((now - (user.lastActive || now)) / (24 * 60 * 60 * 1000))

      const html = `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 24px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="background: linear-gradient(135deg, #a29bfe, #00cec9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px;">StudyFlow</h1>
          </div>
          <div style="background: white; border-radius: 8px; padding: 20px;">
            <h2 style="color: #333; margin-top: 0;">We miss you, ${user.displayName || 'friend'}! 👋</h2>
            <p style="color: #555;">It's been <strong>${daysSinceActive} days</strong> since your last study session.</p>
            ${streak > 0 ? `<p style="color: #e17055;">⚠️ Your <strong>${streak}-day streak</strong> is at risk! Don't let it slip away.</p>` : ''}
            ${xp > 0 ? `<p style="color: #555;">You've earned <strong>${xp} XP</strong> so far — keep building on that!</p>` : ''}
            <p style="color: #555;">Even 5 minutes of study can make a difference. Jump back in and keep the momentum going!</p>
            <div style="text-align: center; margin-top: 20px;">
              <a href="https://studyflow-app.web.app" style="display: inline-block; background: linear-gradient(135deg, #a29bfe, #00cec9); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Resume Studying</a>
            </div>
          </div>
          <p style="color: #aaa; font-size: 11px; text-align: center; margin-top: 24px;">You're receiving this because you have email notifications enabled. Update your preferences in Profile → Settings.</p>
        </div>
      `

      batch.push({
        to: user.email,
        from: { email: fromEmail, name: 'StudyFlow' },
        subject: `📚 ${user.displayName || 'Hey'}, your study streak needs you!`,
        html,
      })

      // Mark reminder sent
      await admin.firestore().doc(`users/${userDoc.id}`).update({
        lastReminderSent: now,
      })
    }

    // Send in batches
    for (let i = 0; i < batch.length; i += 100) {
      const chunk = batch.slice(i, i + 100)
      try {
        await sgMail.send(chunk)
        console.log(`Sent ${chunk.length} inactive reminders (batch ${Math.floor(i / 100) + 1})`)
      } catch (err) {
        console.error('Inactive reminder batch send failed:', err)
      }
    }

    await admin.firestore().collection('notification_logs').add({
      type: 'inactive_reminder',
      count: batch.length,
      sentAt: now,
      status: 'sent',
    })

    return null
  })
