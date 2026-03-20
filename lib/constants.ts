export const SUBJECTS = [
  'Mathematics', 'English', 'Science', 'HAAS (Humanities)', 'Religion',
  'Sport & PE', 'IT / Digital Tech', 'Art & Design', 'Music',
  'Languages', 'Health', 'Business', 'Other'
]

export const YEAR_LEVELS = ['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12']

export const GROUP_TYPES = [
  { id: 'school', name: 'School', icon: '🏫', desc: 'A school or educational institution' },
  { id: 'company', name: 'Company / Organisation', icon: '🏢', desc: 'A business or workplace' },
  { id: 'personal', name: 'Personal', icon: '👤', desc: 'Personal study space' },
  { id: 'community', name: 'Community', icon: '🌐', desc: 'Open community group' },
  { id: 'other', name: 'Other', icon: '📁', desc: 'Other type of group' },
]

export const XP_VALUES = {
  learn_session: 10,
  test_complete: 25,
  test_pass: 50,
  perfect_score: 100,
  streak_bonus: 15,
}

export const BADGES = [
  { id: 'first_test', name: 'First Steps', icon: '🎯', desc: 'Complete your first test', check: (g: any) => g.testsCompleted >= 1 },
  { id: 'five_tests', name: 'Quiz Whiz', icon: '📝', desc: 'Complete 5 tests', check: (g: any) => g.testsCompleted >= 5 },
  { id: 'twenty_tests', name: 'Test Master', icon: '🏆', desc: 'Complete 20 tests', check: (g: any) => g.testsCompleted >= 20 },
  { id: 'perfect', name: 'Perfect Score', icon: '💯', desc: 'Get 100% on a test', check: (g: any) => g.perfectScores >= 1 },
  { id: 'streak3', name: 'On Fire', icon: '🔥', desc: '3-day streak', check: (g: any) => g.bestStreak >= 3 },
  { id: 'streak7', name: 'Unstoppable', icon: '⚡', desc: '7-day streak', check: (g: any) => g.bestStreak >= 7 },
  { id: 'streak30', name: 'Legendary', icon: '👑', desc: '30-day streak', check: (g: any) => g.bestStreak >= 30 },
  { id: 'xp500', name: 'Rising Star', icon: '🌟', desc: 'Earn 500 XP', check: (g: any) => g.xp >= 500 },
  { id: 'xp2000', name: 'Scholar', icon: '🎓', desc: 'Earn 2000 XP', check: (g: any) => g.xp >= 2000 },
  { id: 'courses5', name: 'Explorer', icon: '🗺️', desc: 'Access 5 courses', check: (g: any) => g.coursesAccessed >= 5 },
]

export const LEVELS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000]

export function getLevel(xp: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i]) return i + 1
  }
  return 1
}

export function getXpForNextLevel(xp: number): number | null {
  const lvl = getLevel(xp)
  return lvl >= LEVELS.length ? null : LEVELS[lvl]
}

export function genId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n)
}

export const EMOJIS = ['📚', '🧠', '💡', '🔬', '📐', '🌍', '🧪', '📊', '🎯', '⚡', '🔢', '📝', '🎨', '🧬', '🌟', '💫', '🔭', '📖', '✨', '🎓']
export function getEmoji(i: number): string { return EMOJIS[i % EMOJIS.length] }

export const DEFAULT_TEMPLATES = [
  { id: 'blank', name: 'Blank Course', icon: '📄', subject: '', yearLevel: '', description: '', autoResearch: false },
  { id: 'auto-research', name: 'AI-Researched Course', icon: '🤖', subject: '', yearLevel: '', description: '', autoResearch: true },
  { id: 'practice-test', name: 'Practice Test Prep', icon: '📝', subject: '', yearLevel: '', description: 'Upload a practice test and let AI generate learning material to prepare students.', autoResearch: true },
  { id: 'maths-yr7', name: 'Year 7 Maths', icon: '📐', subject: 'Mathematics', yearLevel: 'Year 7', description: 'Year 7 Mathematics fundamentals', autoResearch: true },
  { id: 'maths-yr8', name: 'Year 8 Maths', icon: '📐', subject: 'Mathematics', yearLevel: 'Year 8', description: 'Year 8 Mathematics fundamentals', autoResearch: true },
  { id: 'science-yr7', name: 'Year 7 Science', icon: '🔬', subject: 'Science', yearLevel: 'Year 7', description: 'Year 7 Science fundamentals', autoResearch: true },
  { id: 'english-yr8', name: 'Year 8 English', icon: '📖', subject: 'English', yearLevel: 'Year 8', description: 'Year 8 English fundamentals', autoResearch: true },
]
