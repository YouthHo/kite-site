import { createRouter, createWebHistory } from 'vue-router'

// 路由懒加载：每个页面独立分包，提升首屏速度
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/UniverseView.vue'),
    meta: { title: '风筝 · 信仰至上 半生潜伏', desc: '首页' },
  },
  {
    path: '/universe',
    name: 'universe',
    component: () => import('@/views/UniverseView.vue'),
    meta: { title: '风筝 · 一线宇宙', desc: '宇宙入口' },
  },
  {
    path: '/graph',
    name: 'graph',
    component: () => import('@/views/GraphView.vue'),
    meta: { title: '人物关系图谱 · 风筝', desc: '图谱' },
  },
  {
    path: '/characters',
    name: 'characters',
    component: () => import('@/views/CharactersView.vue'),
    meta: { title: '角色档案库 · 风筝', desc: '档案' },
  },
  {
    path: '/cast',
    name: 'cast',
    component: () => import('@/views/CastView.vue'),
    meta: { title: '演员阵容 · 风筝', desc: '演员' },
  },
  {
    path: '/episodes',
    name: 'episodes',
    component: () => import('@/views/EpisodesView.vue'),
    meta: { title: '分集剧情 · 风筝', desc: '剧集' },
  },
  {
    path: '/timeline',
    name: 'timeline',
    component: () => import('@/views/TimelineView.vue'),
    meta: { title: '全剧时间线 · 风筝', desc: '时间线' },
  },
  {
    path: '/architecture',
    name: 'architecture',
    component: () => import('@/views/ArchitectureView.vue'),
    meta: { title: '势力架构 · 风筝', desc: '架构' },
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('@/views/HistoryView.vue'),
    meta: { title: '历史背景 · 风筝', desc: '历史' },
  },
  {
    path: '/library',
    name: 'library',
    component: () => import('@/views/LibraryView.vue'),
    meta: { title: '收藏夹 · 风筝', desc: '收藏夹' },
  },
  {
    path: '/scenes',
    name: 'scenes',
    component: () => import('@/views/ScenesView.vue'),
    meta: { title: '名场面与台词 · 风筝', desc: '名场面' },
  },
  // 404 → 回首页
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

router.afterEach((to) => {
  document.title = to.meta?.title || '风筝 The Kite'
})

export default router
