import { genId } from './constants'

// ============================================================
// FILE PARSING — Client-side extraction
// ============================================================
export async function parseFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (['txt', 'md', 'csv'].includes(ext)) return await file.text()
  if (ext === 'pdf') return await parsePDF(file)
  if (ext === 'html' || ext === 'htm') {
    const text = await file.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/html')
    return doc.body.innerText
  }
  return await file.text()
}

async function parsePDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  // Use CDN version of PDF.js to avoid canvas dependency at build time
  if (typeof window !== 'undefined' && !(window as any).pdfjsLib) {
    await new Promise<void>((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = () => {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        resolve()
      }
      document.head.appendChild(script)
    })
  }
  const pdfjsLib = (window as any).pdfjsLib
  if (!pdfjsLib) throw new Error('PDF.js not loaded')
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((item: any) => item.str).join(' ') + '\n\n'
  }
  return text
}

// ============================================================
// RESEARCH FACT EXTRACTION
// ============================================================
export interface Fact {
  id: string
  text: string
  detail: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  aiGenerated?: boolean
}

export function extractResearchFacts(rawText: string, topicName: string): { facts: Fact[]; categories: string[] } {
  const paragraphs = rawText.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 20 && p.length < 2000)
  const facts: Fact[] = []
  const categories = new Set<string>()

  paragraphs.forEach(para => {
    const sentences = para.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 15 && s.length < 500)
    let cat = topicName
    const hm = para.match(/^#+\s*(.+)/m) || para.match(/^([A-Z][A-Za-z\s]{2,30}):/)
    if (hm) { cat = hm[1].trim().slice(0, 40); categories.add(cat) }
    sentences.forEach(sentence => {
      facts.push({
        id: genId(),
        text: sentence,
        detail: para.length > sentence.length ? para.replace(sentence, '').trim().slice(0, 200) : '',
        category: cat,
        difficulty: sentence.length > 100 ? 'hard' : sentence.length > 50 ? 'medium' : 'easy',
      })
    })
  })

  if (categories.size === 0) categories.add(topicName)
  return { facts: facts.slice(0, 300), categories: [...categories].slice(0, 20) }
}

// ============================================================
// PRACTICE TEST PATTERN DETECTION
// ============================================================
export interface TestPatterns {
  questionStyles: string[]
  topicsCovered: string[]
  sampleQuestions: Array<{ text: string; options: string[]; answer: string }>
  keyTerms: Set<string>
}

export function extractTestPatterns(rawText: string): TestPatterns {
  const patterns: TestPatterns = {
    questionStyles: [],
    topicsCovered: [],
    sampleQuestions: [],
    keyTerms: new Set(),
  }

  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  let currentQ: { text: string; options: string[]; answer: string } | null = null

  lines.forEach(line => {
    const qMatch = line.match(/^(\d+[\.\)]\s*|Q\d+[\.\):\s]|Question\s*\d+)/i)
    const isQuestion = qMatch || (line.endsWith('?') && line.length > 15)

    if (isQuestion) {
      if (currentQ) patterns.sampleQuestions.push(currentQ)
      const qText = qMatch ? line.replace(qMatch[0], '').trim() : line
      currentQ = { text: qText, options: [], answer: '' }
      return
    }
    const optMatch = line.match(/^[A-Da-d][\.\)]\s*/)
    if (optMatch && currentQ) { currentQ.options.push(line.replace(optMatch[0], '').trim()); return }
    const ansMatch = line.match(/^(Answer|Ans|Correct)[:\s]*(.*)/i)
    if (ansMatch && currentQ) { currentQ.answer = ansMatch[2].trim(); return }
    if (/true\s*(?:or|\/)\s*false/i.test(line)) patterns.questionStyles.push('truefalse')
    if (/_{2,}|\.{3,}|\[blank\]/i.test(line)) patterns.questionStyles.push('fillin')
  })

  if (currentQ) patterns.sampleQuestions.push(currentQ)

  // Extract domain terms
  const domainTerms = /\b(water cycle|evaporation|condensation|precipitation|transpiration|infiltration|runoff|groundwater|climate|weather|latitude|longitude|equator|hemisphere|photosynthesis|respiration|ecosystem|cell|atom|molecule|equation|fraction|algebra|geometry|ratio|percentage|probability|force|gravity|energy|velocity|acceleration|erosion|volcano|earthquake)\b/gi
  const allText = rawText.toLowerCase()
  const foundTerms = new Set<string>()
  let match
  const regex = new RegExp(domainTerms.source, 'gi')
  while ((match = regex.exec(allText)) !== null) {
    foundTerms.add(match[0].toLowerCase())
  }

  // Extract from questions
  patterns.sampleQuestions.forEach(q => {
    const whatIs = q.text.match(/what\s+(?:is|are)\s+(.+?)(?:\?|$)/i)
    if (whatIs) foundTerms.add(whatIs[1].toLowerCase().replace(/[?.]/g, '').trim())
    const describe = q.text.match(/(?:describe|explain|highlight|discuss)\s+(?:the\s+)?(.+?)(?:\?|\.|$)/i)
    if (describe) foundTerms.add(describe[1].toLowerCase().replace(/[?.]/g, '').trim())

    if (q.options.length >= 2) patterns.questionStyles.push('mcq')
    else if (/true|false/i.test(q.answer)) patterns.questionStyles.push('truefalse')
    else if (/describe|explain|discuss|how|why/i.test(q.text)) patterns.questionStyles.push('written')
    else patterns.questionStyles.push('mcq')
  })

  const cleanTerms = [...foundTerms].filter(t =>
    t.length > 2 && !['the', 'and', 'for', 'that', 'this', 'with', 'from', 'are', 'was', 'how', 'what', 'does'].includes(t)
  )

  patterns.topicsCovered = cleanTerms
  patterns.keyTerms = new Set(cleanTerms)
  patterns.questionStyles = [...new Set(patterns.questionStyles)]
  if (patterns.questionStyles.length === 0) patterns.questionStyles = ['mcq', 'truefalse', 'selectall']

  return patterns
}

// ============================================================
// AI AUTO-RESEARCH — calls Claude or ChatGPT API
// ============================================================
export async function aiAutoResearch(
  subject: string, yearLevel: string, packageName: string,
  testPatterns: TestPatterns | null,
  apiKey: string, apiProvider: 'anthropic' | 'openai'
): Promise<{ facts: Fact[]; categories: string[]; note: string; error?: boolean }> {
  if (!apiKey) return { facts: [], categories: [], note: 'No AI API key configured' }

  const topics = testPatterns?.topicsCovered?.length
    ? `The practice test covers: ${testPatterns.topicsCovered.join(', ')}.`
    : ''

  const prompt = `You are an expert ${subject || 'education'} teacher creating study material for Australian high school students (${yearLevel || 'secondary level'}).

Generate 15-20 key facts for: "${packageName || subject}".
${topics}

For EACH fact provide:
1. A clear statement (1-2 sentences)
2. A detailed explanation (1-2 sentences)
3. A category name

Format as JSON array: [{"text":"...", "detail":"...", "category":"..."}]
Only output the JSON array.`

  try {
    let responseText = ''

    if (apiProvider === 'anthropic') {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!resp.ok) throw new Error(`Claude API error: ${resp.status}`)
      const data = await resp.json()
      responseText = data.content?.[0]?.text || ''
    } else {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000,
        }),
      })
      if (!resp.ok) throw new Error(`OpenAI API error: ${resp.status}`)
      const data = await resp.json()
      responseText = data.choices?.[0]?.message?.content || ''
    }

    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No valid JSON in response')

    const parsed = JSON.parse(jsonMatch[0])
    const facts: Fact[] = parsed
      .map((f: any) => ({
        id: genId(),
        text: f.text || '',
        detail: f.detail || '',
        category: f.category || subject || 'General',
        difficulty: (f.text || '').length > 100 ? 'hard' as const : 'medium' as const,
        aiGenerated: true,
      }))
      .filter((f: Fact) => f.text.length > 10)

    const categories = [...new Set(facts.map(f => f.category))]
    return { facts, categories, note: `AI generated ${facts.length} facts using ${apiProvider === 'anthropic' ? 'Claude' : 'ChatGPT'}` }
  } catch (err: any) {
    console.error('AI auto-research error:', err)
    return { facts: [], categories: [], note: `AI error: ${err.message}`, error: true }
  }
}

// ============================================================
// BUILT-IN KNOWLEDGE BANK (fallback when no AI key)
// ============================================================
const KNOWLEDGE_BANK: Record<string, Record<string, { categories: string[]; facts: Array<{ t: string; d: string; c: string }> }>> = {
  Mathematics: {
    'Year 7': {
      categories: ['Number & Place Value', 'Fractions & Decimals', 'Geometry', 'Statistics', 'Patterns & Algebra'],
      facts: [
        { t: 'Integers include all positive and negative whole numbers, as well as zero.', d: 'The set of integers is written as {..., -3, -2, -1, 0, 1, 2, 3, ...}.', c: 'Number & Place Value' },
        { t: 'A fraction represents a part of a whole and is written as a numerator over a denominator.', d: 'The numerator tells how many parts you have; the denominator tells how many equal parts the whole is divided into.', c: 'Fractions & Decimals' },
        { t: 'The area of a rectangle is calculated by multiplying its length by its width.', d: 'Area = length × width. The result is expressed in square units.', c: 'Geometry' },
        { t: 'The mean (average) is calculated by adding all values and dividing by the number of values.', d: 'For example, the mean of 4, 7, and 10 is (4+7+10)/3 = 7.', c: 'Statistics' },
        { t: 'In algebra, a variable is a letter that represents an unknown number.', d: 'Common variables include x, y, and n.', c: 'Patterns & Algebra' },
      ],
    },
    'Year 8': {
      categories: ['Algebra', 'Linear Equations', 'Ratios & Rates', 'Geometry & Measurement'],
      facts: [
        { t: 'An algebraic expression is a mathematical phrase that contains numbers, variables, and operations.', d: 'Variables are symbols, usually letters, that represent unknown values.', c: 'Algebra' },
        { t: 'The distributive property states that a(b + c) = ab + ac.', d: 'This is used to expand brackets in algebraic expressions.', c: 'Algebra' },
        { t: 'A linear equation has the form ax + b = c, where a, b, and c are constants.', d: 'To solve, isolate x by performing inverse operations.', c: 'Linear Equations' },
        { t: 'A ratio compares two quantities, written as a:b.', d: 'Ratios can be simplified by dividing by common factors.', c: 'Ratios & Rates' },
        { t: 'The volume of a rectangular prism equals length times width times height.', d: 'Volume is measured in cubic units such as cm³.', c: 'Geometry & Measurement' },
      ],
    },
  },
  Science: {
    'Year 7': {
      categories: ['Living Things', 'Mixtures', 'Forces', 'Earth & Space'],
      facts: [
        { t: 'All living things share characteristics: movement, respiration, sensitivity, growth, reproduction, excretion, and nutrition (MRS GREN).', d: 'These are the seven life processes.', c: 'Living Things' },
        { t: 'A mixture contains two or more substances that are not chemically bonded.', d: 'Mixtures can be separated using filtration, evaporation, and distillation.', c: 'Mixtures' },
        { t: 'A force is a push or pull that can change speed, direction, or shape.', d: 'Forces are measured in newtons (N).', c: 'Forces' },
        { t: 'The Earth revolves around the Sun once every 365.25 days.', d: 'The extra 0.25 day gives us a leap year every four years.', c: 'Earth & Space' },
      ],
    },
  },
}

export function generateFromKnowledgeBank(
  subject: string, yearLevel: string, packageName: string,
  testPatterns: TestPatterns | null
): { facts: Fact[]; categories: string[]; note: string } {
  // Try topic knowledge bank first (for practice-test-driven content)
  if (testPatterns && testPatterns.topicsCovered.length > 0) {
    // Return study skills as fallback
  }

  const subjectBank = KNOWLEDGE_BANK[subject]
  if (subjectBank?.[yearLevel]) {
    const data = subjectBank[yearLevel]
    const facts: Fact[] = data.facts.map(f => ({
      id: genId(), text: f.t, detail: f.d, category: f.c, difficulty: 'medium' as const,
    }))
    return { facts, categories: data.categories, note: 'Generated from built-in curriculum bank' }
  }

  // Generic fallback
  const facts: Fact[] = [
    { id: genId(), text: `${subject || packageName} develops critical thinking and analytical skills.`, detail: 'Understanding core concepts builds a foundation for advanced topics.', category: 'Overview', difficulty: 'medium' },
    { id: genId(), text: 'Active recall — testing yourself — is one of the most effective study techniques.', detail: 'Try to recall key facts from memory, then check.', category: 'Study Skills', difficulty: 'medium' },
    { id: genId(), text: 'Spaced repetition involves reviewing material at increasing intervals.', detail: 'Short sessions spread out are better than cramming.', category: 'Study Skills', difficulty: 'medium' },
  ]
  return { facts, categories: ['Overview', 'Study Skills'], note: 'Generic content. Upload materials for better results.' }
}
