'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast, useModal } from '@/lib/contexts/ThemeContext'
import { createCheckoutSession, getSubscriptionStatus, cancelSubscription } from '@/lib/cloud-functions'

interface SubscriptionPanelProps {
  cardStyle: any
}

/**
 * Stripe subscription management panel with free trial + cancellation retention.
 */
export function SubscriptionPanel({ cardStyle }: SubscriptionPanelProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { showConfirm } = useModal()
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [cancelStep, setCancelStep] = useState<'none' | 'reasons' | 'offer'>('none')
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    const loadStatus = async () => {
      try {
        const result = await getSubscriptionStatus()
        setStatus(result)
      } catch {
        setStatus({ status: 'none', isPremium: false })
      } finally {
        setLoading(false)
      }
    }
    loadStatus()
  }, [user?.id])

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    setCheckoutLoading(true)
    try {
      const result = await createCheckoutSession(plan)
      if (result.url) { window.open(result.url, '_blank') }
    } catch (err: any) {
      toast(err.message || 'Failed to start checkout', 'error')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleCancelAction = async (action: 'cancel' | 'pause' | 'discount') => {
    setCancelling(true)
    try {
      const result = await cancelSubscription(action)
      toast(result.message || 'Done', 'success')
      setCancelStep('none')
      // Refresh status
      const updated = await getSubscriptionStatus()
      setStatus(updated)
    } catch (err: any) {
      toast(err.message || 'Failed', 'error')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return null

  const isActive = status?.isPremium
  const isTrialing = status?.isTrialing
  const trialDaysLeft = status?.trialEnd ? Math.max(0, Math.ceil((status.trialEnd - Date.now()) / 86400000)) : 0

  return (
    <div className="rounded-xl p-4 mb-4" style={cardStyle}>
      <h3 className="text-sm font-bold mb-2">💎 StudyFlow Premium</h3>

      {isActive ? (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: isTrialing ? 'rgba(108,92,231,.12)' : 'rgba(0,212,106,.12)', color: isTrialing ? 'var(--primary)' : '#00d46a' }}>
              {isTrialing ? `Free Trial (${trialDaysLeft} days left)` : 'Active'}
            </span>
            {status.currentPeriodEnd && (
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {isTrialing ? 'Trial ends' : 'Renews'} {new Date(status.currentPeriodEnd).toLocaleDateString('en-AU')}
              </span>
            )}
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
            You have full access to all premium features including AI study plans, podcast mode, and priority support.
          </p>

          {/* Cancel flow */}
          {cancelStep === 'none' && (
            <button className="text-[10px] underline" style={{ color: 'var(--text-muted)' }} onClick={() => setCancelStep('reasons')}>
              Cancel subscription
            </button>
          )}

          {cancelStep === 'reasons' && (
            <div className="p-3 mt-2 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <h4 className="text-xs font-bold mb-2">We're sorry to see you go! Why are you cancelling?</h4>
              <div className="flex flex-col gap-1.5 mb-3">
                {['Too expensive', 'Not using it enough', 'Missing features I need', 'Found an alternative', 'Other'].map(reason => (
                  <button key={reason} className="text-left px-3 py-1.5 rounded-md text-xs transition-colors"
                    style={{ background: cancelReason === reason ? 'rgba(108,92,231,.1)' : 'transparent', border: `1px solid ${cancelReason === reason ? 'var(--primary)' : 'var(--border)'}`, color: cancelReason === reason ? 'var(--primary)' : 'var(--text-secondary)' }}
                    onClick={() => setCancelReason(reason)}>
                    {reason}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={() => setCancelStep('none')}>Never mind</button>
                <button className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ color: 'var(--danger)' }} onClick={() => setCancelStep('offer')} disabled={!cancelReason}>Continue</button>
              </div>
            </div>
          )}

          {cancelStep === 'offer' && (
            <div className="p-3 mt-2 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <h4 className="text-xs font-bold mb-1">Before you go, here are some options:</h4>
              <p className="text-[10px] mb-3" style={{ color: 'var(--text-muted)' }}>
                {cancelReason === 'Too expensive' ? "We'd love to help — how about 50% off for 2 months?" :
                 cancelReason === 'Not using it enough' ? 'Maybe a pause would be better? You can resume anytime.' :
                 "We value you as a member. Here's what we can offer:"}
              </p>
              <div className="flex flex-col gap-2 mb-3">
                {cancelReason === 'Too expensive' || cancelReason === 'Other' ? (
                  <button className="px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--primary)' }}
                    onClick={() => handleCancelAction('discount')} disabled={cancelling}>
                    🎉 Get 50% off for 2 months
                  </button>
                ) : null}
                <button className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: 'rgba(108,92,231,.1)', color: 'var(--primary)', border: '1px solid var(--primary)' }}
                  onClick={() => handleCancelAction('pause')} disabled={cancelling}>
                  ⏸️ Pause for 1 month (keep your data)
                </button>
                <button className="px-3 py-1.5 rounded-lg text-xs" style={{ color: 'var(--danger)', border: '1px solid var(--danger)', background: 'transparent' }}
                  onClick={async () => {
                    const ok = await showConfirm('Cancel your subscription? You\'ll keep access until the end of your billing period.', 'Confirm Cancellation')
                    if (ok) handleCancelAction('cancel')
                  }} disabled={cancelling}>
                  Cancel subscription
                </button>
              </div>
              <button className="text-[10px] underline" style={{ color: 'var(--text-muted)' }} onClick={() => { setCancelStep('none'); setCancelReason('') }}>
                Keep my subscription
              </button>
            </div>
          )}

          {status?.status === 'cancelling' && (
            <div className="mt-2 text-[10px] px-3 py-2 rounded-lg" style={{ background: 'rgba(253,203,110,.1)', border: '1px solid rgba(253,203,110,.3)', color: 'var(--warning)' }}>
              Your subscription will end on {new Date(status.currentPeriodEnd).toLocaleDateString('en-AU')}. You'll keep access until then.
            </div>
          )}
          {status?.status === 'paused' && (
            <div className="mt-2 text-[10px] px-3 py-2 rounded-lg" style={{ background: 'rgba(108,92,231,.1)', border: '1px solid rgba(108,92,231,.3)', color: 'var(--primary)' }}>
              Subscription paused. It will automatically resume in about 1 month.
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
            Unlock AI-powered study plans, podcast mode, advanced analytics, and ad-free experience.
          </p>
          <p className="text-[10px] mb-3 font-semibold" style={{ color: 'var(--primary)' }}>
            Start with a 14-day free trial — no charge until it ends!
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Monthly plan */}
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div className="text-lg font-bold" style={{ color: 'var(--text)' }}>$4.99</div>
              <div className="text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>per month</div>
              <button
                onClick={() => handleSubscribe('monthly')}
                disabled={checkoutLoading}
                className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: checkoutLoading ? 'var(--text-muted)' : 'var(--primary)' }}
              >
                {checkoutLoading ? '...' : 'Start Free Trial'}
              </button>
            </div>

            {/* Yearly plan */}
            <div className="p-3 rounded-lg text-center relative" style={{ background: 'var(--bg)', border: '2px solid var(--primary)' }}>
              <div className="absolute -top-2 right-2 text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--primary)', color: 'white' }}>
                Save 17%
              </div>
              <div className="text-lg font-bold" style={{ color: 'var(--text)' }}>$49.99</div>
              <div className="text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>per year</div>
              <button
                onClick={() => handleSubscribe('yearly')}
                disabled={checkoutLoading}
                className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: checkoutLoading ? 'var(--text-muted)' : 'var(--primary)' }}
              >
                {checkoutLoading ? '...' : 'Start Free Trial'}
              </button>
            </div>
          </div>

          {status?.status === 'past_due' && (
            <div className="mt-2 text-[10px] text-center" style={{ color: 'var(--danger)' }}>
              Your payment is past due. Please update your payment method.
            </div>
          )}
          {status?.status === 'cancelled' && (
            <div className="mt-2 text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
              Your subscription was cancelled. Subscribe again to regain access.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
