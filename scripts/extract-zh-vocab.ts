import fs from 'fs'
import path from 'path'

// Deep Chinese Vocabulary Extractor & Fixer:
// Cleans all broken machine translation artifacts (- 怎么样? **word** = chinese)
// Fixes subtitles/subtitles font tags (e.g. {\fn华文楷体...})
// Builds an accurate, clean Korean -> Chinese vocabulary dictionary

const ZH_DIR = path.join(process.cwd(), 'public', 'lessons', 'zh')
const zhDict: Record<string, string> = {}

function scanAndFixZhDirectory(dir: string) {
  if (!fs.existsSync(dir)) return
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      scanAndFixZhDirectory(fullPath)
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      cleanAndExtractFile(fullPath)
    }
  }
}

function cleanAndExtractFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8')
  let modified = false

  // 1. Clean weird artifacts in file content
  if (content.includes('怎么样?') || content.includes('{\\fn') || content.includes('(单位:千美元)')) {
    content = content
      .replace(/-\s*怎么样\?\s*/g, '- ')
      .replace(/{\\fn.*?\}/g, '')
      .replace(/\(单位:千美元\)/g, '')
      .replace(/로页:\d+/g, '')
    modified = true
  }

  // 2. Parse vocabulary items
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Table rows (| Korean | Chinese | ...)
    if (trimmed.startsWith('|') && !trimmed.includes('---')) {
      const parts = trimmed.split('|').map(p => p.trim()).filter(Boolean)
      const col1 = parts[0]?.replace(/\*\*/g, '').trim()
      let col2 = parts[1]?.replace(/\*\*/g, '').trim()

      if (col1 && col2 && col1.toLowerCase() !== 'korean' && col1 !== '韩语') {
        col2 = cleanZhString(col2)
        if (col1 && col2) zhDict[col1] = col2
      }
      continue
    }

    // List items (- **korean** = chinese)
    const listMatch = trimmed.match(/^[-*]\s*(?:\*\*(.*?)\*\*|\*(.*?)\*|([^\s:=]+))\s*(?:[=:-]\s*(.*))?$/)
    if (listMatch) {
      const korean = (listMatch[1] || listMatch[2] || listMatch[3] || '').trim()
      let chinese = (listMatch[4] || '').trim().replace(/\*\*/g, '').replace(/\*/g, '')

      if (korean && chinese && korean !== 'Common Usages' && korean !== 'Examples') {
        chinese = cleanZhString(chinese)
        if (korean && chinese) zhDict[korean] = chinese
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8')
  }
}

function cleanZhString(str: string): string {
  return str
    .replace(/^怎么样\?\s*/g, '')
    .replace(/{\\fn.*?\}/g, '')
    .replace(/\(限定词\)/g, '（指示词）')
    .replace(/\(决定因素\)/g, '（指示词）')
    .replace(/在表格顶部/g, '在桌子上')
    .replace(/阅读一本书/g, '看书')
    .replace(/打开计算机/g, '开电脑')
    .replace(/种一棵树/g, '种树')
    .replace(/坐在沙发上/g, '坐沙发')
    .replace(/韩国医生/g, '韩医师')
    .trim()
}

scanAndFixZhDirectory(ZH_DIR)

console.log(`Cleaned and generated Chinese vocabulary dictionary for ${Object.keys(zhDict).length} Korean words!`)

fs.writeFileSync(path.join(process.cwd(), 'public', 'zh-vocab-dict.json'), JSON.stringify(zhDict, null, 2))
