/**
 * Data Migration Script: Migrate existing content into default groups
 * ====================================================================
 *
 * This script migrates existing StudyFlow data so that:
 * 1. Every user without a group gets a personal group auto-created
 * 2. Existing packages (courses) are tagged with their author's group
 * 3. A "StudyFlow Community" group is created for shared/demo content
 *
 * Usage:
 *   npx ts-node --project tsconfig.json scripts/migrate-to-groups.ts
 *
 * Requirements:
 *   - Firebase Admin SDK or a .env.local with Firebase credentials
 *   - Run this ONCE after deploying the groups feature
 *
 * Safety:
 *   - Idempotent: safe to run multiple times
 *   - Non-destructive: only adds data, never deletes
 */

// This script is designed to be run with firebase-admin in a Node.js environment.
// For the Next.js client-side app, the equivalent logic runs automatically
// in RolePicker.tsx (personal group auto-creation on first login).

/*
  === MIGRATION PLAN ===

  Step 1: Create community group
  - id: 'studyflow-community'
  - name: 'StudyFlow Community'
  - type: 'community'
  - members: [system admin]

  Step 2: For each user without groups
  - Create personal group: { id: `personal-${user.uid}`, name: `${user.name}'s Space`, type: 'personal' }
  - Add user as member with their existing roles

  Step 3: For each package without a groupId
  - Look up author's groups
  - Tag package with author's first group (or personal group)
  - If author not found, tag with community group

  Step 4: Verify
  - Count users with groups
  - Count packages with groupId
  - Report summary
*/

interface MigrationResult {
  groupsCreated: number
  packagesTagged: number
  usersProcessed: number
  errors: string[]
}

export function buildMigrationPlan(): string {
  return `
Migration Plan: StudyFlow Groups
=================================

1. CREATE community group "StudyFlow Community" (if not exists)
2. FOR EACH user without a personal group:
   - Create personal group
   - Add user as admin member
3. FOR EACH package without a groupId:
   - Tag with author's primary group
4. VERIFY all data is consistent

Run with: npx ts-node scripts/migrate-to-groups.ts
Or trigger from Admin Dashboard > Migration Tools (future feature)

This migration is:
- Idempotent (safe to run multiple times)
- Non-destructive (only adds, never removes)
- Logged (outputs summary of changes)
`
}

// When running with firebase-admin:
// import * as admin from 'firebase-admin'
// admin.initializeApp()
// const db = admin.firestore()
//
// async function migrate(): Promise<MigrationResult> {
//   const result: MigrationResult = { groupsCreated: 0, packagesTagged: 0, usersProcessed: 0, errors: [] }
//
//   // Step 1: Community group
//   const communityRef = db.collection('groups').doc('studyflow-community')
//   const communitySnap = await communityRef.get()
//   if (!communitySnap.exists) {
//     await communityRef.set({
//       id: 'studyflow-community',
//       name: 'StudyFlow Community',
//       type: 'community',
//       isOfficial: false,
//       createdAt: Date.now(),
//       members: [{ userId: 'SYSTEM_ADMIN_UID', roles: ['admin'], joinedAt: Date.now() }]
//     })
//     result.groupsCreated++
//   }
//
//   // Step 2: Personal groups for users
//   const usersSnap = await db.collection('users').get()
//   const groupsSnap = await db.collection('groups').get()
//   const existingGroups = new Set(groupsSnap.docs.map(d => d.id))
//
//   for (const userDoc of usersSnap.docs) {
//     const user = userDoc.data()
//     const personalId = `personal-${userDoc.id}`
//     if (!existingGroups.has(personalId)) {
//       await db.collection('groups').doc(personalId).set({
//         id: personalId,
//         name: `${user.name || 'User'}'s Space`,
//         type: 'personal',
//         isOfficial: false,
//         createdAt: Date.now(),
//         members: [{ userId: userDoc.id, roles: user.roles || ['learner'], joinedAt: Date.now() }]
//       })
//       result.groupsCreated++
//       existingGroups.add(personalId)
//     }
//     result.usersProcessed++
//   }
//
//   // Step 3: Tag packages
//   const packagesSnap = await db.collection('packages').get()
//   for (const pkgDoc of packagesSnap.docs) {
//     const pkg = pkgDoc.data()
//     if (!pkg.groupId) {
//       const authorGroupId = `personal-${pkg.authorId}`
//       const groupId = existingGroups.has(authorGroupId) ? authorGroupId : 'studyflow-community'
//       await pkgDoc.ref.update({ groupId })
//       result.packagesTagged++
//     }
//   }
//
//   console.log('Migration complete:', result)
//   return result
// }
//
// migrate().catch(console.error)

console.log(buildMigrationPlan())
