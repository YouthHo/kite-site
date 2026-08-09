<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { Share2, Check, Link2, MessageCircle, Globe } from 'lucide-vue-next'

const props = defineProps({
  title: { type: String, default: '风筝 · 信仰至上 半生潜伏' },
})
const open = ref(false)
const copied = ref(false)
const menuLeft = ref(false)
let tween = null

function toggle() {
  open.value = !open.value
  if (open.value) {
    // 自适应展开方向：按钮在屏幕左半侧时菜单向右展开，避免跑出屏幕
    const btn = document.querySelector('[aria-label="分享"]')
    if (btn) {
      const rect = btn.getBoundingClientRect()
      menuLeft.value = rect.left < window.innerWidth / 2
    }
    gsap.fromTo('.share-menu', { opacity: 0, y: 8, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.6)' })
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(location.href)
  } catch {
    /* 老浏览器忽略 */
  }
  copied.value = true
  gsap.fromTo('.share-check', { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' })
  setTimeout(() => {
    copied.value = false
    open.value = false
  }, 1400)
}

function shareTo(site) {
  const url = encodeURIComponent(location.href)
  const text = encodeURIComponent(props.title)
  const map = {
    weibo: `https://service.weibo.com/share/share.php?url=${url}&title=${text}`,
    douban: `https://www.douban.com/search?q=${text}`,
    x: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
  }
  window.open(map[site], '_blank', 'noopener')
}

onBeforeUnmount(() => tween?.kill())
</script>

<template>
  <div class="relative inline-block">
    <button
      class="w-10 h-10 grid place-items-center rounded-full border border-[#2a2520] bg-[#0e0e0e]/80 text-[#8a8275] hover:text-[#e8dcc8] hover:border-[#9d2235] hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(157,34,53,0.3)] transition-all duration-300"
      aria-label="分享"
      @click="toggle"
    >
      <Share2 :size="16" />
    </button>
    <div v-if="open" class="share-menu absolute bottom-12 z-20 glass p-2 w-44" :class="menuLeft ? 'left-0' : 'right-0'">
      <button class="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#8a8275] hover:bg-[#161616] hover:text-[#e8dcc8]" @click="copyLink">
        <Check v-if="copied" :size="13" class="share-check text-[#b8860b]" />
        <Link2 v-else :size="13" />
        {{ copied ? '已复制链接' : '复制链接' }}
      </button>
      <button class="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#8a8275] hover:bg-[#161616] hover:text-[#e8dcc8]" @click="shareTo('weibo')">
        <Globe :size="13" /> 分享到微博
      </button>
      <button class="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#8a8275] hover:bg-[#161616] hover:text-[#e8dcc8]" @click="shareTo('douban')">
        <MessageCircle :size="13" /> 去豆瓣搜剧
      </button>
    </div>
  </div>
</template>
