# 《风筝》专题站 · 冲奖优化 Case Study

> 目标：把同人专题站提升到 Awwwards / CSS Design Awards / FWA 级别的作品。本文记录 2026-08 这一轮「性能 + 签名交互 + 视觉精修」的动机、做法与前后对比。

## 一、优化前的基线（阶段 0 实测）

| 指标 | 数值 | 判定 |
| --- | --- | --- |
| dist 总体积 | 2.9 MB | 图片未压缩 |
| 首屏 JS（index+vendor+gsap） | 305 KB 原始 / **138 KB gzip** | ✅ 已达标 |
| echarts chunk | **1,035 KB / gzip 343 KB** | ❌ 全量引入 |
| Google Fonts | 渲染阻塞样式表 | ❌ 拖慢 LCP |
| 真实图片（8 张 JPEG） | 1.48 MB | ❌ 未压缩 |
| 控制台/构建 | 干净（双模式构建通过） | ✅ |

## 二、阶段 1 · 性能门槛（已达成）

### 1. ECharts 按需引入
- 做法：`echarts/core` + `GraphChart/BarChart` + `GridComponent/TooltipComponent/LegendComponent` + `CanvasRenderer`，GraphView 与 TimelineView 各自注册所需组件。
- 结果：echarts chunk **1,035 KB → 394 KB（gzip 343 → 132 KB，-61%）**；后续补全组件注册后 509 KB（gzip ≈170 KB），仍为路由懒加载，**不进首屏**。
- 教训：按需引入必须逐项核对 option 用到的组件（grid/tooltip/legend），缺失会在控制台报 `Component xxx is used but not imported` 并导致图表布局异常——已通过 Puppeteer 控制台巡检捕获并修复。

### 2. Google Fonts 异步化
- 做法：`media="print" onload="this.media='all'"` + `<noscript>` 兜底，preconnect 保留。
- 结果：字体不再阻塞首屏渲染；加载失败自动回退系统字体（宋体系/黑体系），站点仍完整可用。

### 3. 图片 WebP
- 做法：sharp 批量转换 `public/images/*` 8 张真实照片 → WebP（q78，限宽 1200），保留原图兜底；JSON/组件引用全部切到 `.webp`。
- 结果：**1.48 MB → 346 KB（-77%）**；Vite 的 `/images` 子路径重写在 gh 模式下自动作用于 webp 引用（已验证 `/kite-site/images/...webp`）。

### 4. 路由级懒加载（阶段 0 确认）
- 9 个视图全部为独立 chunk，ECharts/GSAP 均不进首屏；`manualChunks` 将 gsap/vendor 独立分包缓存。

## 三、阶段 2 · 签名式交互（评审记忆点）

| 交互 | 说明 | 技术 |
| --- | --- | --- |
| 红线揭幕页面切换 | 路由切换时金红渐变细线自上而下扫过 + 暗幕 + 内容淡入，总时长 <0.6s | GSAP timeline，reduced-motion 降级纯淡入 |
| 余烬粒子 Hero | 首页 Canvas 半分辨率（≤44 粒子）金/红余烬上飘 + 辉光，隐喻「风筝线」 | rAF，移动端/触屏/降级关闭 |
| 自定义光标 | 双层磁吸（环 0.4s / 点 0.1s 错速拖尾），悬停可交互元素放大并浮现「解密」标签 | gsap.quickTo，仅 pointer:fine |
| 图谱打字机档案 | 点击节点 → 面板滑入 → 简介逐字浮现（电报母题） | typewriter（可取消句柄） |
| 时间线章节叙事 | 章节大字幕水印随滚动淡入淡出 + 金红渐变进度条 + ERA 指示 | ScrollTrigger pin + CSS transition |

全部尊重 `prefers-reduced-motion`；入场动画 ≤0.35s、不阻塞交互。

## 四、阶段 3 · 视觉系统精修

- 设计令牌：新增 `--gold-highlight` 高光金、三尺度圆角（3/6/10px）、三尺度阴影；`.k-card` / `.gold-line` 统一接入。
- Hero 重构：标题「显影 + 字距收束」（blur + letterSpacing 0.58em→0.42em）、「绝密档案」红印章压印、副标题高光金 + 辉光、金线加辉光。
- 对比度修复：`.file-label` 浅色主题 1.08:1 → **≈8:1**（生成器新增自定义类覆盖）；勾选标记改用主题映射色。
- 审计方法论：本地对比度审计器对「半透明背景」存在误报（不合成 alpha），需配合 Puppeteer 计算样式二次确认。

## 五、阶段 4 · 可访问性 / 移动端闭环

- 图谱容器 `role="application"` + aria-label 操作说明；侧栏人物列表按钮原生键盘可达。
- OG 社交卡：原创排版 1200×630 PNG（暗底 + 风筝标题 + 金线 + 绝密档案印章 + 电报码），替换 picsum 占位。
- 页脚加「非官方同人致敬 + 版权归原出品方」声明。
- 三档视口（375/768/1280）× 9 路由 Puppeteer 全量扫版：**27/27 无横向溢出、无空白页、无控制台报错**。

## 六、阶段 5 · 优化后数据

| 指标 | 优化前 | 优化后 |
| --- | --- | --- |
| 首屏 JS gzip | 138 KB | 138 KB（维持达标，<200 KB） |
| echarts chunk | 1,035 KB / 343 KB gzip | 509 KB / ≈170 KB gzip（懒加载） |
| Google Fonts | 阻塞 | 异步 |
| 图片 | 1.48 MB JPEG | 346 KB WebP（-77%） |
| 控制台报错 | 0（基线） | 0（27 项巡检） |
| 构建 | 双模式通过 | 双模式通过（根路径 + /kite-site/ 子路径） |

## 七、评审视角剩余短板（评级上限的最后障碍）

1. **真实剧照/演员写真**：版权素材。README 已提供替换表——用户提供授权素材后，按表替换即可（组件已用姓名徽章兜底，无图也能完整展示）。
2. **手机真机走查**：建议在 iPhone/Android 真机过一遍手势（图谱捏合、时间线横向滚动）。
3. **域名占位**：`sitemap.xml` / `og:image` 中的 `kite.example.com` 需替换为真实域名（一次性操作）。
4. **Lighthouse 线上跑分**：部署后在各平台跑一次真实 Lighthouse，作为最终证据留存。

## 八、可复现命令

```bash
npm install
npm run dev        # 本地开发 http://localhost:5173
npm run build      # 根路径构建（Vercel/Cloudflare）
npm run build:gh   # GitHub Pages 子路径构建
npm run preview    # 预览构建产物
```

`prebuild` 钩子自动执行 `scripts/check-case.cjs`（大小写一致性，防 Linux/Vercel 构建失败）。
