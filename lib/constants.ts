export const SUBJECTS = [
  'Mathematics', 'English', 'Science', 'HAAS (Humanities)', 'Religion',
  'Sport & PE', 'IT / Digital Tech', 'Art & Design', 'Music',
  'Languages', 'Health', 'Business', 'Other'
]

export const YEAR_LEVELS = ['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12']

export const COUNTRIES = [
  { code: 'AU', name: 'Australia', curriculum: 'Australian Curriculum (ACARA)' },
  { code: 'NZ', name: 'New Zealand', curriculum: 'New Zealand Curriculum (NZC)' },
  { code: 'GB', name: 'United Kingdom', curriculum: 'National Curriculum (England)' },
  { code: 'US', name: 'United States', curriculum: 'Common Core State Standards' },
  { code: 'CA', name: 'Canada', curriculum: 'Provincial Curricula' },
  { code: 'SG', name: 'Singapore', curriculum: 'Singapore Curriculum' },
  { code: 'IE', name: 'Ireland', curriculum: 'Junior/Leaving Certificate' },
  { code: 'IN', name: 'India', curriculum: 'CBSE / ICSE' },
  { code: 'ZA', name: 'South Africa', curriculum: 'CAPS Curriculum' },
  { code: 'HK', name: 'Hong Kong', curriculum: 'HKDSE Curriculum' },
  { code: 'OTHER', name: 'Other', curriculum: '' },
]

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

/** AI providers for content generation */
export const AI_PROVIDERS = [
  {
    id: 'anthropic', name: 'Claude', company: 'Anthropic', icon: '🟣', color: '#6c5ce7',
    signupUrl: 'https://console.anthropic.com/signup', consoleUrl: 'https://console.anthropic.com',
    keyPrefix: 'sk-ant-', keyPlaceholder: 'sk-ant-api03-...',
    models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-haiku-4-20250414'],
    modelLabels: ['Claude Sonnet 4', 'Claude Opus 4 (most capable)', 'Claude Haiku 4 (fastest)'],
    freeCredit: '$5 free credit for new accounts',
    strengths: 'Excellent at educational content, nuanced explanations, curriculum alignment',
    steps: ['Go to console.anthropic.com', 'Sign up or log in', 'Navigate to API Keys', 'Click "Create Key" and copy it'],
  },
  {
    id: 'openai', name: 'ChatGPT', company: 'OpenAI', icon: '🟢', color: '#00a67e',
    signupUrl: 'https://platform.openai.com/signup', consoleUrl: 'https://platform.openai.com',
    keyPrefix: 'sk-', keyPlaceholder: 'sk-proj-...',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    modelLabels: ['GPT-4o (recommended)', 'GPT-4o Mini (fastest)', 'GPT-4 Turbo'],
    freeCredit: '',
    strengths: 'Strong general knowledge, good at structured content and quizzes',
    steps: ['Go to platform.openai.com', 'Sign up or log in', 'Go to API Keys in your profile', 'Click "Create new secret key" and copy it'],
  },
  {
    id: 'google', name: 'Gemini', company: 'Google', icon: '🔵', color: '#4285f4',
    signupUrl: 'https://aistudio.google.com/', consoleUrl: 'https://aistudio.google.com/',
    keyPrefix: 'AI', keyPlaceholder: 'AIza...',
    models: ['gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-2.5-flash'],
    modelLabels: ['Gemini 2.0 Flash (fast)', 'Gemini 2.5 Pro (most capable)', 'Gemini 2.5 Flash'],
    freeCredit: 'Free tier available with generous limits',
    strengths: 'Excellent at research synthesis, strong in STEM subjects, multilingual',
    steps: ['Go to aistudio.google.com', 'Sign in with Google account', 'Click "Get API Key"', 'Create key in a project and copy it'],
  },
  {
    id: 'xai', name: 'Grok', company: 'xAI', icon: '⚡', color: '#1da1f2',
    signupUrl: 'https://console.x.ai/', consoleUrl: 'https://console.x.ai/',
    keyPrefix: 'xai-', keyPlaceholder: 'xai-...',
    models: ['grok-3', 'grok-3-mini'],
    modelLabels: ['Grok 3 (most capable)', 'Grok 3 Mini (fast)'],
    freeCredit: '$25 free monthly credit',
    strengths: 'Strong reasoning, up-to-date knowledge, good at explanations',
    steps: ['Go to console.x.ai', 'Sign up with your X/Twitter or email', 'Navigate to API Keys', 'Create a new key and copy it'],
  },
  {
    id: 'perplexity', name: 'Perplexity', company: 'Perplexity AI', icon: '🔍', color: '#20b2aa',
    signupUrl: 'https://www.perplexity.ai/settings/api', consoleUrl: 'https://www.perplexity.ai/settings/api',
    keyPrefix: 'pplx-', keyPlaceholder: 'pplx-...',
    models: ['sonar-pro', 'sonar'],
    modelLabels: ['Sonar Pro (research-grade)', 'Sonar (fast)'],
    freeCredit: '',
    strengths: 'Best for research — searches the web and cites real sources for facts',
    steps: ['Go to perplexity.ai/settings/api', 'Sign up or log in', 'Generate an API key', 'Copy the key'],
  },
]

export const DEFAULT_TEMPLATES = [
  { id: 'blank', name: 'Blank Course', icon: '📄', subject: '', yearLevel: '', description: '', autoResearch: false },
  { id: 'ai-generated', name: 'AI Generated', icon: '🤖', subject: '', yearLevel: '', description: '', autoResearch: true },
]

/** Subject-specific topic trees for dynamic AI form */
export const SUBJECT_TOPICS: Record<string, { label: string; topics: string[] }> = {
  'Mathematics': {
    label: 'Maths Topics',
    topics: [
      'Number & Algebra', 'Algebra — Linear Equations', 'Algebra — Quadratics',
      'Fractions, Decimals & Percentages', 'Ratios & Proportions',
      'Measurement — Area & Perimeter', 'Measurement — Volume & Surface Area',
      'Geometry — Angles & Triangles', 'Geometry — Circles', 'Geometry — Coordinate Geometry',
      'Statistics & Probability', 'Data Representation & Interpretation',
      'Trigonometry', 'Financial Maths', 'Indices & Surds', 'Functions & Graphs',
      'Calculus (Senior)', 'Vectors (Senior)', 'Matrices (Senior)',
    ],
  },
  'English': {
    label: 'English Topics',
    topics: [
      'Reading Comprehension', 'Persuasive Writing', 'Narrative Writing',
      'Poetry Analysis', 'Essay Writing', 'Shakespeare',
      'Media Literacy', 'Grammar & Punctuation', 'Vocabulary Building',
      'Public Speaking & Oral Presentation', 'Film Study',
      'Novel Study', 'Short Story Analysis', 'Non-Fiction Analysis',
      'Creative Writing Techniques', 'Comparative Analysis',
    ],
  },
  'Science': {
    label: 'Science Topics',
    topics: [
      'Biology — Cells & Organisms', 'Biology — Genetics & DNA', 'Biology — Ecosystems',
      'Biology — Human Body Systems', 'Biology — Evolution',
      'Chemistry — Atoms & Elements', 'Chemistry — Chemical Reactions',
      'Chemistry — Acids & Bases', 'Chemistry — Periodic Table',
      'Physics — Forces & Motion', 'Physics — Energy & Electricity',
      'Physics — Waves & Sound', 'Physics — Light & Optics',
      'Earth Science — Geology', 'Earth Science — Weather & Climate',
      'Space Science', 'Scientific Method & Investigation',
    ],
  },
  'HAAS (Humanities)': {
    label: 'Humanities Topics',
    topics: [
      'Ancient History — Egypt', 'Ancient History — Rome', 'Ancient History — Greece',
      'Medieval History', 'World War I', 'World War II',
      'Australian History — Indigenous', 'Australian History — Federation',
      'Geography — Natural Hazards', 'Geography — Water Resources',
      'Geography — Urbanisation', 'Geography — Biomes & Climate',
      'Civics & Citizenship', 'Economics & Business',
      'Asian Studies', 'Migration & Multicultural Australia',
    ],
  },
  'Religion': {
    label: 'Religion Topics',
    topics: [
      'Christianity — Old Testament', 'Christianity — New Testament',
      'Christianity — Sacraments', 'Christianity — Ethics & Morality',
      'World Religions Overview', 'Islam', 'Judaism', 'Buddhism', 'Hinduism',
      'Social Justice & Faith', 'Prayer & Spirituality',
      'Church History', 'Catholic Social Teaching',
    ],
  },
  'Sport & PE': {
    label: 'Sport & PE Topics',
    topics: [
      'Fitness Components', 'Training Principles & Methods',
      'Anatomy & Physiology', 'Nutrition & Diet',
      'Sport Psychology', 'Biomechanics',
      'Game Strategies & Tactics', 'Health & Wellbeing',
      'Drug Education', 'First Aid & Safety',
    ],
  },
  'IT / Digital Tech': {
    label: 'IT Topics',
    topics: [
      'Programming Fundamentals', 'Python', 'Web Development (HTML/CSS/JS)',
      'Databases & SQL', 'Algorithms & Data Structures',
      'Cybersecurity', 'Digital Citizenship & Online Safety',
      'Networking Basics', 'AI & Machine Learning Concepts',
      'Robotics', 'Game Development', 'App Development',
    ],
  },
  'Art & Design': {
    label: 'Art & Design Topics',
    topics: [
      'Drawing Techniques', 'Painting', 'Printmaking', 'Sculpture',
      'Art History — Movements', 'Visual Analysis',
      'Graphic Design', 'Photography', 'Digital Art',
      'Textiles & Fashion', 'Ceramics',
    ],
  },
  'Music': {
    label: 'Music Topics',
    topics: [
      'Music Theory — Basics', 'Music Theory — Harmony & Chords',
      'Rhythm & Time Signatures', 'Composition',
      'Music History — Classical', 'Music History — Modern',
      'Listening & Analysis', 'Performance Skills',
      'Instruments — Keyboard', 'Instruments — Guitar', 'Instruments — Percussion',
      'Film Music', 'World Music', 'Music Technology',
    ],
  },
  'Languages': {
    label: 'Language Focus',
    topics: [
      'French', 'Japanese', 'Mandarin Chinese', 'Italian', 'German', 'Spanish',
      'Indonesian', 'Korean', 'Arabic', 'Vietnamese',
      'Vocabulary & Grammar', 'Listening & Speaking', 'Reading & Writing', 'Culture',
    ],
  },
  'Health': {
    label: 'Health Topics',
    topics: [
      'Mental Health & Wellbeing', 'Nutrition', 'Puberty & Adolescence',
      'Relationships & Communication', 'Respectful Relationships',
      'Drug & Alcohol Education', 'Sexual Health',
      'Stress Management', 'Body Image', 'Community Health',
    ],
  },
  'Business': {
    label: 'Business Topics',
    topics: [
      'Entrepreneurship', 'Marketing', 'Financial Literacy',
      'Accounting Basics', 'Business Planning',
      'Economics — Supply & Demand', 'Economics — Market Structures',
      'Management & Leadership', 'Legal Studies', 'Workplace Relations',
    ],
  },
}
