<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { X } from 'lucide-vue-next'
import actors from '@/data/actors.json'
import characters from '@/data/characters.json'
import { avatarUri, isRealPhoto } from '@/utils/avatar'
import { pageEnter, prefersReduced } from '@/utils/anim'

const detail = ref(null)
const panel = ref(null)
const compare = ref(50) // 对比滑块位置 0-100
let panelTween = null

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
    <div class="mb-8">
      <h2 class="serif-title text-4xl md:text-5xl text-[#e8dcc8]" data-enter>演员阵容</h2>
      <div class="gold-line w-40 mt-3" data-enter></div>
      <p class="mt-3 font-mono text-[11px] tracking-[0.3em] text-[#8a8275]" data-enter>16 位主演 · 照片悬停彩色化 · 点击查看详情</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-7">
      <article
        v-for="a in actors"
        :key="a.id"
        class="k-card archive-tape relative overflow-hidden cursor-pointer group"
        data-enter
        @click="open(a)"
      >
        <div class="aspect-[3/4] overflow-hidden bg-[#101010]">
          <!-- 真实照片：悬停轻微放大（不再黑白化） -->
          <img
            v-if="isRealPhoto(a.image)"
            :src="a.image"
            :alt="a.name"
            loading="lazy"
            class="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
          />
          <img v-else :src="avatarUri(a.id, a.name, 'civilian')" :alt="a.name" loading="lazy" class="w-full h-full object-cover" />
        </div>
        <div class="p-5 relative">
          <h3 class="serif-title text-[17px] text-[#e8dcc8]">{{ a.name }}</h3>
          <p class="mt-1 text-[12px] tracking-[0.15em] text-[#b8860b] transition-all duration-300 group-hover:-translate-y-0.5">
            饰 {{ a.role }}
          </p>
          <p class="mt-1 font-mono text-[10px] text-[#555048]">{{ a.roleNote }}</p>
        </div>
      </article>
    </div>

    <!-- 详情面板：从下方滑入 -->
    <Teleport to="body">
      <div v-if="detail" class="fixed inset-0 z-[92]">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-md" @click="close"></div>
        <section ref="panel" class="absolute bottom-0 left-0 right-0 max-h-[86vh] overflow-y-auto bg-[#0e0e0e] border-t border-[#2a2520]">
          <div class="max-w-5xl mx-auto p-6 md:p-10">
            <button class="absolute top-5 right-5 text-[#8a8275] hover:text-[#e8dcc8]" @click="close"><X :size="20" /></button>
            <div class="grid md:grid-cols-[280px_1fr] gap-8">
              <!-- 演员写真 -->
              <div>
                <img :src="detail.image" :alt="detail.name" class="w-full object-cover border border-[#2a2520] k-img" />
              </div>
              <div class="min-w-0">
                <div class="font-mono text-[10px] tracking-[0.35em] text-[#9d2235]">CAST FILE</div>
                <h3 class="serif-title text-4xl mt-2 text-[#e8dcc8]">{{ detail.name }}</h3>
                <p class="mt-2 text-[15px] tracking-[0.2em] text-[#b8860b]">饰 · {{ detail.role }}</p>
                <p class="mt-4 text-[13px] leading-7 text-[#8a8275]">{{ detail.bio }}</p>
                <p v-if="roleInfo(detail)" class="mt-3 text-[12px] leading-6 text-[#555048]">
                  角色注：{{ roleInfo(detail).brief }}
                </p>

                <!-- 角色照 vs 演员照 滑块对比 -->
                <div class="mt-6">
                  <div class="file-label mb-3">角色照 / 演员照 对比</div>
                  <div class="relative h-52 overflow-hidden border border-[#2a2520] select-none" @mousemove="(e) => (compare = (e.offsetX / e.currentTarget.offsetWidth) * 100)">
                    <img :src="detail.image" alt="演员照" class="absolute inset-0 w-full h-full object-cover" />
                    <div class="absolute inset-0 overflow-hidden" :style="{ width: compare + '%' }">
                      <img :src="roleInfo(detail)?.image || detail.image" alt="角色照（占位）" class="absolute inset-0 w-full h-full object-cover" />
                    </div>
                    <div class="absolute top-0 bottom-0 w-[2px] bg-[#9d2235] shadow-[0_0_12px_rgba(157,34,53,0.8)]" :style="{ left: compare + '%' }">
                      <span class="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 rounded-full bg-[#9d2235] border-2 border-[#e8dcc8] grid place-items-center text-[10px] text-white cursor-ew-resize">⇔</span>
                    </div>
                    <span class="absolute top-2 left-2 font-mono text-[9px] tracking-[0.2em] text-white/80 bg-black/50 px-2 py-0.5">角色（占位）</span>
                    <span class="absolute top-2 right-2 font-mono text-[9px] tracking-[0.2em] text-white/80 bg-black/50 px-2 py-0.5">演员（占位）</span>
                  </div>
                  <p class="mt-2 text-[10px] text-[#555048]">左右拖动查看 · 图片均为占位图，请替换为正式剧照与写真</p>
                </div>

                <!-- 代表作 -->
                <div class="mt-6">
                  <div class="file-label mb-3">代表作</div>
                  <div class="flex flex-wrap gap-2">
                    <span v-for="w in detail.works" :key="w" class="px-3 py-1 text-[12px] border border-[#2a2520] text-[#8a8275]">{{ w }}</span>
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
