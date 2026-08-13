<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import scenes from '@/data/scenes.json'
import quotes from '@/data/quotes.json'
import SealStamp from '@/components/SealStamp.vue'
import SceneCard from '@/components/SceneCard.vue'
import QuoteCard from '@/components/QuoteCard.vue'
import { pageEnter, prefersReduced } from '@/utils/anim'

const tab = ref('scenes')
let crossTween = null

function switchTab(t) {
  if (t === tab.value) return
  tab.value = t
  // 名称面切换不再做入场动画：直接显示，响应速度优于花哨效果
}

onMounted(async () => {
  await nextTick()
  pageEnter(document.querySelector('.scenes-page'))
})
onBeforeUnmount(() => crossTween?.kill())
</script>

<template>
  <div class="scenes-page page-wrap">
    <div class="mb-8 flex flex-wrap items-center gap-6">
      <div class="flex items-center gap-4">
        <SealStamp :text="'名场\n面录'" />
        <h2 class="serif-title text-4xl md:text-5xl text-[#e8dcc8]" data-enter>名场面与台词</h2>
      </div>
      <!-- 标签切换：静态激活态，无任何滑动动画；自然宽度 + 禁换行，任何视口下都不分行 -->
      <div class="flex border-b border-[#2a2520]" data-enter>
        <button
          class="whitespace-nowrap px-5 py-2.5 text-[13px] tracking-[0.2em] transition-colors duration-200"
          :class="tab === 'scenes' ? 'text-[#e8dcc8] bg-[#b91c1c]/10' : 'text-[#8f897c] hover:text-[#a89f8e]'"
          @click="switchTab('scenes')"
        >
          名场面
        </button>
        <button
          class="whitespace-nowrap px-5 py-2.5 text-[13px] tracking-[0.2em] transition-colors duration-200"
          :class="tab === 'quotes' ? 'text-[#e8dcc8] bg-[#b91c1c]/10' : 'text-[#8f897c] hover:text-[#a89f8e]'"
          @click="switchTab('quotes')"
        >
          经典台词
        </button>
      </div>
    </div>

    <!-- 名场面：原创构图卡（零照片依赖，无 img 无破图无条纹） -->
    <div v-if="tab === 'scenes'" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      <SceneCard v-for="s in scenes" :key="s.id" :scene="s" />
    </div>

    <!-- 经典台词 -->
    <div v-else class="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="q in quotes" :key="q.id" class="scenes-item">
        <QuoteCard :quote="q" />
      </div>
    </div>
  </div>
</template>
