import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
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
