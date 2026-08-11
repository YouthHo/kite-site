import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
// 字体自托管（2.0）：本地 woff2，替代 Google Fonts 外链
import '@fontsource/noto-sans-sc/400.css'
import '@fontsource/noto-sans-sc/500.css'
import '@fontsource/noto-serif-sc/500.css'
import '@fontsource/noto-serif-sc/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import './styles/main.scss'
import './styles/theme-light.css' // 浅色主题颜色映射（由 scripts/gen_theme_css.py 生成）
// 全局注册 GSAP + ScrollTrigger（所有页面共用）
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

// 全局可访问（组件内也可直接 import）
export { gsap, ScrollTrigger }

createApp(App).use(router).use(i18n).mount('#app')
