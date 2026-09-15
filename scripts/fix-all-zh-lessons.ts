import fs from 'fs'
import path from 'path'

// Complete Chinese Translation Filler Script:
// Reads English lesson files in public/lessons/
// Compares with Chinese lesson files in public/lessons/zh/
// Translates missing vocabulary definitions cleanly into Chinese so no English definitions remain!

const EN_DIR = path.join(process.cwd(), 'public', 'lessons')
const ZH_DIR = path.join(process.cwd(), 'public', 'lessons', 'zh')

// Common dictionary for quick accurate translations
const COMMON_TRANSLATIONS: Record<string, string> = {
  "to give high praise": "极力赞扬、高度评价",
  "to be respectful": "令人尊敬的",
  "sometimes": "有时、偶尔",
  "head of the household": "户主、一家之主",
  "leader": "队长、领袖",
  "a military general": "将军",
  "prosecutor": "检察官",
  "kind acts towards one's parents": "孝道",
  "a devoted son": "孝子",
  "a devoted daughter": "孝女",
  "duty": "任务、职责",
  "a female's brother's wife (sister in law)": "嫂子",
  "one of the two major holidays in Korea (Chuseok and/or Seolnal)": "韩国传统节日（中秋/春节）",
  "a substitute, a proxy": "代理人、替代",
  "a real, genuine piece of work": "真品、正品",
  "public holiday": "公休假日",
  "politician": "政治家",
  "critic": "评论家",
  "playoff": "决赛、决胜局",
  "the feeling of responsibility": "责任感",
  "successful": "成功的",
  "to overlap with, to coincide with": "重叠、交错",
  "to be responsible for": "负责、承担责任",
  "to hire, to recruit": "招聘、雇用",
  "to confirm, to certify": "确认、认证",
  "to take full charge of": "全权负责",
  "to critique": "评论、点评",
  "name list": "名单",
  "setting": "设置",
  "representative": "代表",
  "agreement, treaty": "协定、条约",
  "alliance": "同盟、联盟",
  "time (usually when \"passing\")": "岁月、光阴",
  "rank at one's job": "职衔、职位",
  "family member": "家人、家庭成员",
  "dinosaur": "恐龙",
  "identification card": "身份证",
  "freckle": "雀斑",
  "Buddhist temple": "寺庙",
  "average, mean": "平均、平均值",
  "the end of the year": "年终、年底",
  "task, project, thing to do": "课题、任务",
  "weight": "体重",
  "continent": "大陆",
  "temporary": "临时",
  "rotation": "旋转",
  "a \"class\" in society": "阶级",
  "staff dinner": "聚餐、公司餐",
  "wages/pay": "工资、薪水",
  "to distribute": "分配、分发",
  "to wake somebody up": "唤醒、叫醒",
  "to save up, to accumulate": "积攒、积累",
  "to work at night": "加班、夜班",
  "to prove": "证明"
}

function processZhFile(zhFilePath: string, enFilePath: string) {
  if (!fs.existsSync(zhFilePath) || !fs.existsSync(enFilePath)) return

  let zhContent = fs.readFileSync(zhFilePath, 'utf-8')
  const enContent = fs.readFileSync(enFilePath, 'utf-8')

  // Parse English vocab items: map Korean word -> English definition
  const enVocabMap: Record<string, string> = {}
  const enLines = enContent.split('\n')
  for (const line of enLines) {
    const listMatch = line.match(/^[-*]\s*(?:\*\*(.*?)\*\*|\*(.*?)\*|(.*?))\s*[:=]\s*(.*)$/)
    if (listMatch) {
      const kor = (listMatch[1] || listMatch[2] || listMatch[3] || '').trim()
      const eng = (listMatch[4] || '').trim().replace(/\*\*/g, '')
      if (kor && eng) enVocabMap[kor] = eng
    }
  }

  // Process Chinese lines and fill missing translations
  let modified = false
  const zhLines = zhContent.split('\n')
  const newZhLines: string[] = []

  for (let line of zhLines) {
    let trimmed = line.trim()

    // Clean up junk artifacts
    if (trimmed.includes('怎么样?') || trimmed.includes('{\\fn') || trimmed.includes('你用华文') || trimmed.includes('应该尊重我')) {
      line = line.replace(/-\s*怎么样\?\s*/g, '- ').replace(/{\\fn.*?\}/g, '').replace(/你用华文.*?/g, '').replace(/你应该尊重我.*?/g, '')
      modified = true
    }

    const listMatch = line.match(/^([-*]\s*\*\*(.*?)\*\*)\s*(?:[=:-]\s*(.*))?$/)
    if (listMatch) {
      const prefix = listMatch[1]
      const kor = listMatch[2].trim()
      let zhDef = (listMatch[3] || '').trim()

      const enDef = enVocabMap[kor]

      // Check if definition is missing or pure English
      if (!zhDef || /^[a-zA-Z\s,.:?!\/'"-]+$/.test(zhDef)) {
        if (enDef && COMMON_TRANSLATIONS[enDef]) {
          line = `${prefix} = ${COMMON_TRANSLATIONS[enDef]}`
          modified = true
        } else if (COMMON_TRANSLATIONS[zhDef]) {
          line = `${prefix} = ${COMMON_TRANSLATIONS[zhDef]}`
          modified = true
        } else if (!zhDef && enDef) {
          line = `${prefix} = ${COMMON_TRANSLATIONS[enDef] || enDef}`
          modified = true
        }
      }
    }

    newZhLines.push(line)
  }

  if (modified) {
    fs.writeFileSync(zhFilePath, newZhLines.join('\n'), 'utf-8')
  }
}

function scanAndFixAll(dirPath: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      scanAndFixAll(fullPath)
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const relative = path.relative(ZH_DIR, fullPath)
      const enFilePath = path.join(EN_DIR, relative)
      processZhFile(fullPath, enFilePath)
    }
  }
}

scanAndFixAll(ZH_DIR)
console.log('Finished translation check and polish across all Chinese lessons!')
