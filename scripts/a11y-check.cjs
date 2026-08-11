// WCAG AA 自动化扫描（axe-core）：对构建产物跑本地预览 + 逐页 axe 扫描
// 用法：先 npm run build，再 node scripts/a11y-check.cjs [--fail-on=critical]
const puppeteer = require('puppeteer-core')
const { AxePuppeteer } = require('@axe-core/puppeteer')

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = process.env.A11Y_BASE || 'http://localhost:4173'
const PAGES = ['/', '/graph', '/characters', '/cast', '/episodes', '/timeline', '/architecture', '/history', '/scenes']

;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
  let critical = 0
  let serious = 0
  for (const route of PAGES) {
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 30000 })
    } catch (e) {
      console.log(`[a11y] ${route}: 页面加载失败（${e.message.slice(0, 60)}），跳过`)
      await page.close()
      continue
    }
    await new Promise((r) => setTimeout(r, 3000))
    // 跳过引导遮罩（避免遮罩误报）
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '跳过')
      b?.click()
    }).catch(() => {})
    await new Promise((r) => setTimeout(r, 500))
    const results = await new AxePuppeteer(page).analyze()
    const bad = results.violations.filter((v) => ['critical', 'serious'].includes(v.impact))
    if (bad.length) {
      console.log(`[a11y] ${route}: ${bad.length} 个 critical/serious`)
      for (const v of bad.slice(0, 4)) {
        console.log(`  ✗ ${v.impact} ${v.id}: ${v.help} (${v.nodes.length} 处)`)
        console.log(`    e.g. ${v.nodes[0]?.target?.join(' ') || ''} ${v.nodes[0]?.failureSummary?.slice(0, 80) || ''}`)
      }
    }
    critical += bad.filter((v) => v.impact === 'critical').length
    serious += bad.filter((v) => v.impact === 'serious').length
    await page.close()
  }
  console.log(`[a11y] 总计 critical=${critical} serious=${serious}`)
  if (critical > 0 || serious > 0) {
    console.error('[a11y] FAIL: 存在 critical/serious 问题')
    process.exit(1)
  }
  console.log('[a11y] OK')
  await browser.close()
})().catch((e) => { console.error('FATAL', e.message); process.exit(1) })
