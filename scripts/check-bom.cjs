#!/usr/bin/env node
// BOM 检测与修复（2.0 标准化：src/data/*.json 无 BOM）
// 用法：node scripts/check-bom.cjs        # 检测（有 BOM 则报错）
//       node scripts/check-bom.cjs --fix  # 检测并自动去除
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const fix = process.argv.includes('--fix')
const targets = ['src/data/*.json', 'package.json', 'vite.config.js', 'postcss.config.js', 'tailwind.config.js', 'index.html']

const files = []
const walk = (d) => {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f)
    if (fs.statSync(p).isDirectory()) walk(p)
    else if (/\.json$/.test(f)) files.push(p)
  }
}
walk(path.join(ROOT, 'src', 'data'))
for (const t of targets.filter((t) => t.includes('*'))) {
  // glob 简单展开
}
for (const t of ['package.json', 'vite.config.js', 'postcss.config.js', 'tailwind.config.js', 'index.html']) {
  const p = path.join(ROOT, t)
  if (fs.existsSync(p)) files.push(p)
}

let bad = 0
for (const p of files) {
  const buf = fs.readFileSync(p)
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    bad++
    const rel = path.relative(ROOT, p).replace(/\\/g, '/')
    if (fix) {
      fs.writeFileSync(p, buf.subarray(3))
      console.log(`[check-bom] 已去除 BOM: ${rel}`)
    } else {
      console.error(`[check-bom] BOM: ${rel}`)
    }
  }
}
if (bad && !fix) {
  console.error(`[check-bom] FAIL: ${bad} 个文件带 BOM（可用 --fix 自动去除）`)
  process.exit(1)
}
if (!bad) console.log('[check-bom] OK')
