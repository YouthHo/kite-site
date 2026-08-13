// axe 明细（在 kite-site 下跑，用项目 node_modules）
const puppeteer = require('puppeteer-core');
const { AxePuppeteer } = require('@axe-core/puppeteer');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  for (const path of ['/timeline', '/characters']) {
    const pg = await browser.newPage();
    await pg.setViewport({ width: 1440, height: 900 });
    await pg.goto('http://localhost:4173' + path, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 4500));
    const results = await new AxePuppeteer(pg).analyze();
    const bad = results.violations.filter((v) => ['critical', 'serious'].includes(v.impact));
    console.log('=== ' + path + ' ===');
    for (const v of bad) {
      for (const n of v.nodes.slice(0, 2)) {
        console.log(`[${v.impact}] ${v.id}`);
        console.log('  html:', (n.html || '').slice(0, 180));
        console.log('  any:', JSON.stringify(n.any).slice(0, 200));
      }
    }
    await pg.close();
  }
  await browser.close();
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
