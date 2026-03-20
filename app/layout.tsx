import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'StudyFlow — AI-Powered Learning for Australian Students & Schools',
  description: 'Create AI-powered courses, practice with adaptive tests, and track progress. Built for Australian students and schools, aligned to ACARA curriculum. NAPLAN practice, LMS integration, and more.',
  keywords: ['StudyFlow', 'AI learning', 'Australian education', 'NAPLAN practice', 'study app', 'school LMS', 'SEQTA', 'Canvas', 'Moodle', 'Australian Curriculum', 'high school'],
  authors: [{ name: 'StudyFlow' }],
  openGraph: {
    title: 'StudyFlow — AI-Powered Learning Platform',
    description: 'Create, learn, test, and track progress with AI. Built for Australian students and schools.',
    url: 'https://studyflow-f2e7a.web.app',
    siteName: 'StudyFlow',
    type: 'website',
    locale: 'en_AU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StudyFlow — AI-Powered Learning',
    description: 'Smart learning platform for Australian students. NAPLAN practice, AI tutoring, school integration.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://studyflow-f2e7a.web.app' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'StudyFlow',
              url: 'https://studyflow-f2e7a.web.app',
              description: 'AI-powered learning platform for Australian students and schools',
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'AUD',
                description: 'Free tier with core features',
              },
              author: {
                '@type': 'Organization',
                name: 'StudyFlow',
                url: 'https://studyflow-f2e7a.web.app',
              },
              audience: {
                '@type': 'EducationalAudience',
                educationalRole: 'student',
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen">
        <a href="#main-content" className="skip-to-content">Skip to main content</a>
        <Providers>
          <main id="main-content" role="main">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
