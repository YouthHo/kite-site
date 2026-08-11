<script setup>
import SealStamp from '@/components/SealStamp.vue'

/**
 * 名场面原创构图卡：零照片依赖、零横纹风险
 * 构成：大号集数 + 金色分割线 + 标题 + 一句话 + 胶片孔点阵（竖排圆点，非 repeating-gradient）+ 封条水印
 * 文字走主题映射色（浅色主题自动深字），不使用 on-media
 */
defineProps({
  scene: { type: Object, required: true },
})
</script>

<template>
  <figure class="scene-card k-card relative overflow-hidden group h-full">
    <!-- 胶片孔点阵（竖排圆点装饰，杜绝任何横纹） -->
    <div class="absolute left-2.5 top-3 bottom-3 flex flex-col justify-around opacity-35 pointer-events-none" aria-hidden="true">
      <span v-for="i in 7" :key="i" class="w-1.5 h-1.5 rounded-full border border-[#e8dcc8]/50"></span>
    </div>
    <div class="absolute right-2.5 top-3 bottom-3 flex flex-col justify-around opacity-35 pointer-events-none" aria-hidden="true">
      <span v-for="i in 7" :key="i" class="w-1.5 h-1.5 rounded-full border border-[#e8dcc8]/50"></span>
    </div>

    <div class="relative p-5 md:p-6 pl-7 md:pl-8">
      <!-- 大号集数（主题映射色，无 on-media） -->
      <div class="flex items-baseline justify-between">
        <div class="serif-title text-5xl md:text-6xl leading-none text-[#9d2235]/85">{{ String(scene.episode).padStart(2, '0') }}</div>
        <div class="font-mono text-[10px] tracking-[0.3em] text-[#8a8275]">SCENE-{{ scene.id.toUpperCase() }}</div>
      </div>
      <div class="gold-line mt-3"></div>
      <h3 class="title-sans text-[17px] mt-3 text-[#e8dcc8] group-hover:text-[#f0e6d2] transition-colors duration-200">{{ scene.title }}</h3>
      <p class="mt-2 text-[12px] leading-5 text-[#a89f8e] line-clamp-3">{{ scene.desc }}</p>
      <!-- 封条水印（原创印章图形） -->
      <div class="absolute -right-7 -bottom-7 w-28 h-28 opacity-[0.07] pointer-events-none group-hover:opacity-[0.12] transition-opacity duration-300">
        <SealStamp :text="'名场面'" :size="112" />
      </div>
    </div>
  </figure>
</template>
