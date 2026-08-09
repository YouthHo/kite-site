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
  <footer class="k-footer border-t border-[#2a2520] bg-[#060606]">
    <div class="max-w-[1400px] mx-auto px-5 md:px-8 py-12">
      <div class="grid md:grid-cols-3 gap-8">
        <div>
          <div class="serif-title text-lg tracking-[0.3em] text-[#e8dcc8]">风 筝</div>
          <p class="mt-3 text-[12px] leading-6 text-[#8a8275] max-w-[260px]">
            信仰至上 · 半生潜伏。<br />一个人能有资格为国家牺牲，就是对自身价值的最好证明。
          </p>
        </div>
        <div>
          <div class="file-label mb-4">快速索引</div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px] text-[#8a8275]">
            <router-link to="/graph" class="nav-link hover:text-[#e8dcc8]">人物关系图谱</router-link>
            <router-link to="/characters" class="nav-link hover:text-[#e8dcc8]">角色档案库</router-link>
            <router-link to="/episodes" class="nav-link hover:text-[#e8dcc8]">分集剧情</router-link>
            <router-link to="/timeline" class="nav-link hover:text-[#e8dcc8]">全剧时间线</router-link>
            <router-link to="/history" class="nav-link hover:text-[#e8dcc8]">历史背景</router-link>
            <router-link to="/scenes" class="nav-link hover:text-[#e8dcc8]">名场面与台词</router-link>
          </div>
        </div>
        <div>
          <div class="file-label mb-4">关于本站</div>
          <p class="text-[12px] leading-6 text-[#555048]">
            非官方粉丝资料站 · 内容整理自公开资料（豆瓣 / 百度百科 / 电视猫等），仅供学习交流。<br />
            剧照与图片均为占位图（picsum.photos），请替换为正式素材。<br />
            © {{ year }} Kite Files.
          </p>
        </div>
      </div>
      <div class="mt-10 pt-6 border-t border-[#1c1815] flex flex-col md:flex-row justify-between gap-3 font-mono text-[10px] tracking-[0.3em] text-[#555048]">
        <span>THE KITE · 2017 — 北京卫视 / 东方卫视</span>
        <span>46 EPISODES · 柳云龙 导演作品</span>
      </div>
    </div>
  </footer>
</template>
