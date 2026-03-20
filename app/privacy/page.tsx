'use client'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <nav className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <a href="/" className="text-sm" style={{ color: 'var(--text-secondary)' }}>← Back to StudyFlow</a>
        <div className="text-lg font-extrabold" style={{ background: 'linear-gradient(135deg, #a29bfe, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>StudyFlow</div>
        <div />
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-extrabold mb-1">Privacy Policy</h1>
        <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Last updated: March 2026</p>

        <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>1. Overview</h2>
            <p>StudyFlow ("we", "our", "the Platform") is committed to protecting the privacy of our users, particularly as many are minors. This policy explains how we collect, use, store, and protect your personal information in compliance with the Australian Privacy Act 1988, the Australian Privacy Principles (APPs), and the EU General Data Protection Regulation (GDPR) where applicable.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>2. Information We Collect</h2>
            <p><strong>Account Information:</strong> Name, email address, date of birth, and selected roles (learner/publisher/mentor). For organisation accounts: ABN and entity name.</p>
            <p className="mt-2"><strong>Usage Data:</strong> Test results, learning progress, study streaks, XP points, badges earned, course completion data, and spaced repetition review history.</p>
            <p className="mt-2"><strong>Technical Data:</strong> Browser type, device information, and IP address for security and analytics purposes.</p>
            <p className="mt-2"><strong>Payment Data:</strong> Processed securely by Stripe. We store only subscription status and Stripe customer ID — never full card details.</p>
            <p className="mt-2"><strong>Communication Data:</strong> Cheers, feedback messages, and notification preferences.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>3. How We Use Your Information</h2>
            <p>We use your information to: provide and personalise the educational experience; track learning progress and generate study plans; enable social features (following, cheers, leaderboards); send notifications based on your preferences; process premium subscriptions; improve the Platform through anonymised analytics; comply with legal obligations; and ensure platform safety through content moderation.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>4. Children's Privacy</h2>
            <p>StudyFlow takes children's privacy seriously. For users under 13, we require parental or guardian consent for account creation. We do not knowingly collect personal information from children under 13 without verified parental consent. Schools may act as the consenting party for students using StudyFlow as part of their educational programme. We collect the minimum information necessary and do not use children's data for advertising or marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>5. AI & Third-Party Services</h2>
            <p>StudyFlow integrates with AI providers (Anthropic Claude, OpenAI, Google Gemini, Grok) for content generation. When using AI features, relevant educational context may be sent to these providers. Users configure their own API keys — StudyFlow does not share your data with AI providers without your action. Third-party services include: Firebase (hosting, database, authentication), Stripe (payments), SendGrid (email), and Twilio (SMS).</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>6. Data Storage & Security</h2>
            <p>Data is stored in Firebase (Google Cloud) with servers primarily in Australia. We implement appropriate security measures including encrypted connections (HTTPS/TLS), Firebase security rules restricting data access, content moderation on user-generated content, regular security reviews, and API key masking in data exports.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>7. Data Sharing</h2>
            <p>We do not sell your personal information. Data may be shared with: group administrators (for members' progress within their group), mentors (for students they are mentoring, with consent), and third-party service providers (as listed above, for operational purposes only). We may disclose information if required by law or to protect the safety of our users.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>8. Your Rights</h2>
            <p><strong>Access:</strong> You can view all your data within your Profile settings.</p>
            <p className="mt-1"><strong>Portability:</strong> Export all your data as a JSON file from Profile &gt; Privacy &amp; Data.</p>
            <p className="mt-1"><strong>Correction:</strong> Update your information in Profile settings at any time.</p>
            <p className="mt-1"><strong>Deletion:</strong> Delete your account and all associated data from Profile &gt; Account. This action is permanent and complies with the right to be forgotten.</p>
            <p className="mt-1"><strong>Consent Withdrawal:</strong> You may withdraw consent for non-essential processing (e.g., notifications) at any time.</p>
            <p className="mt-2">For GDPR-related requests, we will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>9. Cookies & Local Storage</h2>
            <p>StudyFlow uses Firebase Authentication which stores a session token in your browser. We do not use third-party tracking cookies or advertising cookies. Essential cookies are used for authentication and preferences only.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>10. Data Retention</h2>
            <p>Active account data is retained while your account exists. Upon account deletion, all personal data is permanently removed within 30 days. Anonymised, aggregated analytics data may be retained for platform improvement.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. Material changes will be communicated via email and/or Platform notification. The "Last updated" date at the top indicates the most recent revision.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>12. Contact & Complaints</h2>
            <p>Privacy Officer: privacy@studyflow.edu.au</p>
            <p className="mt-1">If you believe your privacy has been breached, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at oaic.gov.au.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
