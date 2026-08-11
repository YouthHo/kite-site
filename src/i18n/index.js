import { createI18n } from 'vue-i18n'
import zh from '@/locales/zh.json'
import en from '@/locales/en.json'

/**
 * i18n 配置（2.0 · D）：
 * - locale 持久化 localStorage('kite-lang')，支持 ?lang=en 临时切换，不新增路由前缀（不破坏三平台与 SEO）
 * - 缺省 zh；en 缺失键回退 zh（内容双语由数据作者按字段级 *_en 补充）
 */
function resolveLocale() {
  try {
    const q = new URLSearchParams(window.location.search).get('lang')
    if (q === 'en' || q === 'zh') return q
    const saved = localStorage.getItem('kite-lang')
    if (saved === 'en' || saved === 'zh') return saved
  } catch (e) {
    /* ignore */
  }
  return 'zh'
}

const i18n = createI18n({
  legacy: false,
  locale: resolveLocale(),
  fallbackLocale: 'zh',
  messages: { zh, en },
})

export function setLocale(locale) {
  i18n.global.locale.value = locale
  try {
    localStorage.setItem('kite-lang', locale)
  } catch (e) {
    /* ignore */
  }
  document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN'
}

export default i18n
