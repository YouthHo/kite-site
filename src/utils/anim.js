import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/** 用户偏好减少动态效果时，全局降级为“只淡入” */
export const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * 页面元素错落入场：给元素加 data-enter 属性，
 * 进入页面时按顺序 淡入+上移。
 * @param {HTMLElement|string} scope 容器或选择器
 * @param {object} vars { stagger, y, duration, delay }
 */
export function pageEnter(scope = document.body, vars = {}) {
  if (prefersReduced) {
    gsap.set(scope.querySelectorAll('[data-enter]'), { opacity: 1 })
    return
  }
  const els = scope.querySelectorAll('[data-enter]')
  if (!els.length) return
  const { stagger = 0.06, y = 24, duration = 0.55, delay = 0.05 } = vars
  // 仅 opacity + 位移，不用 blur（性能更快、切换更跟手）
  gsap.fromTo(
    els,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration,
      stagger,
      delay,
      ease: 'power3.out',
      overwrite: 'auto',
    }
  )
}

/**
 * 滚动进入视口时从下方滑入 + 淡入（ScrollTrigger）
 * 用法：在 onMounted 中批量调用 revealUp('.js-reveal', {stagger:0.1})
 */
export function revealUp(targets, vars = {}) {
  if (prefersReduced) return
  const { stagger = 0, start = 'top 88%', y = 40, duration = 0.9, once = true, delay = 0 } = vars
  const els = gsap.utils.toArray(targets)
  if (!els.length) return
  els.forEach((el, i) => {
    gsap.fromTo(
      el,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration,
        delay: delay + i * stagger,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start, once },
      }
    )
  })
}

/** 图片从模糊到清晰 + 轻微缩放（Ken Burns 变体） */
export function imageReveal(img, vars = {}) {
  gsap.fromTo(
    img,
    { filter: 'blur(14px) saturate(0.7)', scale: 1.06 },
    {
      filter: 'blur(0px) saturate(1)',
      scale: 1,
      duration: 1.4,
      ease: 'power2.out',
      scrollTrigger: { trigger: img, start: 'top 85%', once: true },
      ...vars,
    }
  )
}

/** 打字机效果：逐字输出文字 */
export function typewriter(el, text, { speed = 90, caret = true, onDone } = {}) {
  if (prefersReduced) {
    el.textContent = text
    onDone?.()
    return
  }
  el.textContent = ''
  const span = document.createElement('span')
  span.className = 'tw-caret'
  let i = 0
  const tick = () => {
    if (i <= text.length) {
      el.textContent = text.slice(0, i)
      if (caret) el.appendChild(span)
      i++
      gsap.delayedCall(speed / 1000, tick)
    } else {
      onDone?.()
    }
  }
  tick()
}

/** 视差：元素随滚动轻微位移（scrollTrigger scrub） */
export function parallax(targets, vars = {}) {
  if (prefersReduced) return
  const { y = 60, start = 'top bottom', end = 'bottom top' } = vars
  gsap.utils.toArray(targets).forEach((el) => {
    gsap.fromTo(
      el,
      { y: -y / 2 },
      {
        y: y / 2,
        ease: 'none',
        scrollTrigger: { trigger: el, start, end, scrub: 1.2 },
      }
    )
  })
}

/**
 * 标题从左到右渐显（遮罩扫过）
 */
export function titleSweep(el, vars = {}) {
  gsap.fromTo(
    el,
    { clipPath: 'inset(0 100% 0 0)' },
    { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power4.inOut', ...vars }
  )
}

/** 滚动刷新（路由切换后调用，避免 ScrollTrigger 位置错乱） */
export function refreshTriggers() {
  requestAnimationFrame(() => ScrollTrigger.refresh())
}
