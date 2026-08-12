<script setup>
import { computed } from 'vue'

/**
 * 阵营徽记（原创几何 SVG，单色 currentColor）
 * 五阵营：junton 军统（利剑+盾）/ zhongtong 中统（天平+卷轴）/ underground 地下党（红星+麦穗）
 *         gongan 公安（盾+五角）/ civilian 平民（屋脊+风筝线）
 */
const props = defineProps({
  faction: { type: String, default: 'civilian' },
  size: { type: Number, default: 40 },
})

const PATHS = {
  junton: {
    // 盾 + 竖剑
    main: 'M20 2 L32 8 V20 C32 30 26 36 20 38 C14 36 8 30 8 20 V8 Z',
    inner: 'M20 8 L27 11 V20 C27 26 24 30 20 32 C16 30 13 26 13 20 V11 Z',
    accent: 'M20 7 V33 M16 24 L20 28 L24 24',
  },
  zhongtong: {
    // 天平 + 底座
    main: 'M4 12 H36 M20 12 V26 M12 18 H28 V20 H12 Z M8 26 H32 L20 36 Z',
    inner: 'M10 16 L20 12 L30 16',
    accent: 'M20 26 V34 M14 34 H26',
  },
  underground: {
    // 五角星 + 麦穗弧
    main: 'M20 6 L24 15 L34 15.5 L26 22 L29 32 L20 26.5 L11 32 L14 22 L6 15.5 L16 15 Z',
    inner: 'M8 32 Q20 38 32 32',
    accent: 'M20 10 V26 M14 16 H26',
  },
  gongan: {
    // 盾 + 五角 + 横杠
    main: 'M20 2 L34 8 V20 C34 31 28 37 20 39 C12 37 6 31 6 20 V8 Z',
    inner: 'M20 11 L23 19 L31 19 L24.5 24 L27 32 L20 27.5 L13 32 L15.5 24 L9 19 L17 19 Z',
    accent: 'M6 24 H34',
  },
  civilian: {
    // 屋脊 + 线
    main: 'M6 24 L20 8 L34 24 M12 22 V32 H28 V22 M20 24 V32',
    inner: 'M10 18 Q20 30 30 18',
    accent: 'M14 27 H26',
  },
}

const p = computed(() => PATHS[props.faction] || PATHS.civilian)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 40 40"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    role="img"
    :aria-label="`${faction} 徽记`"
  >
    <path :d="p.main" fill="currentColor" fill-opacity="0.12" />
    <path :d="p.main" />
    <path :d="p.inner" />
    <path :d="p.accent" opacity="0.7" />
  </svg>
</template>
