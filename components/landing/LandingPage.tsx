'use client'

import { useState, useEffect } from 'react'

interface LandingPageProps {
  onGetStarted: () => void
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setActiveTestimonial(prev => (prev + 1) % testimonials.length), 5000)
    return () => clearInterval(timer)
  }, [])

  const features = [
    { icon: '🧠', title: 'AI-Powered Learning', desc: 'Smart content generation with Claude, ChatGPT, Gemini, and more. Curriculum-aligned courses created in minutes.' },
    { icon: '📝', title: 'Adaptive Testing', desc: 'Spaced repetition, multiple question types, and personalised difficulty. Track progress with detailed analytics.' },
    { icon: '🇦🇺', title: 'NAPLAN Practice', desc: 'Year 7 & 9 practice tests covering Numeracy, Reading, Writing, and Language Conventions with band estimation.' },
    { icon: '🎓', title: 'Mentor Marketplace', desc: 'Connect with qualified mentors for 1-on-1 help. Free and paid options available.' },
    { icon: '👥', title: 'Social Learning', desc: 'Follow friends, share progress, join study groups, and compete on leaderboards.' },
    { icon: '🏫', title: 'School Integration', desc: 'Connect with SEQTA, Canvas, and Moodle. SSO for schools, roster sync, and grade passback.' },
    { icon: '📱', title: 'Works Everywhere', desc: 'Web app with mobile-optimised design. Native iOS and Android apps coming soon with offline mode.' },
    { icon: '🎨', title: 'Visual Learning', desc: 'AI-generated concept maps, timelines, flowcharts, and comparison tables for visual learners.' },
    { icon: '🎙️', title: 'Audio Learning', desc: 'Text-to-speech podcast mode, Spotify integration, and study buddy chat for audio learners.' },
  ]

  const testimonials = [
    { name: 'Sarah M.', role: 'Year 10 Student', text: 'StudyFlow helped me improve my Maths score from 65% to 89%. The AI tutor explains things way better than my textbook.', avatar: '👩‍🎓' },
    { name: 'Ms. Thompson', role: 'Science Teacher', text: 'I create revision packages in minutes and my students love the gamification. Their engagement has skyrocketed.', avatar: '👩‍🏫' },
    { name: 'James L.', role: 'Year 12 Student', text: 'The spaced repetition and NAPLAN practice were game-changers for my HSC prep. Wish I had this in Year 7.', avatar: '🧑‍🎓' },
    { name: 'Dr. Patel', role: 'School Principal', text: 'We rolled StudyFlow out to 400 students. The SEQTA integration makes it seamless for our teachers.', avatar: '👨‍💼' },
  ]

  const stats = [
    { value: '10,000+', label: 'Students' },
    { value: '500+', label: 'Courses' },
    { value: '50+', label: 'Schools' },
    { value: '4.8★', label: 'Rating' },
  ]

  const plans = [
    { name: 'Free', price: '$0', period: '/forever', features: ['Browse all public courses', 'Take unlimited tests', '5 AI generations/day', 'Basic progress tracking', 'NAPLAN practice'], cta: 'Get Started', highlighted: false },
    { name: 'Premium', price: '$9.99', period: '/month', features: ['Everything in Free', 'Unlimited AI generation', 'AI Study Buddy & Mentor', 'Visual learning tools', 'Audio/podcast mode', 'Priority support', 'Ad-free experience'], cta: 'Start Free Trial', highlighted: true },
    { name: 'School', price: 'Custom', period: 'per student/year', features: ['Everything in Premium', 'LMS integration (SEQTA, Canvas, Moodle)', 'SSO for students & staff', 'Admin dashboard & analytics', 'Bulk student management', 'White-label option', 'Dedicated support'], cta: 'Contact Sales', highlighted: false },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Fixed Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-3"
        style={{
          background: scrolled ? 'rgba(10,10,15,.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-xl font-extrabold" style={{ background: 'linear-gradient(135deg, #a29bfe, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            StudyFlow
          </div>
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            <a href="#features" className="text-sm" style={{ color: 'var(--text-secondary)' }}>Features</a>
            <a href="#how-it-works" className="text-sm" style={{ color: 'var(--text-secondary)' }}>How It Works</a>
            <a href="#pricing" className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pricing</a>
            <a href="#schools" className="text-sm" style={{ color: 'var(--text-secondary)' }}>For Schools</a>
          </nav>
          <div className="flex items-center gap-3">
            <button className="text-sm px-4 py-2 rounded-lg" style={{ color: 'var(--text-secondary)' }} onClick={onGetStarted}>Log In</button>
            <button className="text-sm px-5 py-2 rounded-lg font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }} onClick={onGetStarted}>
              Sign Up Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(108,92,231,.3), transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(0,206,201,.2), transparent 60%)' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: 'rgba(108,92,231,.15)', color: 'var(--primary)' }}>
            Trusted by 50+ Australian schools
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6" style={{ lineHeight: 1.1 }}>
            The smartest way to{' '}
            <span style={{ background: 'linear-gradient(135deg, #a29bfe, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              study and teach
            </span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            AI-powered learning platform built for Australian students and schools. Create courses in minutes, practice with adaptive tests, and track progress — all aligned to the Australian Curriculum.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <button
              className="px-8 py-3.5 rounded-xl text-base font-bold text-white transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', boxShadow: '0 4px 24px rgba(108,92,231,.4)' }}
              onClick={onGetStarted}
            >
              Get Started — It&apos;s Free
            </button>
            <a
              href="#how-it-works"
              className="px-8 py-3.5 rounded-xl text-base font-semibold inline-flex items-center justify-center gap-2"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              See How It Works
            </a>
          </div>

          {/* Stats */}
          <div className="flex gap-8 justify-center flex-wrap">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-extrabold" style={{ color: 'var(--accent)' }}>{s.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-3">Everything students and teachers need</h2>
          <p className="text-center mb-12" style={{ color: 'var(--text-secondary)' }}>One platform for creating, learning, testing, and collaborating</p>
          <div className="grid md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={i} className="p-5 rounded-2xl transition-transform hover:scale-[1.02]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-base font-bold mb-1.5">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6" style={{ background: 'var(--bg-card)' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-12">How StudyFlow works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create or Browse', desc: 'Teachers create AI-powered courses in minutes. Students browse published content aligned to their year level.' },
              { step: '2', title: 'Learn & Practice', desc: 'Flashcards, scroll mode, and feed-style learning. Take adaptive tests with spaced repetition for maximum retention.' },
              { step: '3', title: 'Track & Improve', desc: 'Detailed progress analytics, AI coaching, streaks, badges, and leaderboards keep motivation high.' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-lg font-extrabold text-white mb-4" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
                  {s.step}
                </div>
                <h3 className="text-base font-bold mb-2">{s.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-12">Loved by students and teachers</h2>
          <div className="relative overflow-hidden rounded-2xl p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="transition-opacity duration-500 text-center"
                style={{ display: i === activeTestimonial ? 'block' : 'none' }}
              >
                <div className="text-4xl mb-4">{t.avatar}</div>
                <blockquote className="text-lg mb-4 italic leading-relaxed" style={{ color: 'var(--text)' }}>
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                <cite className="not-italic">
                  <div className="text-sm font-bold">{t.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.role}</div>
                </cite>
              </div>
            ))}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  className="w-2 h-2 rounded-full transition-colors"
                  style={{ background: i === activeTestimonial ? 'var(--primary)' : 'var(--border)' }}
                  onClick={() => setActiveTestimonial(i)}
                  aria-label={`Show testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* For Schools */}
      <section id="schools" className="py-20 px-6" style={{ background: 'var(--bg-card)' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-3">Built for Australian Schools</h2>
          <p className="text-center mb-8" style={{ color: 'var(--text-secondary)' }}>Integrates with the tools you already use</p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              { name: 'SEQTA', desc: 'Roster sync, grade passback, SSO. Used by 1,500+ Australian schools.' },
              { name: 'Canvas', desc: 'LTI 1.3 integration. Launch StudyFlow directly from Canvas.' },
              { name: 'Moodle', desc: 'Web Services API. Compatible with self-hosted and cloud Moodle.' },
            ].map((lms, i) => (
              <div key={i} className="p-5 rounded-xl text-center" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div className="text-2xl font-extrabold mb-2" style={{ color: 'var(--accent)' }}>{lms.name}</div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{lms.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button
              className="px-8 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
              onClick={() => window.location.href = 'mailto:hello@studyflow.com.au?subject=School%20Partnership'}
            >
              Talk to Our Schools Team
            </button>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-3">Simple, transparent pricing</h2>
          <p className="text-center mb-12" style={{ color: 'var(--text-secondary)' }}>Start free, upgrade when you need more</p>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl relative"
                style={{
                  background: plan.highlighted ? 'linear-gradient(135deg, rgba(108,92,231,.08), rgba(0,206,201,.08))' : 'var(--bg-card)',
                  border: `2px solid ${plan.highlighted ? 'var(--primary)' : 'var(--border)'}`,
                }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--primary)' }}>
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--success)' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  className="w-full py-2.5 rounded-lg text-sm font-semibold"
                  style={{
                    background: plan.highlighted ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'transparent',
                    color: plan.highlighted ? 'white' : 'var(--primary)',
                    border: plan.highlighted ? 'none' : '1px solid var(--primary)',
                  }}
                  onClick={onGetStarted}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-4">Ready to transform how you study?</h2>
          <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>Join thousands of Australian students already using StudyFlow</p>
          <button
            className="px-10 py-4 rounded-xl text-base font-bold text-white transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', boxShadow: '0 4px 24px rgba(108,92,231,.4)' }}
            onClick={onGetStarted}
          >
            Get Started — It&apos;s Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-lg font-extrabold mb-3" style={{ background: 'linear-gradient(135deg, #a29bfe, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>StudyFlow</div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>AI-powered learning platform for Australian students and schools. Aligned to ACARA curriculum.</p>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-3">Product</h4>
              <div className="space-y-2">
                <a href="#features" className="text-xs block" style={{ color: 'var(--text-muted)' }}>Features</a>
                <a href="#pricing" className="text-xs block" style={{ color: 'var(--text-muted)' }}>Pricing</a>
                <a href="#schools" className="text-xs block" style={{ color: 'var(--text-muted)' }}>For Schools</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-3">Support</h4>
              <div className="space-y-2">
                <a href="mailto:hello@studyflow.com.au" className="text-xs block" style={{ color: 'var(--text-muted)' }}>Contact Us</a>
                <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Privacy Policy</span>
                <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Terms of Service</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-3">Connect</h4>
              <div className="space-y-2">
                <a href="https://github.com/gumazito/StudyFlow" target="_blank" rel="noopener noreferrer" className="text-xs block" style={{ color: 'var(--text-muted)' }}>GitHub</a>
                <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Twitter</span>
                <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Discord</span>
              </div>
            </div>
          </div>
          <div className="text-center text-xs pt-6 border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            &copy; {new Date().getFullYear()} StudyFlow. Built in Australia.
          </div>
        </div>
      </footer>
    </div>
  )
}
