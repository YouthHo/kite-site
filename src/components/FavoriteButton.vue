<script setup>
import { computed } from "vue"
import { Star } from "lucide-vue-next"
import { toggleFavorite, isFavorite, libraryState } from "@/store/library"

const props = defineProps({
  type: { type: String, required: true },
  id: { type: [String, Number], required: true },
})
const emit = defineEmits(["change"])

const active = computed(() => isFavorite(props.type, String(props.id)))

function click(e) {
  e.stopPropagation()
  e.preventDefault()
  toggleFavorite(props.type, String(props.id))
  emit("change", active.value)
  void libraryState
}
</script>

<template>
  <button
    class="w-7 h-7 grid place-items-center rounded border transition-colors m-focus-ring"
    :class="active ? 'border-[#8c4a2f] text-[#8c4a2f] bg-[#8c4a2f]/10' : 'border-[#2a2520] text-[#a89f8e] hover:text-[#e8dcc8] hover:border-[#8c4a2f]'"
    :aria-label="active ? '取消收藏' : '收藏'"
    :aria-pressed="active"
    :title="active ? '取消收藏' : '收藏'"
    @click="click"
  >
    <Star :size="13" :fill="active ? 'currentColor' : 'none'" />
  </button>
</template>