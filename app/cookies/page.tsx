'use client'

export default function CookiePolicy() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <nav className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <a href="/" className="text-sm" style={{ color: 'var(--text-secondary)' }}>← Back to StudyFlow</a>
        <div className="text-lg font-extrabold" style={{ background: 'linear-gradient(135deg, #a29bfe, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>StudyFlow</div>
        <div />
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-extrabold mb-1">Cookie Policy</h1>
        <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Last updated: March 2026</p>

        <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>What Are Cookies?</h2>
            <p>Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and improve your experience. StudyFlow uses a minimal set of cookies essential for the platform to function.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>Cookies We Use</h2>
            <p><strong>Essential Cookies (Required):</strong> Firebase Authentication session tokens that keep you logged in. These are strictly necessary and cannot be disabled. They expire when you log out or after your session ends (based on your "Remember me" preference).</p>
            <p className="mt-2"><strong>Preference Cookies:</strong> Theme preference (dark/light mode) stored in your browser's local storage. These remember your display settings between visits.</p>
            <p className="mt-2"><strong>Performance Cookies:</strong> Firebase Analytics may collect anonymised usage data to help us improve the platform. No personally identifiable information is collected through these cookies.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>Cookies We Do NOT Use</h2>
            <p>StudyFlow does not use advertising or tracking cookies, third-party marketing cookies, social media tracking pixels, or cross-site tracking technologies. We do not sell or share cookie data with advertisers.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>Third-Party Services</h2>
            <p>When you connect your Spotify account or use the embedded Spotify player, Spotify may set its own cookies governed by Spotify's cookie policy. When you make payments through Stripe, Stripe may set cookies governed by Stripe's privacy policy. These are only active when you explicitly use these features.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>Managing Cookies</h2>
            <p>You can manage cookies through your browser settings. Note that blocking essential cookies will prevent you from logging in to StudyFlow. Most browsers allow you to view and delete cookies, block all or specific cookies, set preferences for certain websites, and be notified when a cookie is set.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>Contact</h2>
            <p>Questions about our cookie practices? Contact us at privacy@studyflow.edu.au.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
