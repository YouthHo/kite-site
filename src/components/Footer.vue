<script setup>
import { onMounted } from 'vue'
import gsap from 'gsap'

const year = new Date().getFullYear()

onMounted(() => {
  // 页脚入场：从下方淡入
  gsap.fromTo('.k-footer', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.2 })
})
</script>

<template>
  <footer class="k-footer border-t border-[#1c1815] bg-[#060606]">
    <div class="max-w-[1400px] mx-auto px-6 md:px-10 py-14">
      <div class="grid md:grid-cols-3 gap-10">
        <div>
          <div class="serif-title text-xl tracking-[0.3em] text-[#e8dcc8]">风 筝</div>
          <p class="mt-4 text-[13px] leading-7 text-[#8a8275] max-w-[280px]">
            信仰至上 · 半生潜伏。<br />一个人能有资格为国家牺牲，就是对自身价值的最好证明。
          </p>
        </div>
        <div>
          <div class="file-label mb-5">快速索引</div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] text-[#8a8275]">
            <router-link to="/graph" class="nav-link hover:text-[#e8dcc8]">人物关系图谱</router-link>
            <router-link to="/characters" class="nav-link hover:text-[#e8dcc8]">角色档案库</router-link>
            <router-link to="/episodes" class="nav-link hover:text-[#e8dcc8]">分集剧情</router-link>
            <router-link to="/timeline" class="nav-link hover:text-[#e8dcc8]">全剧时间线</router-link>
            <router-link to="/history" class="nav-link hover:text-[#e8dcc8]">历史背景</router-link>
            <router-link to="/scenes" class="nav-link hover:text-[#e8dcc8]">名场面与台词</router-link>
          </div>
        </div>
        <div>
          <div class="file-label mb-5">关于本站</div>
          <p class="text-[13px] leading-7 text-[#555048]">
            本为非官方同人致敬网站，与《风筝》剧集制作方无关。剧照与海报版权归原出品方所有。<br />
            内容整理自公开资料，仅供学习交流，不用于商业用途。<br />
            © {{ year }} Kite Files · 非官方同人站
          </p>
        </div>
      </div>
      <div class="mt-12 pt-6 border-t border-[#1c1815] font-mono text-[10px] tracking-[0.35em] text-[#555048]">
        THE KITE · 2017 · 46 EPISODES
      </div>
    </div>
  </footer>
</template>

