import { createApp } from 'vue'
import App from './app.vue'
import router from './router'
import './styles/main.scss'
// 全局注册 GSAP + ScrollTrigger（所有页面共用）
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

// 全局可访问（组件内也可直接 import）
export { gsap, ScrollTrigger }

createApp(App).use(router).mount('#app')
