import fs from 'fs'
import path from 'path'

// Script to translate remaining English definitions in Chinese lesson markdown files into clean Chinese

const ZH_DIR = path.join(process.cwd(), 'public', 'lessons', 'zh')

// Extended dictionary of English -> Chinese definitions
const DICT: Record<string, string> = {
  "keep something in mind": "记在心上、放在心上、铭记",
  "to keep in mind": "记在心上、放在心上",
  "mind, consideration": "念头、关切、挂念",
  "to give high praise": "极力赞扬、高度评价",
  "to be respectful": "令人尊敬的",
  "sometimes": "有时、偶尔",
  "head of the household": "户主、一家之主",
  "leader": "队长、领袖",
  "a military general": "将军",
  "prosecutor": "检察官",
  "duty": "任务、职责",
  "public holiday": "公休假日",
  "politician": "政治家",
  "critic": "评论家",
  "playoff": "决赛、决胜局",
  "the feeling of responsibility": "责任感",
  "successful": "成功的",
  "to be responsible for": "负责、承担责任",
  "to hire, to recruit": "招聘、雇用",
  "to confirm, to certify": "确认、认证",
  "to take full charge of": "全权负责",
  "to critique": "评论、点评"
}

function scanAndTranslateZh(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      scanAndTranslateZh(fullPath)
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      translateFile(fullPath)
    }
  }
}

function translateFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8')
  let modified = false

  const lines = content.split('\n')
  const newLines: string[] = []

  for (let line of lines) {
    const trimmed = line.trim()
    const listMatch = trimmed.match(/^([-*]\s*(?:\*\*(.*?)\*\*|\*(.*?)\*|(.*?)))\s*(?:[=:-]\s*(.*))?$/)
    if (listMatch) {
      const kor = (listMatch[2] || listMatch[3] || listMatch[4] || '').trim()
      let def = (listMatch[5] || '').trim().replace(/\*\*/g, '').replace(/\*/g, '')

      if (kor === '염두' || def.toLowerCase().includes('keep something in mind') || def.toLowerCase().includes('keep in mind')) {
        line = `- **염두** = 记在心上、放在心上`
        modified = true
      } else if (def && DICT[def.toLowerCase()]) {
        line = line.replace(def, DICT[def.toLowerCase()])
        modified = true
      }
    }
    newLines.push(line)
  }

  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8')
  }
}

scanAndTranslateZh(ZH_DIR)
console.log('Finished translating specific terms like 염두 into Chinese!')
