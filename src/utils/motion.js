import gsap from 'gsap'
import { prefersReduced } from '@/utils/anim'

/**
 * 动效语言统一封装（P · motion spec）
 * 所有新动效一律走本模块：缓动/时长/stagger 编排集中管理
 */
export const presets = {
  dur: {
    fast: 0.15,
    base: 0.25,
    slow: 0.4,
    entrance: 0.5,
    exit: 0.3,
  },
  ease: {
    out: 'power3.out',
    inOut: 'power2.inOut',
    back: 'back.out(1.7)',
  },
  stagger: 0.06,
}

/** 入场：淡入 + 上移（返回可 kill 的 tween） */
export function entrance(el, { delay = 0, y = 12, duration = presets.dur.entrance, ease = presets.ease.out } = {}) {
  if (!el) return null
  if (prefersReduced) {
    gsap.set(el, { opacity: 1, y: 0 })
    return null
  }
  return gsap.fromTo(el, { opacity: 0, y }, { opacity: 1, y: 0, duration, delay, ease })
}

/** 滚动揭示（ScrollTrigger once） */
export function scrollReveal(el, { start = 'top 88%', y = 40, duration = 0.9 } = {}) {
  if (prefersReduced || !el) return null
  return gsap.fromTo(el, { opacity: 0, y }, { opacity: 1, y: 0, duration, ease: presets.ease.out, scrollTrigger: { trigger: el, start, once: true } })
}

/** 批量 stagger 入场（容器内子项） */
export function staggerIn(container, { delay = 0, y = 14 } = {}) {
  const els = container ? container.querySelectorAll('[data-stagger]') : []
  if (!els.length) return null
  if (prefersReduced) {
    gsap.set(els, { opacity: 1, y: 0 })
    return null
  }
  return gsap.fromTo(els, { opacity: 0, y }, { opacity: 1, y: 0, duration: presets.dur.entrance, stagger: presets.stagger, delay, ease: presets.ease.out })
}
