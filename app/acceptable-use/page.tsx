'use client'

export default function AcceptableUsePolicy() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <nav className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <a href="/" className="text-sm" style={{ color: 'var(--text-secondary)' }}>← Back to StudyFlow</a>
        <div className="text-lg font-extrabold" style={{ background: 'linear-gradient(135deg, #a29bfe, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>StudyFlow</div>
        <div />
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-extrabold mb-1">Acceptable Use Policy</h1>
        <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Last updated: March 2026</p>

        <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>Purpose</h2>
            <p>StudyFlow is an educational platform for Australian students, teachers, and mentors. This Acceptable Use Policy sets out the standards of behaviour expected of all users to ensure a safe, respectful, and productive learning environment.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>You Must</h2>
            <p>Use StudyFlow for legitimate educational purposes. Treat all users with respect and courtesy. Keep your account credentials secure and not share them. Report any inappropriate content or behaviour using the report button. Comply with all applicable Australian laws and school policies. Respect the intellectual property rights of content creators.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>You Must Not</h2>
            <p><strong>Harassment & Bullying:</strong> Send threatening, abusive, or harassing messages through cheers, feedback, or any communication feature. Bully, intimidate, or deliberately exclude other users. Create content that targets individuals based on race, gender, sexuality, religion, disability, or any other characteristic.</p>
            <p className="mt-2"><strong>Inappropriate Content:</strong> Upload or share sexually explicit, violent, or graphic content. Use profanity or offensive language (our content moderation system automatically filters inappropriate language). Share content promoting self-harm, eating disorders, substance abuse, or dangerous activities. Post spam, advertisements, or promotional content unrelated to education.</p>
            <p className="mt-2"><strong>Academic Integrity:</strong> Share test answers or encourage cheating. Submit AI-generated content as your own original work without disclosure. Plagiarise content from other sources without attribution.</p>
            <p className="mt-2"><strong>Security & Privacy:</strong> Attempt to access other users' accounts or data. Share other users' personal information without their consent. Circumvent security measures, content filters, or access controls. Use automated tools, bots, or scripts to access the platform. Upload files containing malware or malicious code.</p>
            <p className="mt-2"><strong>Misuse of Features:</strong> Create fake accounts or impersonate others. Abuse the reporting system by filing false reports. Exploit free-tier limits through multiple accounts. Use AI features to generate harmful, biased, or misleading content.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>Content Moderation</h2>
            <p>StudyFlow employs automated content moderation that screens all user-generated text in real time. Content that triggers our profanity filter is automatically sanitised before submission. Severely inappropriate content is blocked entirely. All users can report content using the flag button, which alerts our admin team for review.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>Enforcement</h2>
            <p>Violations of this policy may result in content removal (immediate for flagged content), a formal warning for first-time minor violations, temporary account suspension for repeated violations, or permanent account termination for severe or repeated violations. Accounts that receive 3 or more content flags are automatically suspended pending admin review. We reserve the right to take any action we deem appropriate to maintain the safety and integrity of the platform.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>For Schools & Groups</h2>
            <p>Group administrators may establish additional rules for their group that are stricter than this policy. Schools may add custom word block lists for their groups. Group admins are responsible for moderating content within their groups. StudyFlow provides tools for group admins to manage their community effectively.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>Appeals</h2>
            <p>If you believe an enforcement action was taken in error, contact support@studyflow.edu.au with your account details and the circumstances. Appeals are reviewed within 5 business days.</p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>Reporting</h2>
            <p>To report a violation, use the 🚩 flag button on any user content, or email safety@studyflow.edu.au for urgent concerns. All reports are treated confidentially.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
