import { reactive, computed, ref } from 'vue'

/**
 * 全局轻量状态（无 Pinia 依赖）：
 * - 观剧进度（localStorage 持久化）→ 驱动防剧透解锁、进度面板
 * - 全局搜索弹窗开关
 * - 主题（dark 默认 / light 档案纸），持久化 + 挂到 <html data-theme>
 */
const KEY = '***'

const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
})()

const state = reactive({
  watched: new Set(saved),
  searchOpen: false,
})

// ---------- 主题 ----------
const theme = ref(localStorage.getItem('kite-theme') || 'dark')
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t)
}
function setTheme(t) {
  theme.value = t
  try {
    localStorage.setItem('kite-theme', t)
  } catch {
    /* ignore */
  }
  applyTheme(t)
}
function toggleTheme() {
  setTheme(theme.value === 'dark' ? 'light' : 'dark')
}
applyTheme(theme.value) // 首帧兜底（index.html 已有预执行脚本，双保险）

export const appState = {
  state,
  isWatched(ep) {
    return state.watched.has(Number(ep))
  },
  toggleWatch(ep) {
    const n = Number(ep)
    if (state.watched.has(n)) state.watched.delete(n)
    else state.watched.add(n)
    persist()
  },
  markRange(from, to) {
    for (let i = from; i <= to; i++) state.watched.add(i)
    persist()
  },
  clear() {
    state.watched.clear()
    persist()
  },
  // 是否已看到大结局（默认阈值 46，可调）
  unlocked(threshold = 46) {
    return state.watched.size >= threshold
  },
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify([...state.watched]))
  } catch {
    /* ignore */
  }
}

export const searchOpen = computed({
  get: () => state.searchOpen,
  set: (v) => (state.searchOpen = v),
})
export { theme, setTheme, toggleTheme }
