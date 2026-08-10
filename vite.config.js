import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * 部署基础路径。
 * - Vercel / Cloudflare Pages / 自定义域名：根路径 "/"（默认）
 * - GitHub Pages 项目站点：需为 "/<仓库名>/"，通过环境变量 VITE_BASE 注入
 *   例：VITE_BASE=/kite-site/ npm run build
 */
const BASE = process.env.VITE_BASE || '/'

/**
 * GitHub Pages 没有服务端 rewrite 能力，SPA 深链接（如 /kite-site/graph）
 * 会走到 404。将 index.html 复制为 404.html 即可让 Pages 回退到 SPA 入口。
 */
function spaFallback404() {
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    closeBundle() {
      const dist = resolve(process.cwd(), 'dist')
      const index = resolve(dist, 'index.html')
      if (existsSync(index)) {
        copyFileSync(index, resolve(dist, '404.html'))
      }
    },
  }
}

/**
 * src/data/*.json 中的图片是写死的绝对路径（/images/xxx.jpg）。
 * 根路径部署（Vercel / Cloudflare Pages）没问题，但 GitHub Pages 子路径部署
 * 会全部 404。这里在构建期把这些字符串统一改写为 base 前缀。
 * base 为 "/" 时不做任何改动。
 */
function rewriteDataAssetBase() {
  return {
    name: 'rewrite-data-asset-base',
    enforce: 'pre',
    apply: 'build',
    transform(code, id) {
      if (BASE === '/') return null
      const file = id.split('?')[0].replace(/\\/g, '/')
      if (!/\/src\/data\/[^/]+\.json$/.test(file)) return null
      if (!code.includes('"/images/')) return null
      return { code: code.split('"/images/').join(`"${BASE}images/`), map: null }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: BASE,
  plugins: [vue(), rewriteDataAssetBase(), spaFallback404()],
  css: {
    preprocessorOptions: {
      // 使用 Dart Sass 现代 API，避免 legacy-js-api 弃用警告
      scss: { api: 'modern' },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // 手动分包：GSAP / ECharts / 框架各自独立 chunk，利于缓存与首屏
        manualChunks: {
          gsap: ['gsap'],
          echarts: ['echarts'],
          vendor: ['vue', 'vue-router', 'lucide-vue-next'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
})
