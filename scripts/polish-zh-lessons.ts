import fs from 'fs'
import path from 'path'

// Script to clean up awkward machine translations in Chinese markdown files across public/lessons/zh/

const ZH_DIR = path.join(process.cwd(), 'public', 'lessons', 'zh')

const REPLACEMENTS: Array<[RegExp, string]> = [
  [/主题粒子/g, '主题助词'],
  [/物体粒子/g, '宾格助词'],
  [/粒子/g, '助词'],
  [/\(限定词\)/g, '（指示词）'],
  [/\(决定因素\)/g, '（指示词）'],
  [/在表格顶部/g, '在桌子上'],
  [/阅读一本书/g, '看书'],
  [/打开计算机/g, '开电脑'],
  [/种一棵树/g, '种树'],
  [/坐在沙发上/g, '坐沙发'],
  [/韩国医生/g, '韩医师'],
  [/共轭（非正式）/g, '活用（非正式）'],
  [/共轭（形式）/g, '活用（正式）'],
  [/共轭/g, '活用'],
  [/我说明/g, '我说'],
  [/1\. 我说韩语 =/g, '1. 我说韩语：'],
  [/2\.我喜欢你=/g, '2. 我喜欢你：'],
  [/3\.我写了一封信=/g, '3. 我写了一封信：'],
  [/4\.我打开门=/g, '4. 我打开门：'],
]

function fixFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8')
  let modified = false

  for (const [pattern, replacement] of REPLACEMENTS) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement)
      modified = true
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8')
  }
}

function processDirectory(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      processDirectory(fullPath)
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      fixFile(fullPath)
    }
  }
}

processDirectory(ZH_DIR)
console.log('Successfully polished Chinese lesson markdown files!')
