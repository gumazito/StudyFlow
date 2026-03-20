/**
 * Multi-AI Provider System with Automatic Fallback
 * =================================================
 * Supports: Claude (Anthropic), ChatGPT (OpenAI), Gemini (Google), Grok (xAI)
 * Auto-rotates through providers on failure based on user priority order.
 */

interface AiConfig {
  providers?: Record<string, { key: string; status?: string }>
  priority?: string[]
  // Legacy fields
  provider?: string
  apiKey?: string
}

interface AiResponse {
  text: string
  provider: string
}

const PROVIDER_ENDPOINTS: Record<string, { url: string; model: string; format: (prompt: string, key: string) => { url: string; headers: Record<string, string>; body: string } }> = {
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-20250514',
    format: (prompt, key) => ({
      url: 'https://api.anthropic.com/v1/messages',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, messages: [{ role: 'user', content: prompt }] }),
    }),
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    format: (prompt, key) => ({
      url: 'https://api.openai.com/v1/chat/completions',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 4096 }),
    }),
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    model: 'gemini-1.5-flash',
    format: (prompt, key) => ({
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }),
  },
  grok: {
    url: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-3-mini',
    format: (prompt, key) => ({
      url: 'https://api.x.ai/v1/chat/completions',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'grok-3-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 4096 }),
    }),
  },
}

function getKeyForProvider(config: AiConfig, providerId: string): string | null {
  // Check new multi-provider format
  if (config.providers?.[providerId]?.key) return config.providers[providerId].key
  // Legacy fallback
  if (providerId === (config.provider || 'anthropic') && config.apiKey) return config.apiKey
  return null
}

function parseResponse(providerId: string, data: any): string {
  switch (providerId) {
    case 'anthropic':
      return data?.content?.[0]?.text || ''
    case 'openai':
    case 'grok':
      return data?.choices?.[0]?.message?.content || ''
    case 'gemini':
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    default:
      return ''
  }
}

/**
 * Call AI with automatic fallback through providers in priority order.
 * Returns the response text and which provider answered.
 */
export async function callAiWithFallback(config: AiConfig, prompt: string): Promise<AiResponse> {
  const order = config.priority || ['anthropic', 'openai', 'gemini', 'grok']
  const errors: string[] = []

  for (const providerId of order) {
    const key = getKeyForProvider(config, providerId)
    if (!key) continue

    const endpoint = PROVIDER_ENDPOINTS[providerId]
    if (!endpoint) continue

    try {
      const { url, headers, body } = endpoint.format(prompt, key)
      const resp = await fetch(url, { method: 'POST', headers, body })

      if (!resp.ok) {
        const errText = await resp.text().catch(() => 'Unknown error')
        errors.push(`${providerId}: ${resp.status} ${errText.slice(0, 100)}`)
        continue // Try next provider
      }

      const data = await resp.json()
      const text = parseResponse(providerId, data)
      if (text) return { text, provider: providerId }

      errors.push(`${providerId}: empty response`)
    } catch (err: any) {
      errors.push(`${providerId}: ${err.message || 'Network error'}`)
      continue // Try next provider
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join('\n')}`)
}

/**
 * Generate a personalised study plan from test results and progress data.
 */
export async function generateStudyPlan(
  config: AiConfig,
  userName: string,
  courses: { name: string; subject: string; avgScore: number; testsCompleted: number; weakTopics: string[] }[],
): Promise<AiResponse> {
  const coursesSummary = courses.map(c =>
    `- ${c.name} (${c.subject}): ${c.testsCompleted} tests, avg ${c.avgScore}%${c.weakTopics.length ? `, weak areas: ${c.weakTopics.join(', ')}` : ''}`
  ).join('\n')

  const prompt = `You are StudyFlow, an AI study coach for Australian high school students.

Generate a personalised 7-day study plan for ${userName} based on their progress:

${coursesSummary}

Rules:
1. Prioritise subjects/topics where scores are lowest
2. Mix easier and harder topics each day for motivation
3. Include specific actions: "Review flash cards for [topic]", "Take a practice test on [subject]", "Re-read notes on [weak area]"
4. Keep each day to 30-45 minutes of study
5. Include rest days or lighter days on weekends
6. Be encouraging and age-appropriate (Australian high school)

Format the plan as a clear day-by-day schedule. Use emojis sparingly for visual appeal.
End with one motivational sentence.`

  return callAiWithFallback(config, prompt)
}
