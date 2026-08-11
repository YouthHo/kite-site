# 工程层面提升 Prompt —— 将 kite-site 静态站工程分推到 9+

> 本 prompt 仅面向**工程实现**，不涉及任何奖项申报素材（静帧/视频/checklist/跑分等）。目标：把站点工程成熟度从当前约 7.5 分提升到 9 分以上。
> 生效基准：仓库 HEAD = `57ba69f`（feat: Phase2 画布可读性 — 标签避让/分级显隐/清理死代码）。
> 执行前 Agent **必须**先 `git log --oneline -5` 与 `git status` 确认 HEAD 与下列文件一致，禁止凭旧记忆动手。

---

## §0 角色与目标

你是资深前端工程师，负责为一个已上线的 Vue 3 + Vite 纯静态影视资料站（「风筝」专题）做**工程成熟度提升**。
目标：在不破坏现有视觉/交互成果、不破坏三平台部署的前提下，补齐下列工程短板，使代码达到 9+ 工程分（架构清晰、零外部运行时硬依赖、可维护、可验证、零占位配置）。

交付形式：分多个可独立回滚的 commit，每个 Phase 完成即提交，构建双模式（根路径 + `/kite-site/` 子路径）均通过，扫版（27 项）保持通过。

---

## §1 不可违背的铁律（违反即回滚）

1. **纯静态**：禁止引入后端 / 服务端渲染 / 数据库 / 运行时外部 API。所有数据来自 `src/data/*.json` 与 `public/`。
2. **三平台部署不变**：GitHub Pages（子路径 `/kite-site/`）、Vercel、Cloudflare Pages 三条 CI 工作流（`.github/workflows/`）必须保持有效。任何改动不得让任一平台构建失败。
3. **双模式构建保持**：`npm run build`（根路径）与 `npm run build:gh`（子路径，读 `VITE_BASE`）都必须成功，`base` 由 `VITE_BASE` 控制（`vite.config.js:13,56`）。
4. **双主题 + reduced-motion 不变**：`data-theme` dark/light（`src/store/app.js`）、`prefers-reduced-motion` 降级必须保留。
5. **版权零风险**：仅使用公版历史素材与原创资产；节点继续用姓名/印章图形，禁止引入剧照或受版权图片。
6. **性能预算**：首屏不引入新阻塞资源；字体必须本地化；任意 chunk 不得超过预算阈值（见 §5 Phase E）。

---

## §2 当前真实状态（已完成 · 禁止重做）

以下内容**已经存在且工作正常**，Agent 只应在其之上增强，不得重写或删除：

- **自研图谱引擎** `src/graph/GraphEngine.js`(838 行) + `src/graph/useGraphData.js`：d3-force + Canvas2D，已替代 echarts 全量。
- **图谱可读性 Phase2（`57ba69f`）**：节点名标签贪心避让（下/上/右/左 + 8 方向斜位候选 + 金色引线兜底）、标签分级显隐（`ui<0.5` 仅印章/核心、`ui<0.78` 中权重、`ui>=1.05` 全部）、已清理平移死代码。
- **图谱说明与辅助组件**（已存在，勿删）：`GraphOnboarding.vue`、`GraphHelpPanel.vue`、`GraphStatusBar.vue`、`GraphToolbar.vue`。
- **图谱交互**（已存在）：聚焦隔离、解密模式（进度徽章 0/30 + 秘密 0/12）、悬停电报条、洞察面板、mini-map、解密档案巡览（10 幕）、aria-live 播报、双指触屏手势。
- **视图层模式枚举** `GraphView.vue:26`：`const mode = ref('browse') // browse | decrypt | path | tour（任一时刻唯一）`。
- **三平台 CI + 双模式构建 + 27 项扫版**：已通过。
- **设计系统**：`src/styles/main.scss` 令牌、`src/styles/theme-light.css`（由 `scripts/gen_theme_css.py` 生成，勿手改）、`CustomCursor.vue`、`PageTransition.vue`、`HeroField.vue`。

---

## §3 真实工程缺口（按优先级，必须关闭）

### A. 占位域名 `kite.example.com`（高优先 · 上线即错）
- `index.html:31` `og:image` 与 `:35` `twitter:image` 指向 `https://kite.example.com/og-cover.png`。
- `public/sitemap.xml` 根域名与所有 `<loc>` 均为 `https://kite.example.com/`。
- 要求：
  - 新增构建期环境变量 `VITE_SITE_URL`（默认 `https://youthho.github.io/kite-site`）。
  - `index.html` 中把硬编码域名改为占位符（如 `__SITE_URL__`），在 `vite.config.js` 用 `transformIndexHtml` 钩子在构建期替换为 `process.env.VITE_SITE_URL || 'https://youthho.github.io/kite-site'`（注意 GitHub Pages 子路径下 OG 绝对地址仍用根域，不要拼 `/kite-site/`）。
  - `public/sitemap.xml` 的域名同样由构建脚本（`scripts/build-gh.cjs` 或新增 `scripts/gen-sitemap.cjs`）注入，不写死。
  - `public/robots.txt:3` 的 `Sitemap: https://kite.example.com/sitemap.xml` 同样替换为注入后的正确地址（与 sitemap 同源）。
  - 完成后 `grep -r "kite.example.com" . --include=*.html --include=*.xml --include=*.txt src public dist` 必须零命中。

### B. 字体未自托管（高优先 · 外部硬依赖 + 弱网白屏风险）
- `index.html:38,42,47` 仍 `preconnect` + 请求 `fonts.googleapis.com`（Noto Serif SC / Noto Sans SC / JetBrains Mono）。
- 要求：
  - 移除 `index.html` 对 `fonts.googleapis.com` 的全部引用（含 `<noscript>` 兜底）。
  - 自托管：用 `@fontsource/...` 包（推荐 `@fontsource/noto-serif-sc`、`@fontsource/noto-sans-sc`、`@fontsource/jetbrains-mono`）并在 `main.js`/SCSS 中 `import`，或把 woff2 下载到 `public/fonts/` 本地引用。**CJK 字体体积大**，必须只引必要字重（500/700 serif、400/500 sans、400/500 mono），启用 `font-display: swap`，对关键字体加 `<link rel="preload">`。
  - 验证：构建后 `grep -r "fonts.googleapis" dist` 零命中；首屏无外部字体请求。

### C. i18n 英文版缺失（高优先 · 多语言能力缺失）
- 当前全站中文硬编码，无 `src/i18n`。
- 要求：
  - 引入 `vue-i18n@^9`（兼容 Vue 3），新建 `src/i18n/index.js` + `src/i18n/zh.js` + `src/i18n/en.js`。
  - 在 `main.js` 挂载 `i18n`；在 `src/store/app.js` 增加 `locale` 状态（持久化 `kite-locale`，默认 `zh`），导出 `setLocale()`。
  - **路由保持不变**（不引入 `/en` 前缀），避免破坏三平台部署与现有 SEO；语言切换通过 NavBar 下拉 + `locale` 状态驱动。
  - 抽取所有面向用户的字符串（导航、图谱工具条/状态条/help/onboarding、档案卡、按钮、提示）到语言包；JSON 数据中的人物/剧情文本可保留中文原文并附英文译文字段（在 `relationships.json`/`characters.json` 加 `nameEn`/`descEn` 等），由组件按 locale 选择。
  - 完成后 `npm run build` 与 `npm run build:gh` 均通过，切换语言后全站文案（含图谱 UI）即时切换、无遗漏硬编码中文。

### D. 图谱交互状态机未完全收敛（中高优先 · bug 温床）
- 现状：视图层 `GraphView.vue:26` 有 `mode` 枚举，但 `GraphView.vue:29,32` 的 `focusClickId` 与 `layoutMode` 是**正交维度**；引擎层 `GraphEngine.js:30-32` 仍用平行 flag `focusClick`/`decryptMode`/`decrypted`，`setDecrypt`(`:151`)、`focusClick` 赋值(`:160`) 彼此独立。
- 隐患：5 个交互维度可任意叠加，进入某模式未自动清理其他状态（即用户此前反馈的"逻辑乱"根因未从架构根除）。
- 要求（**只收敛、不删功能**）：
  - 在引擎或新增 `src/graph/useGraphState.js` 定义**单一交互状态对象**：
    `{ mode: 'browse'|'decrypt'|'path'|'tour', focusId: string|null, layout: 'none'|'force'|'manual' }`。
  - 所有切换走唯一 `setState(patch)` 函数，内部强制不变量：进入 `decrypt`/`path`/`tour` 时 `focusId=null`；`tour` 优先级最高（覆盖其余）；`esc` 统一回到 `{ mode:'browse', focusId:null }`；`layout` 与 `mode` 解耦但互不冲突。
  - `GraphView.vue` 与 `GraphEngine.js` 均改为读写该单一状态，删除 `mode`/`focusClickId`/`layoutMode` 三处散落 ref 的平行逻辑。
  - 顺带消歧：当前"解密档案巡览(tour)"与"解密模式(decrypt)"同词两义，把 tour 的 UI 文案改为"档案导览/秘密巡览"，与"解密模式（红章遮蔽）"明确区分。
  - 验收：27 项扫版通过；人工走查——任意模式互相切换、Esc 退出均干净无残留高亮/灰化/遮罩。

### E. 构建产物体积门禁缺失（中优先 · 工程纪律）
- `vite.config.js:72` `chunkSizeWarningLimit: 1500`（1.5MB 才告警，过于宽松）；无超阈值 fail 机制；vendor 未显式分包。
- 要求：
  - 在 `vite.config.js` `build.rollupOptions.output.manualChunks` 显式拆分：`vue`/`vue-router`、`gsap`、`graph`（引擎 + d3）为独立 chunk。
  - 收紧 `chunkSizeWarningLimit` 至 `400`。
  - 新增 `scripts/check-size.cjs`：解析 `dist/` 下各 chunk 体积，任一 > 阈值（如 400KB）则 `process.exit(1)`；接入 `prebuild`（与现有 `scripts/check-case.cjs` 并列）或新增 `npm run build:check`。
  - 验证：正常构建通过；人为制造超大 chunk 时该脚本能 fail。

### F. 依赖审计（低优先 · 整洁度，**禁止误删在用依赖**）
- **重要纠正**：`echarts` 仍被 `src/views/TimelineView.vue:6-10,160` 按需使用（`import * as echarts from 'echarts/core'` + `echarts.use([...])`），且 `vite.config.js` 的 `manualChunks.echarts` 依赖它——**绝对禁止移除**。
- `lucide-vue-next` 被 10+ 组件使用（NavBar / GraphToolbar / SearchModal / GraphHelpPanel 等）——**绝对禁止移除**。
- 本 Phase 仅做审计：列出 `package.json` 的 dependencies/devDependencies，逐一 `grep -rn "<pkg>" src` 确认是否被引用；**只有确认完全零引用的依赖才可移除**，且移除后必须双模式构建通过。当前已知 echarts 与 lucide-vue-next 均在使用中，本 Phase 大概率无实际删除动作——重点是"确认无冗余"，而非"强行删"。

---

## §4 执行路线（每个 Phase 独立 commit，可回滚）

- **Phase A（占位域名）**：改 `index.html` 占位符 + `vite.config.js` transformIndexHtml + `sitemap.xml` 生成脚本；commit `fix(site): 移除 kite.example.com 占位，改为 VITE_SITE_URL 注入`。
- **Phase B（字体自托管）**：移除 Google Fonts、本地化、preload；commit `perf(assets): 字体自托管，消除外部字体请求`。
- **Phase C（i18n）**：装 vue-i18n、建语言包、store 加 locale、NavBar 切换、抽取文案；commit `feat(i18n): 英文版 + 语言切换（路由不变）`。
- **Phase D（状态机收敛）**：`useGraphState.js` + 单一 `setState` + 视图/引擎改造 + 文案消歧；commit `refactor(graph): 统一交互状态机，强制不变量`。
- **Phase E（体积门禁）**：manualChunks + 收紧阈值 + `scripts/check-size.cjs`；commit `build(perf): 分包 + 构建体积门禁`。
- **Phase F（死依赖）**：核查并移除未用依赖；commit `chore(deps): 清理未使用依赖`。

---

## §5 总体验收（DoD，全部满足方算 9+）

1. `grep -r "kite.example.com" . --include=*.html --include=*.xml --include=*.txt src public dist` 零命中；`VITE_SITE_URL` 可覆盖；OG/Twitter 图为正确绝对地址；`robots.txt` 的 Sitemap 指向正确。
2. 构建产物中无 `fonts.googleapis.com` 请求；字体本地化且 `font-display: swap` + 关键字体 preload。
3. 英文版完整：导航/图谱 UI/档案文案切换无遗漏；语言选择持久化；路由未变。
4. 图谱交互由单一 `setState` 驱动，任意模式切换 + Esc 干净无残留；"解密模式"与"档案导览"文案不混。
5. `manualChunks` 生效；`chunkSizeWarningLimit≤400`；`scripts/check-size.cjs` 能拦超阈；`npm run build` 与 `npm run build:gh` 均过。
6. 无未使用依赖；`npm run build` 与 `npm run build:gh` 双模式通过；27 项扫版通过。
7. 三平台 CI（GitHub Pages/Vercel/Cloudflare）任一配置下构建仍绿。

---

## §6 起点命令（Agent 开干第一句）

```bash
cd "D:/autoclaw/workspaces/kite-site"
git log --oneline -5          # 确认 HEAD = 57ba69f
git status --short            # 确认工作区干净
# 从 Phase A 开始：先处理占位域名
```

---

## §7 明确禁止（防止 Agent 犯错）

- **禁止**为"奖项/申报"做任何事（静帧图、申报视频、checklist、外部跑分报告等）——本任务纯工程。
- **禁止**推倒重写 `GraphEngine.js` / `GraphView.vue` / 设计系统 / 三平台 CI；只在现有成果上增强。
- **禁止**引入后端、SSR、运行时外部 API、付费 CDN。
- **禁止**改变路由结构（勿加 `/en` 前缀），以免破坏三平台部署与 SEO。
- **禁止**删除 `GraphOnboarding.vue` / `GraphHelpPanel.vue` / `GraphStatusBar.vue` / `GraphToolbar.vue` 等已存在组件。
- 每次改动后必须跑 `npm run build` 与 `npm run build:gh` 双模式验证，且保持 27 项扫版通过。
