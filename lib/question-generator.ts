import { genId, shuffle, pickRandom } from './constants'
import type { Fact, TestPatterns } from './content-engine'

export interface Question {
  id: string
  type: 'mcq' | 'truefalse' | 'selectall'
  category: string
  question: string
  options?: Array<{ text: string; correct: boolean }>
  correctAnswer?: any
  explanation: string
  fact: Fact
}

// ============================================================
// MAIN GENERATOR
// ============================================================
export function generateQuestions(
  facts: Fact[], categories: string[], count: number = 10,
  filterCats: string[] | null = null, testPatterns: TestPatterns | null = null,
  scope: 'all' | 'practice' = 'all'
): Question[] {
  let pool = [...facts]
  if (filterCats && filterCats.length > 0) pool = pool.filter(f => filterCats.includes(f.category))

  // Practice-test-only scope
  if (scope === 'practice' && testPatterns && testPatterns.topicsCovered.length > 0) {
    const topics = testPatterns.topicsCovered.map(t => t.toLowerCase())
    const practicePool = pool.filter(f => {
      const fText = (f.text + ' ' + f.category + ' ' + (f.detail || '')).toLowerCase()
      return topics.some(t => fText.includes(t))
    })
    if (practicePool.length >= 3) pool = practicePool
  }

  if (pool.length < 3) pool = [...facts]
  if (pool.length < 2) return []

  const selected = pickRandom(pool, Math.min(count * 2, pool.length))
  const questions: Question[] = []

  // 70% MCQ, 15% True/False, 15% Select All
  const typeWeights: Array<'mcq' | 'truefalse' | 'selectall'> = ['mcq', 'mcq', 'mcq', 'mcq', 'mcq', 'mcq', 'mcq', 'truefalse', 'truefalse', 'selectall']

  for (let i = 0; i < Math.min(count, selected.length); i++) {
    const fact = selected[i]
    const type = typeWeights[Math.floor(Math.random() * typeWeights.length)]
    questions.push(createQuestion(fact, type, pool))
  }

  return shuffle(questions)
}

function createQuestion(fact: Fact, type: 'mcq' | 'truefalse' | 'selectall', allFacts: Fact[]): Question {
  switch (type) {
    case 'mcq': return createMCQ(fact, allFacts)
    case 'truefalse': return createTrueFalse(fact, allFacts)
    case 'selectall': return createSelectAll(fact, allFacts)
    default: return createMCQ(fact, allFacts)
  }
}

// ============================================================
// MCQ — "Which of these is true about [category]?"
// ============================================================
function createMCQ(fact: Fact, allFacts: Fact[]): Question {
  const others = allFacts.filter(f => f.id !== fact.id)

  // Try definition-based
  const defMatch = fact.text.match(/^(?:An?\s+)?([A-Za-z][A-Za-z\s']{2,35}?)\s+(?:is|are|refers to|means|represents|describes|occurs?|measures?|states?)\s+(.+?)(?:\.|$)/i)

  let question: string
  let correctAnswer: string
  let distractors: string[]

  if (defMatch && others.length >= 3) {
    question = `What is ${defMatch[1].toLowerCase()}?`
    correctAnswer = defMatch[2].charAt(0).toUpperCase() + defMatch[2].slice(1)
    const otherDefs = others
      .map(f => f.text.match(/^(?:An?\s+)?([A-Za-z][A-Za-z\s']{2,35}?)\s+(?:is|are|refers to|means)\s+(.+?)(?:\.|$)/i))
      .filter(Boolean)
      .map(m => m![2].charAt(0).toUpperCase() + m![2].slice(1))
    distractors = otherDefs.length >= 3 ? pickRandom(otherDefs, 3) : pickRandom(others, 3).map(f => f.text.split('.')[0])
  } else {
    const diffCat = others.filter(f => f.category !== fact.category)
    const pool = diffCat.length >= 3 ? diffCat : others
    question = `Which of these is true about ${fact.category}?`
    correctAnswer = fact.text.split('.')[0]
    distractors = pickRandom(pool, 3).map(f => f.text.split('.')[0])
  }

  correctAnswer = correctAnswer.slice(0, 100)
  distractors = distractors.map(d => d.slice(0, 100))

  const options = shuffle([
    { text: correctAnswer, correct: true },
    ...distractors.slice(0, 3).map(d => ({ text: d, correct: false })),
  ])

  return {
    id: genId(), type: 'mcq', category: fact.category, fact,
    question, options, correctAnswer,
    explanation: fact.text + (fact.detail ? ' — ' + fact.detail : ''),
  }
}

// ============================================================
// TRUE/FALSE
// ============================================================
function createTrueFalse(fact: Fact, allFacts: Fact[]): Question {
  const isTrue = Math.random() > 0.45
  const others = allFacts.filter(f => f.id !== fact.id)
  let statement: string
  let explanation: string

  if (isTrue) {
    statement = fact.text.split('.')[0] + '.'
    explanation = `Correct! ${fact.text}`
  } else {
    const defMatch = fact.text.match(/^(?:An?\s+)?([A-Za-z][A-Za-z\s']{2,35}?)\s+(?:is|are|refers to|means)\s+(.+?)(?:\.|$)/i)
    if (defMatch) {
      const otherDef = others.map(f => f.text.match(/^(?:An?\s+)?([A-Za-z][A-Za-z\s']{2,35}?)\s+(?:is|are|refers to|means)\s+(.+?)(?:\.|$)/i)).find(Boolean)
      statement = otherDef ? `${defMatch[1]} is ${otherDef[2]}.` : `${defMatch[1]} has nothing to do with ${defMatch[2]}.`
    } else {
      statement = fact.text.split('.')[0] + ' — this never happens.'
    }
    explanation = `False. The correct info: ${fact.text}`
  }

  return {
    id: genId(), type: 'truefalse', category: fact.category, fact,
    question: `True or False: ${statement}`,
    correctAnswer: isTrue,
    explanation,
  }
}

// ============================================================
// SELECT ALL THAT APPLY
// ============================================================
function createSelectAll(fact: Fact, allFacts: Fact[]): Question {
  const others = allFacts.filter(f => f.id !== fact.id)
  const sameCat = others.filter(f => f.category === fact.category)
  const diffCat = others.filter(f => f.category !== fact.category)

  let question: string
  let correctOptions: string[]
  let wrongOptions: string[]

  if (sameCat.length >= 1 && diffCat.length >= 2) {
    question = `Select ALL that are related to ${fact.category}:`
    const correctFacts = [fact, ...pickRandom(sameCat, Math.min(1, sameCat.length))]
    correctOptions = correctFacts.map(f => f.text.split('.')[0].slice(0, 90))
    wrongOptions = pickRandom(diffCat, 2).map(f => f.text.split('.')[0].slice(0, 90))
  } else {
    question = 'Select ALL the true statements:'
    const correct2 = pickRandom(others, 1)
    correctOptions = [fact, ...correct2].map(f => f.text.split('.')[0].slice(0, 90))
    wrongOptions = pickRandom(others, 2).map(f => {
      const d = f.text.match(/^(?:An?\s+)?([A-Za-z][A-Za-z\s']{2,35}?)/)
      return d ? `${d[1]} has nothing to do with ${f.category}` : f.text.split('.')[0].slice(0, 60) + ' — this never happens'
    })
  }

  const options = shuffle([
    ...correctOptions.map(t => ({ text: t, correct: true })),
    ...wrongOptions.map(t => ({ text: t, correct: false })),
  ])

  return {
    id: genId(), type: 'selectall', category: fact.category, fact,
    question, options,
    explanation: fact.text + (fact.detail ? ' — ' + fact.detail : ''),
  }
}
