import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
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
