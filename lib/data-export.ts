/**
 * GDPR Data Export — Right to Data Portability
 * ==============================================
 * Exports all user data as a downloadable JSON file.
 */

import * as DB from './db'

export async function exportUserData(userId: string): Promise<void> {
  // Collect all user data from all collections
  const [
    user,
    testResults,
    learnerProgress,
    gamification,
    aiConfig,
    spacedRep,
  ] = await Promise.all([
    DB.getUser(userId),
    DB.getTestResultsForUser(userId),
    DB.getLearnerProgress(userId),
    DB.getGamification(userId),
    DB.getAiConfig(userId),
    DB.getSpacedRepData(userId),
  ])

  const exportData = {
    exportDate: new Date().toISOString(),
    exportVersion: '1.0',
    platform: 'StudyFlow',
    user: {
      ...user,
      // Remove sensitive fields
      stripeCustomerId: undefined,
    },
    gamification,
    testResults,
    learnerProgress,
    spacedRepetition: spacedRep,
    aiConfig: aiConfig ? {
      ...aiConfig,
      // Mask API keys
      providers: Object.fromEntries(
        Object.entries(aiConfig.providers || {}).map(([k, v]: [string, any]) => [
          k,
          { ...v, key: v.key ? `${v.key.slice(0, 8)}...${v.key.slice(-4)}` : null }
        ])
      ),
    } : null,
  }

  // Create and download JSON file
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `studyflow-data-export-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
