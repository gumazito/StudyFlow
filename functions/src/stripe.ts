/**
 * Stripe Payment Processing Cloud Functions
 * ============================================
 * Handles subscriptions for premium StudyFlow features.
 *
 * Config:
 *   firebase functions:config:set stripe.secret_key="sk_..."
 *   firebase functions:config:set stripe.webhook_secret="whsec_..."
 *   firebase functions:config:set stripe.price_id_monthly="price_..."
 *   firebase functions:config:set stripe.price_id_yearly="price_..."
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import cors from 'cors'

const corsHandler = cors({ origin: true })

function getStripe() {
  const Stripe = require('stripe')
  return new Stripe(functions.config().stripe?.secret_key, { apiVersion: '2023-10-16' })
}

/**
 * Create a Stripe Checkout session for subscription
 */
export const createCheckoutSession = functions.https.onRequest((req, res) => {
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

      const { plan } = req.body as { plan?: 'monthly' | 'yearly' }
      if (!plan) {
        res.status(400).json({ error: 'plan required (monthly or yearly)' })
        return
      }

      const stripeConfig = functions.config().stripe || {}
      if (!stripeConfig.secret_key) {
        res.status(500).json({ error: 'Stripe not configured' })
        return
      }

      const stripe = getStripe()
      const priceId = plan === 'yearly'
        ? stripeConfig.price_id_yearly
        : stripeConfig.price_id_monthly

      if (!priceId) {
        res.status(500).json({ error: `Price ID for ${plan} plan not configured` })
        return
      }

      // Check if user already has a Stripe customer ID
      const userDoc = await admin.firestore().doc(`users/${decoded.uid}`).get()
      const userData = userDoc.data() || {}
      let customerId = userData.stripeCustomerId

      if (!customerId) {
        // Create Stripe customer
        const customer = await stripe.customers.create({
          email: decoded.email,
          metadata: { firebaseUid: decoded.uid },
        })
        customerId = customer.id

        // Save customer ID to Firestore
        await admin.firestore().doc(`users/${decoded.uid}`).update({
          stripeCustomerId: customerId,
        })
      }

      const appUrl = functions.config().app?.url || 'https://studyflow-app.web.app'

      // Check if user has ever had a subscription (no trial for returning users)
      const hasHadSub = !!userData.subscriptionId
      const trialDays = hasHadSub ? undefined : 14

      const sessionParams: any = {
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}?subscription=cancelled`,
        metadata: { firebaseUid: decoded.uid },
      }

      if (trialDays) {
        sessionParams.subscription_data = { trial_period_days: trialDays }
      }

      const session = await stripe.checkout.sessions.create(sessionParams)

      res.json({ sessionId: session.id, url: session.url })
    } catch (err: any) {
      console.error('Checkout error:', err)
      res.status(500).json({ error: err.message || 'Failed to create checkout session' })
    }
  })
})

/**
 * Stripe webhook handler for subscription events
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const stripeConfig = functions.config().stripe || {}
  if (!stripeConfig.secret_key || !stripeConfig.webhook_secret) {
    res.status(500).json({ error: 'Stripe webhook not configured' })
    return
  }

  const stripe = getStripe()
  const sig = req.headers['stripe-signature'] as string

  let event
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, stripeConfig.webhook_secret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    res.status(400).json({ error: 'Invalid signature' })
    return
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const firebaseUid = session.metadata?.firebaseUid
        if (firebaseUid) {
          await admin.firestore().doc(`users/${firebaseUid}`).update({
            subscriptionStatus: 'active',
            subscriptionId: session.subscription,
            subscriptionUpdatedAt: Date.now(),
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer
        // Find user by Stripe customer ID
        const usersSnap = await admin.firestore()
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get()

        if (!usersSnap.empty) {
          const userRef = usersSnap.docs[0].ref
          await userRef.update({
            subscriptionStatus: subscription.status,
            subscriptionPlan: subscription.items?.data?.[0]?.price?.id || '',
            subscriptionCurrentPeriodEnd: subscription.current_period_end * 1000,
            subscriptionUpdatedAt: Date.now(),
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer
        const usersSnap = await admin.firestore()
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get()

        if (!usersSnap.empty) {
          const userRef = usersSnap.docs[0].ref
          await userRef.update({
            subscriptionStatus: 'cancelled',
            subscriptionUpdatedAt: Date.now(),
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerId = invoice.customer
        const usersSnap = await admin.firestore()
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get()

        if (!usersSnap.empty) {
          const userRef = usersSnap.docs[0].ref
          await userRef.update({
            subscriptionStatus: 'past_due',
            subscriptionUpdatedAt: Date.now(),
          })
        }
        break
      }
    }

    res.json({ received: true })
  } catch (err: any) {
    console.error('Webhook processing error:', err)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

/**
 * Get subscription status for current user
 */
export const getSubscriptionStatus = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      const idToken = authHeader.split('Bearer ')[1]
      const decoded = await admin.auth().verifyIdToken(idToken)

      const userDoc = await admin.firestore().doc(`users/${decoded.uid}`).get()
      const userData = userDoc.data() || {}

      res.json({
        status: userData.subscriptionStatus || 'none',
        plan: userData.subscriptionPlan || null,
        currentPeriodEnd: userData.subscriptionCurrentPeriodEnd || null,
        isPremium: ['active', 'trialing'].includes(userData.subscriptionStatus || ''),
        isTrialing: userData.subscriptionStatus === 'trialing',
        trialEnd: userData.subscriptionTrialEnd || null,
      })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })
})

/**
 * Cancel subscription with optional retention offer (discount or pause)
 */
export const cancelSubscription = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      const idToken = authHeader.split('Bearer ')[1]
      const decoded = await admin.auth().verifyIdToken(idToken)

      const { action } = req.body as { action?: 'cancel' | 'pause' | 'discount' }
      if (!action) {
        res.status(400).json({ error: 'action required (cancel, pause, or discount)' })
        return
      }

      const userDoc = await admin.firestore().doc(`users/${decoded.uid}`).get()
      const userData = userDoc.data() || {}
      const subscriptionId = userData.subscriptionId

      if (!subscriptionId) {
        res.status(400).json({ error: 'No active subscription found' })
        return
      }

      const stripe = getStripe()

      if (action === 'cancel') {
        // Cancel at period end (not immediately)
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        })
        await admin.firestore().doc(`users/${decoded.uid}`).update({
          subscriptionStatus: 'cancelling',
          subscriptionCancelAt: userData.subscriptionCurrentPeriodEnd,
          subscriptionUpdatedAt: Date.now(),
        })
        res.json({ success: true, message: 'Subscription will cancel at end of billing period' })
      } else if (action === 'pause') {
        // Pause collection for 1 month
        await stripe.subscriptions.update(subscriptionId, {
          pause_collection: { behavior: 'void', resumes_at: Math.floor(Date.now() / 1000) + 30 * 86400 },
        })
        await admin.firestore().doc(`users/${decoded.uid}`).update({
          subscriptionStatus: 'paused',
          subscriptionPausedUntil: Date.now() + 30 * 86400 * 1000,
          subscriptionUpdatedAt: Date.now(),
        })
        res.json({ success: true, message: 'Subscription paused for 1 month' })
      } else if (action === 'discount') {
        // Apply 50% off for 2 months as retention offer
        const coupon = await stripe.coupons.create({
          percent_off: 50,
          duration: 'repeating',
          duration_in_months: 2,
          name: 'Stay with StudyFlow - 50% off',
        })
        await stripe.subscriptions.update(subscriptionId, {
          coupon: coupon.id,
        })
        await admin.firestore().doc(`users/${decoded.uid}`).update({
          subscriptionRetentionApplied: true,
          subscriptionRetentionDiscount: '50% off for 2 months',
          subscriptionUpdatedAt: Date.now(),
        })
        res.json({ success: true, message: '50% discount applied for 2 months' })
      }
    } catch (err: any) {
      console.error('Cancel subscription error:', err)
      res.status(500).json({ error: err.message || 'Failed to process cancellation' })
    }
  })
})
