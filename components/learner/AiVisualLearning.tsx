'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import * as DB from '@/lib/db'
import { callAiWithFallback } from '@/lib/ai-providers'
import type { Fact } from '@/lib/content-engine'

interface AiVisualLearningProps {
  facts: Fact[]
  packageName: string
  subject: string
  yearLevel: string
  onClose: () => void
}

type VisualType = 'concept_map' | 'timeline' | 'comparison' | 'flowchart' | 'summary_card'

interface GeneratedVisual {
  type: VisualType
  title: string
  svgContent: string
  description: string
}

export function AiVisualLearning({ facts, packageName, subject, yearLevel, onClose }: AiVisualLearningProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [generating, setGenerating] = useState(false)
  const [selectedType, setSelectedType] = useState<VisualType>('concept_map')
  const [selectedFacts, setSelectedFacts] = useState<number[]>([])
  const [generatedSvg, setGeneratedSvg] = useState('')
  const [generatedMermaid, setGeneratedMermaid] = useState('')
  const [viewMode, setViewMode] = useState<'select' | 'result'>('select')

  const visualTypes: { type: VisualType; label: string; icon: string; desc: string }[] = [
    { type: 'concept_map', label: 'Concept Map', icon: '🕸️', desc: 'Shows how ideas connect to each other' },
    { type: 'timeline', label: 'Timeline', icon: '📅', desc: 'Events or processes in order' },
    { type: 'comparison', label: 'Comparison Table', icon: '⚖️', desc: 'Compare and contrast concepts' },
    { type: 'flowchart', label: 'Flowchart', icon: '🔀', desc: 'Steps in a process or decision tree' },
    { type: 'summary_card', label: 'Visual Summary', icon: '📋', desc: 'Key points in a visual card layout' },
  ]

  const toggleFact = (i: number) => {
    setSelectedFacts(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
  }

  const generateVisual = async () => {
    if (!user) return
    setGenerating(true)

    const factsToUse = selectedFacts.length > 0
      ? selectedFacts.map(i => facts[i])
      : facts.slice(0, 15) // Use first 15 if none selected

    try {
      const aiConfig = await DB.getAiConfig(user.id)

      if (aiConfig && (aiConfig as any).apiKey) {
        // Use AI to generate Mermaid diagram or structured HTML
        const prompt = buildVisualPrompt(selectedType, factsToUse, subject, yearLevel)
        const result = await callAiWithFallback(aiConfig as any, prompt)

        if (selectedType === 'concept_map' || selectedType === 'flowchart' || selectedType === 'timeline') {
          setGeneratedMermaid(extractMermaid(result.text))
        }
        setGeneratedSvg(generateHtmlVisual(selectedType, factsToUse, result.text))
      } else {
        // Built-in visual generation (no AI needed)
        setGeneratedSvg(generateHtmlVisual(selectedType, factsToUse))
      }

      setViewMode('result')
    } catch (err: any) {
      toast('Error generating visual: ' + err.message, 'error')
      // Fallback to built-in
      const factsToUse = selectedFacts.length > 0 ? selectedFacts.map(i => facts[i]) : facts.slice(0, 15)
      setGeneratedSvg(generateHtmlVisual(selectedType, factsToUse))
      setViewMode('result')
    }

    setGenerating(false)
  }

  return (
    <div className="fixed inset-0 z-[9985] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.8)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-base font-extrabold">🎨 Visual Learning</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{packageName}</p>
          </div>
          <button className="text-lg" style={{ color: 'var(--text-muted)' }} onClick={onClose}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {viewMode === 'select' ? (
            <>
              {/* Visual type selection */}
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>What type of visual?</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {visualTypes.map(vt => (
                    <div key={vt.type} className="p-3 rounded-xl text-center cursor-pointer transition-all" style={{
                      background: selectedType === vt.type ? 'rgba(108,92,231,.1)' : 'var(--bg)',
                      border: selectedType === vt.type ? '2px solid var(--primary)' : '2px solid var(--border)',
                    }} onClick={() => setSelectedType(vt.type)}>
                      <div className="text-xl">{vt.icon}</div>
                      <div className="text-[11px] font-bold mt-1">{vt.label}</div>
                      <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{vt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fact selection */}
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Select facts to include ({selectedFacts.length || 'all'})
                </label>
                <p className="text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>Leave unselected to use all facts</p>
                <div className="max-h-[200px] overflow-y-auto rounded-lg p-2" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  {facts.slice(0, 30).map((f, i) => (
                    <label key={f.id || i} className="flex items-start gap-2 py-1.5 cursor-pointer text-xs">
                      <input type="checkbox" checked={selectedFacts.includes(i)} onChange={() => toggleFact(i)} className="mt-0.5 accent-purple-500" />
                      <div className="flex-1 min-w-0">
                        <div className="leading-relaxed">{f.text}</div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{f.category}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <button className="w-full px-4 py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}
                onClick={generateVisual} disabled={generating}>
                {generating ? '⏳ Generating visual...' : '🎨 Generate Visual'}
              </button>
            </>
          ) : (
            <>
              {/* Generated visual result */}
              <div className="mb-3 flex gap-2">
                <button className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  onClick={() => setViewMode('select')}>← Back</button>
                <button className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  onClick={generateVisual} disabled={generating}>{generating ? '⏳' : '🔄'} Regenerate</button>
              </div>

              <div className="rounded-xl overflow-auto p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                dangerouslySetInnerHTML={{ __html: generatedSvg }} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Build AI prompt for visual generation
function buildVisualPrompt(type: VisualType, facts: Fact[], subject: string, yearLevel: string): string {
  const factTexts = facts.map((f, i) => `${i + 1}. [${f.category}] ${f.text}`).join('\n')

  const typeInstructions: Record<VisualType, string> = {
    concept_map: 'Create a Mermaid.js concept map (graph TD) showing how these concepts relate. Use short labels.',
    timeline: 'Create a Mermaid.js timeline or sequence showing the order/progression of these concepts.',
    comparison: 'Create an HTML comparison table with clear columns. Use colour-coded cells.',
    flowchart: 'Create a Mermaid.js flowchart (graph TD) showing the process or decision flow between these concepts.',
    summary_card: 'Create an HTML visual summary card layout with sections for each category, using icons and colour.',
  }

  return `You are a visual learning designer for ${yearLevel} ${subject} students.

Here are the facts to visualise:
${factTexts}

${typeInstructions[type]}

Rules:
- Use Australian English spelling
- Keep text short and student-friendly
- For Mermaid: wrap the code in \`\`\`mermaid ... \`\`\` fences
- For HTML: wrap in a single <div> with inline styles. Use a clean, modern design with rounded corners and soft colours.
- Make it visually appealing and easy to understand for a ${yearLevel} student
- Max 20 nodes for Mermaid diagrams`
}

// Extract Mermaid code from AI response
function extractMermaid(text: string): string {
  const match = text.match(/```mermaid\n?([\s\S]*?)```/)
  return match ? match[1].trim() : ''
}

// Generate HTML visual without AI (built-in fallback)
function generateHtmlVisual(type: VisualType, facts: Fact[], aiResponse?: string): string {
  // If AI gave us HTML, extract and use it
  if (aiResponse) {
    const htmlMatch = aiResponse.match(/<div[\s\S]*<\/div>/)
    if (htmlMatch) return htmlMatch[0]
  }

  // Group facts by category
  const categories = new Map<string, Fact[]>()
  facts.forEach(f => {
    const cat = f.category || 'General'
    if (!categories.has(cat)) categories.set(cat, [])
    categories.get(cat)!.push(f)
  })

  const colours = ['#6c5ce7', '#00cec9', '#e17055', '#00b894', '#fdcb6e', '#fd79a8', '#636e72', '#0984e3']

  if (type === 'comparison') {
    const cats = Array.from(categories.entries())
    const maxRows = Math.max(...cats.map(([_, fs]) => fs.length))
    let html = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">`
    html += `<tr>${cats.map(([cat], i) => `<th style="background:${colours[i % colours.length]}22;color:${colours[i % colours.length]};padding:8px 12px;border:1px solid ${colours[i % colours.length]}33;font-weight:700;border-radius:${i === 0 ? '8px 0 0 0' : i === cats.length - 1 ? '0 8px 0 0' : '0'}">${cat}</th>`).join('')}</tr>`
    for (let r = 0; r < maxRows; r++) {
      html += `<tr>${cats.map(([_, fs], i) => `<td style="padding:6px 10px;border:1px solid #eee;vertical-align:top;color:#444">${fs[r]?.text || ''}</td>`).join('')}</tr>`
    }
    html += `</table></div>`
    return html
  }

  if (type === 'summary_card') {
    let html = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">`
    Array.from(categories.entries()).forEach(([cat, fs], i) => {
      const col = colours[i % colours.length]
      html += `<div style="background:${col}08;border:1px solid ${col}25;border-radius:12px;padding:12px">`
      html += `<div style="font-weight:700;font-size:13px;color:${col};margin-bottom:6px">${cat}</div>`
      fs.forEach(f => {
        html += `<div style="font-size:11px;color:#555;padding:3px 0;border-bottom:1px solid ${col}12">${f.text}</div>`
      })
      html += `</div>`
    })
    html += `</div>`
    return html
  }

  // Concept map / flowchart / timeline — render as connected boxes
  let html = `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px">`
  html += `<div style="font-weight:800;font-size:16px;color:#6c5ce7;margin-bottom:8px">${type === 'timeline' ? '📅 Timeline' : type === 'flowchart' ? '🔀 Process Flow' : '🕸️ Concept Map'}</div>`

  Array.from(categories.entries()).forEach(([cat, fs], i) => {
    const col = colours[i % colours.length]
    html += `<div style="width:100%;max-width:400px">`
    html += `<div style="background:${col};color:white;padding:8px 16px;border-radius:12px 12px 4px 4px;font-weight:700;font-size:12px;text-align:center">${cat}</div>`
    fs.forEach((f, j) => {
      const isLast = j === fs.length - 1
      html += `<div style="background:${col}08;border:1px solid ${col}22;border-radius:${isLast ? '4px 4px 12px 12px' : '4px'};padding:8px 12px;font-size:11px;color:#444;${!isLast ? 'border-bottom:none' : ''}">${f.text}</div>`
      if (!isLast && type !== 'concept_map') {
        html += `<div style="text-align:center;color:${col};font-size:16px;line-height:1">↓</div>`
      }
    })
    html += `</div>`
    if (i < categories.size - 1 && type === 'timeline') {
      html += `<div style="color:#ccc;font-size:20px">↓</div>`
    }
  })
  html += `</div>`
  return html
}
