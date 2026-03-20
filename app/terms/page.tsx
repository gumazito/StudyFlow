'use client'

export default function TermsOfService() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <nav className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <a href="/" className="text-sm" style={{ color: 'var(--text-secondary)' }}>← Back to StudyFlow</a>
        <div className="text-lg font-extrabold" style={{ background: 'linear-gradient(135deg, #a29bfe, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>StudyFlow</div>
        <div />
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-extrabold mb-1">Terms of Service</h1>
        <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Last updated: March 2026</p>

        <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>1. Acceptance of Terms</h2>
            <p>By accessing or using StudyFlow ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform. StudyFlow is an educational platform designed for Australian high school students, educators, and mentors.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>2. Eligibility</h2>
            <p>StudyFlow is intended for users aged 13 and older. Users under 13 must have a parent or guardian create an account on their behalf and accept these terms. By creating an account, you confirm that you meet these requirements. Schools and educational institutions may create accounts for students of any age under their supervision.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>3. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. Each account is personal and should not be shared. New accounts require admin approval before full access is granted. We reserve the right to suspend or terminate accounts that violate these terms.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>4. User Roles</h2>
            <p>StudyFlow supports multiple roles: Learner (accessing and completing courses), Publisher (creating and managing educational content), Mentor (guiding and monitoring learners), and Admin (managing the platform). Role requests are subject to admin approval. Users may hold multiple roles simultaneously.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>5. Content & Intellectual Property</h2>
            <p>Educational content created by Publishers remains their intellectual property. By publishing content on StudyFlow, you grant us a non-exclusive licence to host, display, and distribute it within the Platform. AI-generated content (questions, study materials, research) is provided as educational aids and should be verified by qualified educators. You must not upload content that infringes on third-party intellectual property rights.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>6. Acceptable Use</h2>
            <p>You agree not to: use the Platform for any unlawful purpose; harass, bully, or intimidate other users; upload inappropriate, offensive, or harmful content; attempt to circumvent content moderation systems; share another user's personal information without consent; use automated systems to access the Platform; or interfere with the Platform's operation or security.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>7. Premium Subscriptions</h2>
            <p>StudyFlow offers optional premium subscriptions with additional features. Subscriptions are billed through Stripe. Free trials are available for new subscribers (14 days). You may cancel at any time; access continues until the end of the billing period. Refund requests are handled on a case-by-case basis. Prices are in AUD and may change with 30 days' notice.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>8. AI Features</h2>
            <p>StudyFlow integrates AI-powered features including question generation, study plan creation, and the Study Buddy tutor. AI responses are generated for educational purposes and may not always be accurate. Users should verify AI-generated content with authoritative sources. AI features require API keys configured by the user or institution.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>9. Groups & Organisations</h2>
            <p>Groups (schools, tutoring organisations) can be created with ABN verification for Australian entities. Group administrators are responsible for managing their members and content. Cross-publishing of courses between groups is available with appropriate permissions.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>10. Limitation of Liability</h2>
            <p>StudyFlow is provided "as is" without warranties of any kind. We are not liable for any educational outcomes, exam results, or decisions made based on Platform content. Our total liability is limited to the amount you paid for the service in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>11. Modifications</h2>
            <p>We may update these Terms at any time. Material changes will be communicated via email or Platform notification. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>12. Governing Law</h2>
            <p>These Terms are governed by the laws of Australia. Disputes will be resolved in the courts of New South Wales, Australia.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>13. Contact</h2>
            <p>For questions about these Terms, contact us at support@studyflow.edu.au.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
