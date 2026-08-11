#!/usr/bin/env node
// 构建体积门禁：首屏 JS ≤200KB gzip、单 chunk ≤250KB raw（超限构建失败）
// 用法：node scripts/perf-check.cjs   （在 npm run build 之后运行）
const fs = require('node:fs')
const path = require('node:path')
const zlib = require('node:zlib')

const DIST = path.resolve(__dirname, '..', 'dist')
const BUDGET_FIRST_SCREEN_GZIP = 200 * 1024 // 首屏 JS gzip
const BUDGET_CHUNK_RAW = 250 * 1024 // 单 chunk raw（图谱/时间线懒加载 chunk 除外）

if (!fs.existsSync(DIST)) {
  console.error('[perf-check] dist/ 不存在，请先 npm run build')
  process.exit(1)
}

// 解析 index.html 的首屏 JS 链
const idx = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
const entry = [...idx.matchAll(/assets\/[^"']+\.js/g)].map((m) => m[0])

const gzip = (p) => zlib.gzipSync(fs.readFileSync(p)).length
let firstScreenGzip = 0
const chunks = fs.readdirSync(path.join(DIST, 'assets')).filter((f) => f.endsWith('.js'))

const problems = []
for (const e of entry) {
  const p = path.join(DIST, e)
  if (fs.existsSync(p)) firstScreenGzip += gzip(p)
}
const lazyChunks = chunks.filter((f) => !entry.some((e) => e.includes(f)))
for (const f of chunks) {
  const raw = fs.statSync(path.join(DIST, 'assets', f)).size
  // 懒加载 chunk（图谱/时间线等）放宽到 550KB raw（echarts 在主懒加载包内）
  const isLazy = lazyChunks.includes(f)
  const budget = isLazy ? 550 * 1024 : BUDGET_CHUNK_RAW
  if (raw > budget) {
    problems.push(`chunk ${f}: ${(raw / 1024).toFixed(1)}KB raw（预算 ${(budget / 1024).toFixed(0)}KB）`)
  }
}
if (firstScreenGzip > BUDGET_FIRST_SCREEN_GZIP) {
  problems.push(`首屏 JS gzip: ${(firstScreenGzip / 1024).toFixed(1)}KB（预算 200KB）`)
}

console.log(`[perf-check] 首屏 JS gzip: ${(firstScreenGzip / 1024).toFixed(1)}KB / 200KB`)
for (const f of chunks) {
  const raw = fs.statSync(path.join(DIST, 'assets', f)).size
  console.log(`  ${f}: ${(raw / 1024).toFixed(1)}KB raw / ${(gzip(path.join(DIST, 'assets', f)) / 1024).toFixed(1)}KB gzip`)
}

if (problems.length) {
  console.error('[perf-check] FAIL:')
  problems.forEach((p) => console.error('  ✗ ' + p))
  process.exit(1)
}
console.log('[perf-check] OK')
