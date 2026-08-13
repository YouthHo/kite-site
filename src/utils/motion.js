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

/* ============ 3.0 · 四类原创动效（朱砂入墨语法） ============ */

/** 墨晕开：模糊浓墨 → 清晰落定（标题/卡片显影） */
export function inkBleed(el, { delay = 0, blur = 14, duration = 1.1 } = {}) {
  if (!el) return null
  if (prefersReduced) {
    gsap.set(el, { opacity: 1, filter: 'none' })
    return null
  }
  return gsap.fromTo(
    el,
    { opacity: 0, filter: `blur(${blur}px)`, scale: 1.06 },
    { opacity: 1, filter: 'blur(0px)', scale: 1, duration, delay, ease: presets.ease.out }
  )
}

/** 封印落定：旋转压印（印章/徽章） */
export function sealStamp(el, { delay = 0, rotation = -14, scale = 1.7 } = {}) {
  if (!el) return null
  if (prefersReduced) {
    gsap.set(el, { opacity: 1, rotation: 0, scale: 1 })
    return null
  }
  return gsap.fromTo(
    el,
    { opacity: 0, rotation, scale },
    { opacity: 1, rotation: rotation * 0.7, scale: 1, duration: 0.5, delay, ease: 'back.out(2.2)' }
  )
}

/** 卷轴展开：自上而下展开（区块/页面揭幕） */
export function scrollUnfurl(el, { delay = 0, duration = 0.7 } = {}) {
  if (!el) return null
  if (prefersReduced) {
    gsap.set(el, { opacity: 1, clipPath: 'none' })
    return null
  }
  return gsap.fromTo(
    el,
    { opacity: 0.4, clipPath: 'inset(100% 0 0 0)' },
    { opacity: 1, clipPath: 'inset(0% 0 0 0)', duration, delay, ease: presets.ease.inOut }
  )
}

/** 一线牵引：SVG 描边生长（风筝线/装饰线） */
export function threadDraw(el, { delay = 0, length = 420, duration = 1.3 } = {}) {
  if (!el) return null
  if (prefersReduced) {
    gsap.set(el, { strokeDashoffset: 0 })
    return null
  }
  return gsap.fromTo(el, { strokeDashoffset: length }, { strokeDashoffset: 0, duration, delay, ease: presets.ease.inOut })
}
