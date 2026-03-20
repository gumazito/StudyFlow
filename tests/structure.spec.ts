import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const ROOT = path.resolve(__dirname, '..')

test.describe('Project Structure', () => {
  test('required config files exist', () => {
    const requiredFiles = [
      'next.config.js',
      'package.json',
      'tsconfig.json',
      'tailwind.config.ts',
      'firebase.json',
      '.firebaserc',
      'firestore.rules',
      'firestore.indexes.json',
      'app/layout.tsx',
      'app/page.tsx',
      'app/providers.tsx',
      'app/globals.css',
      'lib/firebase.ts',
      'lib/db.ts',
      'lib/constants.ts',
    ]
    for (const file of requiredFiles) {
      expect(fs.existsSync(path.join(ROOT, file)), `Missing: ${file}`).toBe(true)
    }
  })

  test('all component files exist', () => {
    const componentFiles = [
      'components/auth/AuthScreen.tsx',
      'components/admin/AdminDashboard.tsx',
      'components/publisher/PublisherDashboard.tsx',
      'components/publisher/PackageEditor.tsx',
      'components/publisher/CrossPublishPanel.tsx',
      'components/publisher/PdfExport.tsx',
      'components/learner/LearnerDashboard.tsx',
      'components/mentor/MentorDashboard.tsx',
      'components/groups/GroupsView.tsx',
      'components/groups/VerificationForm.tsx',
      'components/groups/JoinRequestsPanel.tsx',
      'components/profile/ProfileScreen.tsx',
      'components/layout/RolePicker.tsx',
    ]
    for (const file of componentFiles) {
      expect(fs.existsSync(path.join(ROOT, file)), `Missing: ${file}`).toBe(true)
    }
  })

  test('context providers exist', () => {
    const contextFiles = [
      'lib/contexts/AuthContext.tsx',
      'lib/contexts/ThemeContext.tsx',
    ]
    for (const file of contextFiles) {
      expect(fs.existsSync(path.join(ROOT, file)), `Missing: ${file}`).toBe(true)
    }
  })

  test('package.json has correct scripts', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
    expect(pkg.scripts.dev).toBeDefined()
    expect(pkg.scripts.build).toBeDefined()
    expect(pkg.scripts.deploy).toBeDefined()
    expect(pkg.scripts['deploy:staging']).toBeDefined()
    expect(pkg.scripts['type-check']).toBeDefined()
  })

  test('firebase.json references firestore rules', () => {
    const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'firebase.json'), 'utf8'))
    expect(config.firestore).toBeDefined()
    expect(config.firestore.rules).toBe('firestore.rules')
    expect(config.firestore.indexes).toBe('firestore.indexes.json')
  })

  test('no API keys or secrets in source files', () => {
    const filesToCheck = [
      'lib/firebase.ts',
      'next.config.js',
      'app/layout.tsx',
    ]
    for (const file of filesToCheck) {
      const content = fs.readFileSync(path.join(ROOT, file), 'utf8')
      // Should not contain hardcoded Firebase keys
      expect(content).not.toMatch(/AIza[a-zA-Z0-9_-]{35}/)
      // Should reference env vars instead
      if (file === 'lib/firebase.ts') {
        expect(content).toContain('process.env.NEXT_PUBLIC_FIREBASE')
      }
    }
  })
})
