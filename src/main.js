import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import skinManifest from './skins/thread-universe/manifest.json'
// 字体自托管（2.0）：本地 woff2，替代 Google Fonts 外链
import '@fontsource/noto-sans-sc/400.css'
import '@fontsource/noto-sans-sc/500.css'
import '@fontsource/noto-serif-sc/500.css'
import '@fontsource/noto-serif-sc/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import './styles/main.scss'
import './styles/theme-light.css'
import './styles/print.css' // 打印视图
// 全局注册 GSAP + ScrollTrigger（所有页面共用）
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

// 全局可访问（组件内也可直接 import）
export { gsap, ScrollTrigger }

// 皮肤挂载：data-skin 由 localStorage 选择（皮肤注册表）
try {
  document.documentElement.setAttribute('data-skin', localStorage.getItem('kite-skin') || 'thread-universe')
} catch (e) {
  document.documentElement.setAttribute('data-skin', 'thread-universe')
}
void skinManifest
createApp(App).use(router).use(i18n).mount('#app')
