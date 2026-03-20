'use client'

import { useState } from 'react'

interface PdfExportProps {
  results: any[]
  packageName: string
  userName: string
}

export function PdfExport({ results, packageName, userName }: PdfExportProps) {
  const [exporting, setExporting] = useState(false)

  const exportPdf = () => {
    setExporting(true)
    try {
      const totalTests = results.length
      const avgScore = totalTests > 0
        ? Math.round(results.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / totalTests)
        : 0
      const bestScore = totalTests > 0
        ? Math.max(...results.map((r: any) => r.score || 0))
        : 0
      const totalQuestions = results.reduce((sum: number, r: any) => sum + (r.total || 0), 0)
      const totalCorrect = results.reduce((sum: number, r: any) => sum + (r.correct || 0), 0)

      // Build print-ready HTML document
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test Results — ${escapeHtml(packageName)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a1a2e; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 3px solid #6c5ce7; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 24px; color: #6c5ce7; margin-bottom: 4px; }
    .header .subtitle { font-size: 14px; color: #666; }
    .summary { display: flex; gap: 16px; margin-bottom: 30px; justify-content: center; flex-wrap: wrap; }
    .stat-card { background: #f5f5fa; border-radius: 12px; padding: 16px 24px; text-align: center; min-width: 120px; }
    .stat-card .value { font-size: 28px; font-weight: 700; color: #6c5ce7; }
    .stat-card .label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
    .results-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .results-table th { background: #6c5ce7; color: white; padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .results-table td { padding: 10px 14px; border-bottom: 1px solid #e8e8f0; font-size: 13px; }
    .results-table tr:nth-child(even) td { background: #fafafa; }
    .grade { display: inline-block; padding: 2px 10px; border-radius: 12px; font-weight: 600; font-size: 12px; }
    .grade-a { background: #d4edda; color: #155724; }
    .grade-b { background: #cce5ff; color: #004085; }
    .grade-c { background: #fff3cd; color: #856404; }
    .grade-d { background: #f8d7da; color: #721c24; }
    .grade-f { background: #f5c6cb; color: #721c24; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #e8e8f0; padding-top: 16px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Test Results Report</h1>
    <div class="subtitle">${escapeHtml(packageName)} — ${escapeHtml(userName)}</div>
    <div class="subtitle" style="margin-top: 4px;">Generated ${new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>

  <div class="summary">
    <div class="stat-card">
      <div class="value">${totalTests}</div>
      <div class="label">Tests Taken</div>
    </div>
    <div class="stat-card">
      <div class="value">${avgScore}%</div>
      <div class="label">Average Score</div>
    </div>
    <div class="stat-card">
      <div class="value">${bestScore}%</div>
      <div class="label">Best Score</div>
    </div>
    <div class="stat-card">
      <div class="value">${totalCorrect}/${totalQuestions}</div>
      <div class="label">Questions Correct</div>
    </div>
  </div>

  <table class="results-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Date</th>
        <th>Type</th>
        <th>Score</th>
        <th>Questions</th>
        <th>Grade</th>
      </tr>
    </thead>
    <tbody>
      ${results.map((r: any, i: number) => {
        const score = r.score || 0
        const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F'
        const gradeClass = `grade-${grade.toLowerCase()}`
        const date = r.timestamp
          ? new Date(r.timestamp).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
          : '—'
        const type = r.testType || r.type || 'Mixed'
        return `<tr>
          <td>${i + 1}</td>
          <td>${date}</td>
          <td>${escapeHtml(type)}</td>
          <td><strong>${score}%</strong></td>
          <td>${r.correct || 0} / ${r.total || 0}</td>
          <td><span class="grade ${gradeClass}">${grade}</span></td>
        </tr>`
      }).join('')}
    </tbody>
  </table>

  <div class="footer">
    StudyFlow — Interactive Learning Platform &bull; Report generated automatically
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`

      // Open in new window for print
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
      }
    } finally {
      setExporting(false)
    }
  }

  if (results.length === 0) return null

  return (
    <button
      onClick={exportPdf}
      disabled={exporting}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 16px',
        background: 'rgba(108,92,231,.12)',
        color: 'var(--primary)',
        border: '1px solid rgba(108,92,231,.2)',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        cursor: exporting ? 'wait' : 'pointer',
        opacity: exporting ? 0.6 : 1,
        transition: 'all 0.15s ease',
      }}
    >
      📄 {exporting ? 'Generating...' : 'Export PDF'}
    </button>
  )
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
