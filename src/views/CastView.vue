<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { X } from 'lucide-vue-next'
import actors from '@/data/actors.json'
import characters from '@/data/characters.json'
import SealStamp from '@/components/SealStamp.vue'
import { pageEnter, prefersReduced } from '@/utils/anim'

const detail = ref(null)
const panel = ref(null)
let panelTween = null

// 多彩档案配色（无真实照片时的名字卡，按索引轮换）
const PALETTE = [
  { from: '#b91c1c', to: '#6e1010' }, // 暗红
  { from: '#2f4a4f', to: '#123036' }, // 暗青
  { from: '#8c4a2f', to: '#4a2233' }, // 紫红
  { from: '#8b5a2b', to: '#5c3a1a' }, // 赭棕
  { from: '#3f6d5a', to: '#27463a' }, // 苔绿
  { from: '#5a4a7a', to: '#382c50' }, // 靛紫
]
const paletteOf = (i) => PALETTE[i % PALETTE.length]

onMounted(async () => {
  await nextTick()
  pageEnter(document.querySelector('.cast-page'))
})

function open(a) {
  detail.value = a
  gsap.fromTo(panel.value, { y: 120, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' })
}
function close() {
  panelTween = gsap.to(panel.value, { y: 120, opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: () => (detail.value = null) })
}

const roleInfo = (a) => characters.find((c) => c.actor === a.name)

onBeforeUnmount(() => panelTween?.kill())
</script>

<template>
  <div class="cast-page page-wrap">
    <div class="mb-10 flex items-center gap-5">
      <SealStamp :text="'演员\n阵容'" />
      <div>
        <h2 class="serif-title text-4xl md:text-5xl text-[#e8dcc8]" data-enter>演员阵容</h2>
        <div class="gold-line w-40 mt-3" data-enter></div>
        <p class="mt-3 text-[12px] tracking-[0.2em] text-[#a89f8e]" data-enter>16 位主演 · 点击查看详情</p>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-7">
      <article
        v-for="(a, i) in actors"
        :key="a.id"
        class="k-card relative overflow-hidden cursor-pointer group"
        data-enter
        @click="open(a)"
      >
        <!-- 媒体区：多彩名字卡（全站统一版式，不使用照片） -->
        <div class="aspect-[3/4] overflow-hidden bg-[#101010] relative">
          <div class="w-full h-full grid place-items-center transition-all duration-700 group-hover:scale-[1.03]"
            :style="{ background: `linear-gradient(155deg, ${paletteOf(i).from}, ${paletteOf(i).to})` }">
            <div class="text-center px-4">
              <div class="serif-title text-3xl md:text-4xl tracking-[0.18em] text-[#f5f2e9]" style="text-shadow: 0 2px 14px rgba(0,0,0,0.35)">{{ a.name }}</div>
              <div class="mx-auto mt-3 h-px w-24" style="background: linear-gradient(90deg, transparent, rgba(245,242,233,0.8), transparent)"></div>
              <div class="mt-2 font-mono text-[10px] tracking-[0.25em] text-[#f5f2e9]/80">饰 {{ a.role }}</div>
            </div>
          </div>
          <!-- 统一底部压影 -->
          <div class="absolute inset-x-0 bottom-0 h-16 pointer-events-none" style="background: linear-gradient(transparent, rgba(0,0,0,0.35))"></div>
          <span class="absolute top-3 right-3 font-mono text-[9px] tracking-[0.25em] text-[#f5f2e9]/60 border border-[#f5f2e9]/25 px-1.5 py-0.5">CAST-{{ String(i + 1).padStart(2, '0') }}</span>
        </div>
        <!-- 底部信息区（所有卡片一致） -->
        <div class="p-5 relative">
          <h3 class="serif-title text-[17px] text-[#e8dcc8]">{{ a.name }}</h3>
          <p class="mt-1 text-[12px] tracking-[0.15em] text-[#8c4a2f]">饰 {{ a.role }}</p>
          <p class="mt-1.5 text-[10px] tracking-[0.1em] text-[#8f897c] leading-4">{{ a.roleNote }}</p>
        </div>
      </article>
    </div>

    <!-- 详情面板 -->
    <Teleport to="body">
      <div v-if="detail" class="fixed inset-0 z-[92]">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-md" @click="close"></div>
        <section ref="panel" class="absolute bottom-0 left-0 right-0 max-h-[86vh] overflow-y-auto bg-[#0e0e0e] border-t border-[#2a2520]">
          <div class="max-w-5xl mx-auto p-6 md:p-10">
            <button class="absolute top-5 right-5 text-[#a89f8e] hover:text-[#e8dcc8]" @click="close"><X :size="20" /></button>
            <div class="grid md:grid-cols-[280px_1fr] gap-8">
              <div>
                <img :src="detail.image" :alt="detail.name" class="w-full object-cover border border-[#2a2520] k-img" />
              </div>
              <div class="min-w-0">
                <div class="font-mono text-[10px] tracking-[0.35em] text-[#b91c1c]">CAST FILE</div>
                <h3 class="serif-title text-4xl mt-2 text-[#e8dcc8]">{{ detail.name }}</h3>
                <p class="mt-2 text-[15px] tracking-[0.2em] text-[#8c4a2f]">饰 · {{ detail.role }}</p>
                <p class="mt-4 text-[13px] leading-7 text-[#a89f8e]">{{ detail.bio }}</p>
                <p v-if="roleInfo(detail)" class="mt-3 text-[12px] leading-6 text-[#8f897c]">
                  角色注：{{ roleInfo(detail).brief }}
                </p>

                <!-- 角色照 + 代表作：左右分栏均匀布局 -->
                <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                  <div>
                    <div class="file-label mb-3">角色照</div>
                    <div class="w-full max-w-[220px] aspect-[3/4] overflow-hidden border border-[#2a2520] relative">
                      <img :src="roleInfo(detail)?.image || detail.image" alt="角色照" class="absolute inset-0 w-full h-full object-cover k-img" />
                    </div>
                    <p class="mt-2 text-[10px] text-[#8f897c]">图片为占位，替换为正式剧照</p>
                  </div>
                  <div>
                    <div class="file-label mb-3">代表作</div>
                    <div class="flex flex-wrap gap-2">
                      <span v-for="w in detail.works" :key="w" class="px-3 py-1.5 text-[12px] border border-[#2a2520] text-[#a89f8e]">{{ w }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>
