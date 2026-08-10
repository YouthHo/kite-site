# 《风筝》全球领先资料站 · Agent 执行 Prompt（产品经理 Brief · 已对齐真实项目状态）

> 使用说明：本文是**自包含、可直接复制粘贴到任意 Agent 会话执行**的产品经理 Brief。
> 本版本写于 commit `5c46f3a`（2026-08-10 22:18）之后，**已对照仓库真实状态校准**：
> 凡已被提交的优化成果均标记为「已完成 · 勿重做」，Agent 只需推进「真实剩余工作」。
> 目标产物：一个纯静态、却代表国际顶尖设计技术水平的《风筝》(2017 柳云龙谍战剧) 资料站。

---

## 0. 你的角色与任务

你是一名 **Lead 前端架构师 + 创意技术专家（Creative Technologist）**，同时具备产品嗅觉。
任务：在**已具备扎实底座**的现有《风筝》同人/资料站之上，补齐通往「国际顶尖设计奖」的最后几块短板，并打磨到可提交奖项的完成度。
你必须同时做到：底层扎实（架构/资产/性能/无障碍可靠）+ 顶层惊艳（签名交互/叙事/记忆点）。
本 Brief 要求你**在约束内做出专业决策并执行到可运行、可验证**，不要逐行等指令。

---

## 1. 产品定位与北极星（不变）

**定位**：全球领先的《风筝》(2017) 资料站 —— 剧迷心中「最权威、最沉浸、最值得反复打开」的档案库；也是设计/技术圈公认的「中文互联网也能做出国际顶尖叙事型站点」范例。

**北极星**：用户与奖项评审打开的瞬间，3 秒内被气质击中，并记住至少一个签名交互；在「内容专业度 × 设计完成度 × 技术前瞻性」三维同时达国际一线。

**两类用户**：① 剧迷/资料查阅者（找得到、读得爽、关系看得清）；② 设计/技术评审（Awwwards / CSS Design Awards / FWA / Webby / Clio，要被惊艳、被记住）。

---

## 2. 铁律（不可违背的硬约束 · 全部仍然有效）

1. **纯静态（最高优先级）**：禁止任何后端、数据库、服务端运行时、CMS、SSR 动态渲染。所有内容预构建为静态文件；允许客户端路由/搜索/筛选/i18n/Canvas/WebGL。
2. **部署目标不变**：必须可部署到已接好的三平台——GitHub Pages、Vercel、Cloudflare Pages。保留 `.github/workflows/` 三条工作流与 `vite.config.js` 的 `VITE_BASE` 机制（兼容根路径与 `/kite-site/` 子路径）。`npm run build` 与 `npm run build:gh` **都必须成功**，两种模式资源路径零错误。
3. **双主题并存**：深色「胶片」+ 浅色「档案纸」都必须精致可用（`<html data-theme="light">` 切换），新增视觉一律走 CSS 变量，禁止硬编码颜色。
4. **reduced-motion 全程尊重**：新增一切动效必须接入 `src/utils/anim.js` 已封装的降级开关；触屏/低端设备自动降级。
5. **版权零风险**：只使用公版历史照片 + 原创排版/插画/SVG 资产，绝不引入受版权剧照截图。页脚已有「非官方同人/致敬」声明，保持。
6. **性能预算是一等约束**：LCP < 2.5s、TBT < 200ms、CLS < 0.1、首屏 JS(gzip) < 200KB、Lighthouse Performance ≥ 95。当前首屏 JS 已 138KB gzip（达标），echarts 已懒加载不进首屏——**任何改动不得让这些指标回退**。

---

## 3. 当前项目真实状态（写于 commit 5c46f3a 之后 · 已达成事实 · 勿重做）

> 以下均为已提交成果（详见 `docs/case-study.md` 的实测前后对比）。Agent 读到此处应**以这些为基线继续**，而非从零开始。

### 3.1 工程与部署（已完成）
- 构建栈：Vite 5 + Vue 3（`<script setup>`）+ vue-router 4，9 视图路由级懒加载，`manualChunks` 分包缓存。
- 三平台部署工作流已就位（`.github/workflows/deploy-{github-pages,vercel,cloudflare-pages}.yml`）；`vite.config.js` 已支持 `VITE_BASE` 环境变量 + SPA 回退 404 + 数据层 `/images` 前缀重写。
- 双模式构建均通过：`npm run build`（根路径）、`npm run build:gh`（/kite-site/ 子路径），资源路径零错误。
- `prebuild` 钩子跑 `scripts/check-case.cjs`（大小写一致性，防 Linux/Vercel 构建失败）。

### 3.2 性能（已完成 · 真实数据，来自 case-study.md）
| 指标 | 优化前 | 当前 |
| --- | --- | --- |
| 首屏 JS gzip | 138 KB | 138 KB（<200KB 达标） |
| echarts chunk | 1,035 KB / 343 KB gzip | 509 KB / ≈170 KB gzip（**按需引入 + 懒加载，不进首屏**） |
| Google Fonts | 渲染阻塞 | **异步加载**（`media=print onload` + preconnect + noscript 兜底，失败回退系统字体） |
| 真实图片（8 张） | 1.48 MB JPEG | 346 KB WebP（-77%，原图兜底，gh 模式路径已验证） |
| 控制台报错 | 0 | 0（375/768/1280 × 9 路由 = 27/27 Puppeteer 巡检通过） |

### 3.3 签名交互（已完成 · 3 个均已实现并挂载）
1. **自定义光标 + 磁吸**：`src/components/CustomCursor.vue`，双层磁吸（环 0.4s / 点 0.1s 错速拖尾），hover 可交互元素放大并浮现「解密」标签；`gsap.quickTo`，仅 `pointer:fine` 启用。已在 `App.vue` 挂载。
2. **主题化页面切换**：`src/components/PageTransition.vue` 已重写为「金红细线自上而下扫过 + 暗幕 + 内容淡入」（<0.6s），reduced-motion 降级纯淡入。
3. **首页 WebGL/Canvas 质感层**：`src/components/HeroField.vue` 余烬粒子（半分辨率 ≤44 粒子，金/红上飘 + 辉光，隐喻「风筝线」），rAF，移动端/触屏/降级关闭。已在 `HomeView.vue` 挂载。

其他已落地：图谱点击节点 → 面板滑入 → 简介**电报打字机逐字浮现**（`anim.js` typewriter，可取消）；时间线章节大字幕水印 + 金红渐变进度条 + ERA 指示（ScrollTrigger pin）。

### 3.4 视觉系统（已完成）
- 设计令牌：新增 `--gold-highlight` 高光金、三尺度圆角（3/6/10px）、三尺度阴影；`.k-card`/`.gold-line` 统一接入；动效节奏令牌。
- Hero 重构：标题「显影 + 字距收束」（blur + letterSpacing 0.58em→0.42em）、「绝密档案」红印章压印、副标题高光金 + 辉光、金线辉光。
- 对比度修复：`.file-label` 浅色主题 1.08:1 → ≈8:1；勾选标记主题映射色。
- 图谱底层重构：默认干净网络（无关系标签）、悬停浮现、节点径向渐变、名字移出圆圈下方、修复 `[object Object]` bug。

### 3.5 无障碍 / 移动端（已完成 · 部分）
- 图谱容器 `role="application"` + aria-label；侧栏人物列表按钮原生键盘可达。
- OG 社交卡：**原创排版 1200×630 PNG 已生成**（暗底 + 风筝标题 + 金线 + 绝密档案印章 + 电报码），但 `index.html` 的 `og:image`/`twitter:image` **仍指向占位域名**（见 4.2）。
- 三档视口 × 9 路由 27/27 无横向溢出、无空白页、无控制台报错。

### 3.6 资产 / 版权（已完成）
- 8 张真实照片已转 WebP；组件用姓名徽章兜底（无图也能展示）。
- 页脚「非官方同人致敬 + 版权归原出品方」声明已加。

---

## 4. 真实剩余工作（Agent 现在要做的 · 按优先级）

> 这些是 commit 5c46f3a 时**尚未完成**的项。不要碰第 3 节已达成的内容，除非修复 bug。

### P1 · 国际化 i18n（最高优先级 · 当前最大缺口）
- 引入 `vue-i18n`（纯静态 JSON，无后端）。结构：`src/i18n/{index.js, zh.json, en.json}`，字典 key 复用现有中文文案。
- 范围：至少首页 Hero、导航栏、各视图标题/副标题、关键档案卡片、页脚声明、空态/404 语汇有英译；数据层 `src/data/*.json` 中面向用户的展示字段加 `en` 字段或并行英文 JSON（禁止后端）。
- 新增 `ThemeSwitch` 旁的语言切换 UI（双主题同级），`localStorage` 记忆，URL/`html lang` 同步。
- 验收：中↔英切换无空白、无硬编码中文残留、双语构建均通过；英文界面本身就是「全球领先」的竞争力证据。

### P2 · 清除占位域名（一次性 · 需真实域名）
- 将 `public/sitemap.xml` 与 `index.html` 的 `og:image`/`twitter:image`（`https://kite.example.com/...`）替换为**真实部署域名**。
- 真实域名值由用户/环境变量提供；代码侧把域名抽成可在构建期注入的常量（如 `VITE_SITE_URL`），避免再次硬编码占位。
- 验收：`grep -rn "kite.example.com" .` 在源码与产物中零命中。

### P3 · 字体自托管（升级当前的异步 Google Fonts）
- 用 `@fontsource` 或 `fonttools` 子集化自托管 woff2（Noto Serif SC 500/700、Noto Sans SC 400/500、JetBrains Mono 400/500），`<link rel="preload">` + `@font-face` + `font-display: swap`，**彻底移除 `index.html` 的 Google Fonts `<link>`**。
- 目的：完全掌控 LCP、规避国内/海外网络不稳风险，进一步夯实性能预算。
- 验收：Lighthouse 线上跑分 LCP 不回退；无外链字体请求。

### P4 · 引入 TypeScript（推荐 · 可选）
- 评估并渐进引入 `vue-tsc` + `tsconfig`；优先给动效层（`src/motion`、`src/utils/anim.js`）、图谱（`GraphView.vue`）、数据契约（`src/data` schema）加类型。
- 保持双模式构建通过；不破坏现有 `.vue` 运行。
- 验收：`vue-tsc --noEmit` 通过（或至少新增模块有类型覆盖）。

### P5 · 真机走查 + 正式无障碍审计
- 在 iPhone / Android 真机过手势：图谱捏合缩放、时间线横向滚动、自定义光标关闭正确、WebGL 降级生效。
- 跑 axe / Lighthouse a11y，目标 **WCAG 2.1 AA** 正式达标（当前仅 Puppeteer 27/27 巡检，未正式认证）；修正发现的对比度/ARIA/焦点顺序问题。

### P6 · 部署后性能证据
- 三平台（GitHub Pages / Vercel / Cloudflare Pages）各跑一次真实 Lighthouse，留存 LCP/TBT/CLS/Performance 分数，补全 `docs/case-study.md` 的「线上实测」一节。

### P7 · 奖项提交素材（决定能不能拿奖的隐形加分）
- 在 `docs/case-study.md` 基础上产出 **Case study / Making-of 定稿**：概念、视觉系统、3 个签名交互的技术实现、性能前后数据。
- 产出 **3–5 张高质量静帧**（首屏 + 3 个签名交互）+ **30s 演示视频脚本**（首屏 → 自定义光标 → 红线揭幕切换 → 图谱打字机 → 时间线叙事）。
- 产出**提交奖项 checklist**（账号、素材包、视频、截图规格）。

### P8 · 国际评审打磨（可选增强 · 冲更高奖）
- 评估新增 1 个强签名时刻（如首页首屏「风筝线牵引出档案」的进入动画、或关系图谱的势力聚合/解聚动画），保持与「风筝/潜伏/电报」母题绑定。
- 编辑级排版与留白再精修；统一 9 页语汇（绝密档案 / 解密中 / WHO IS KITE · WHO IS SHADOW）。

---

## 5. 验收标准 / Definition of Done（更新）

- [ ] `npm run build` 与 `npm run build:gh` 均成功，两种模式资源路径零错误（维持现状）。
- [ ] 纯静态（无后端/数据库/服务端运行时/CMS）。
- [ ] 双主题正常，reduced-motion 全程降级有效。
- [ ] 性能不回退：首屏 JS(gzip) < 200KB、LCP < 2.5s、TBT < 200ms、CLS < 0.1、Lighthouse Performance ≥ 95。
- [ ] **i18n 英文版上线**（首页/导航/关键档案至少），中英文构建均通过。
- [ ] **占位域名 `kite.example.com` 在源码与产物中零残留**（sitemap + og/twitter 图）。
- [ ] 字体自托管完成，无外链 Google Fonts 请求。
- [ ] 无障碍达 WCAG 2.1 AA（正式审计）；9 视图 375/768/1280 均可用；图谱键盘可达。
- [ ] 提供：优化前后性能对比表（含线上 Lighthouse）+ Case study 定稿 + 静帧 + 演示视频脚本 + 奖项提交 checklist。

---

## 6. 工作方式约定

- 默认**增量提交、可回滚**；不一次性大改。
- 任何会破坏「三平台部署 / 双主题 / 版权零风险 / 性能预算」的改动，**先停下说明**，不要擅自推进。
- 每完成一个 Phase，输出「改动清单 + 验证结果（含 `npm run build`/`build:gh` 与 Lighthouse 数据）+ 下一 Phase 起点」。
- 技术选型在约束内由你专业决定；重大决策（如 i18n 库、是否 TypeScript）动手前用 3 行说明取舍。
- **严禁重做第 3 节已达成项**；若发现其中 bug，先报告再修。

---

## 7. 第一个可执行起点（从这里开始）

1. 进入仓库 `D:\autoclaw\workspaces\kite-site`，先 `git log --oneline -8` 与 `cat docs/case-study.md` 确认当前基线（第 3 节所述均已存在，勿重做）。
2. 从 **P1 i18n** 起步：安装 `vue-i18n`，建 `src/i18n/` 骨架，先把 `HomeView.vue` 与 `NavBar.vue` 文案抽字典并接中英文切换，本地 `npm run dev` 目测，再 `build`+`build:gh` 验证。
3. 并行推进 **P2**：向用户索取真实域名，用 `VITE_SITE_URL` 注入 `sitemap.xml` 与 `index.html` 的 og/twitter 图，跑 `grep -rn "kite.example.com"` 核验零残留。
4. 每阶段结束输出验证结果，再进下一阶段；遇到决策点用简短说明，不要等待。

开始执行。
