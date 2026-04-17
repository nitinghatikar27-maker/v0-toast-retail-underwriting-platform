import fs from 'fs'
import path from 'path'

// Custom application files (excluding shadcn/ui which is standard)
const files = [
  // App pages
  'app/layout.tsx',
  'app/page.tsx',
  'app/dashboard/layout.tsx',
  'app/dashboard/page.tsx',
  'app/dashboard/submit/page.tsx',
  'app/dashboard/approvals/page.tsx',
  'app/dashboard/case/[id]/page.tsx',
  'app/dashboard/case/[id]/edit/page.tsx',
  'app/dashboard/users/page.tsx',
  'app/dashboard/settings/page.tsx',
  'app/dashboard/documentation/page.tsx',

  // Custom components
  'components/app-sidebar.tsx',
  'components/audit-trail.tsx',
  'components/chatter.tsx',
  'components/document-upload.tsx',
  'components/exposure-calculator.tsx',
  'components/mcc-selector.tsx',
  'components/theme-provider.tsx',
  'components/toast-logo.tsx',

  // Lib (business logic)
  'lib/auth-context.tsx',
  'lib/exposure.ts',
  'lib/storage.ts',
  'lib/types.ts',
  'lib/utils.ts',
  'lib/mcc-codes.ts',
]

const projectRoot = process.cwd()

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Toast Retail Underwriting Platform - Full Source Code</title>
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family: Calibri, Arial, sans-serif; color: #1a1a1a; line-height: 1.4; }
  h1 { color: #ff5a1f; border-bottom: 3px solid #ff5a1f; padding-bottom: 8px; font-size: 28px; }
  h2 { color: #1a1a1a; background: #f4f4f4; padding: 10px 14px; font-size: 18px; margin-top: 32px; border-left: 5px solid #ff5a1f; page-break-before: auto; }
  h3 { color: #333; font-size: 14px; margin-top: 20px; }
  .filepath { font-family: Consolas, 'Courier New', monospace; background: #fffbe6; padding: 4px 10px; border: 1px solid #ffe58f; color: #614700; font-size: 12px; display: inline-block; margin-bottom: 8px; }
  pre { font-family: Consolas, 'Courier New', monospace; background: #f6f8fa; border: 1px solid #d0d7de; padding: 14px; font-size: 11px; white-space: pre-wrap; word-wrap: break-word; overflow-wrap: anywhere; page-break-inside: auto; }
  .toc { background: #f9f9f9; padding: 14px 20px; border: 1px solid #e0e0e0; margin-bottom: 24px; }
  .toc ol { margin: 0; padding-left: 20px; }
  .toc li { padding: 2px 0; font-size: 13px; }
  .summary { background: #fff4ee; padding: 14px 20px; border: 1px solid #ffd9c4; margin-bottom: 24px; }
  .section-header { page-break-before: always; }
  .meta { color: #666; font-size: 11px; margin-bottom: 16px; }
</style>
</head>
<body>
<h1>Toast Retail Underwriting Platform</h1>
<p class="meta">Complete Source Code Documentation &nbsp;&middot;&nbsp; Generated ${new Date().toLocaleString()}</p>

<div class="summary">
  <strong>Project Overview:</strong> A role-based retail underwriting platform for Toast, built with Next.js 15, React 19, and TypeScript. Supports Auto Approval, Abbreviated Review, and Full Credit Review workflows with localStorage-based persistence.
  <br/><br/>
  <strong>Key Features:</strong>
  <ul>
    <li>Role-based access control (User, Approver, Admin)</li>
    <li>Exposure-based decision engine with three approval tiers</li>
    <li>Manual form for Abbreviated and Full Credit Review cases</li>
    <li>Case chat, audit trail, document upload, and notifications</li>
    <li>MCC code lookup (1,000+ codes)</li>
  </ul>
</div>

<h2>Table of Contents</h2>
<div class="toc">
<ol>
`

// Build TOC
files.forEach((file, idx) => {
  html += `<li>${escapeHtml(file)}</li>\n`
})

html += `</ol></div>\n`

// Add each file
files.forEach((file, idx) => {
  const fullPath = path.join(projectRoot, file)
  let content
  try {
    content = fs.readFileSync(fullPath, 'utf-8')
  } catch (err) {
    content = `// File not found: ${file}`
  }

  const lines = content.split('\n').length
  const sizeKb = (Buffer.byteLength(content, 'utf-8') / 1024).toFixed(1)

  html += `<h2 class="section-header">${idx + 1}. ${escapeHtml(path.basename(file))}</h2>\n`
  html += `<div class="filepath">${escapeHtml(file)}</div>\n`
  html += `<p class="meta">${lines} lines &nbsp;&middot;&nbsp; ${sizeKb} KB</p>\n`
  html += `<pre>${escapeHtml(content)}</pre>\n`
})

html += `</body></html>`

const outputPath = path.join(projectRoot, 'toast-platform-source-code.doc')
fs.writeFileSync(outputPath, html, 'utf-8')

console.log(`Document generated: ${outputPath}`)
console.log(`Total files: ${files.length}`)
console.log(`File size: ${(Buffer.byteLength(html, 'utf-8') / 1024).toFixed(1)} KB`)
