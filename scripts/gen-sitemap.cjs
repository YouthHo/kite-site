#!/usr/bin/env node
// 生成 sitemap.xml 与 robots.txt（占位域名环境化：VITE_SITE_URL 驱动，零 kite.example.com 硬编码）
// 用法：node scripts/gen-sitemap.cjs   （BASE 取自 VITE_BASE，默认 '/'）
const { writeFileSync, mkdirSync } = require('node:fs')
const { resolve } = require('node:path')

const SITE_URL = (process.env.VITE_SITE_URL || 'https://kite.example.com').replace(/\/$/, '')
const BASE = process.env.VITE_BASE || '/'

const ROUTES = ['/', '/graph', '/characters', '/cast', '/episodes', '/timeline', '/architecture', '/history', '/scenes']

const now = new Date().toISOString().slice(0, 10)
const loc = (p) => SITE_URL + (BASE === '/' ? p : BASE.replace(/\/$/, '') + p)

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTES.map((r) => `  <url>\n    <loc>${loc(r)}</loc>\n    <lastmod>${now}</lastmod>\n  </url>`).join('\n')}
</urlset>
`

const robots = `User-agent: *
Allow: /
Sitemap: ${loc('/sitemap.xml')}
`

mkdirSync(resolve('public'), { recursive: true })
writeFileSync(resolve('public', 'sitemap.xml'), sitemap, 'utf8')
writeFileSync(resolve('public', 'robots.txt'), robots, 'utf8')
console.log(`[gen-sitemap] ${SITE_URL}${BASE} -> public/sitemap.xml + public/robots.txt (${ROUTES.length} routes)`)
