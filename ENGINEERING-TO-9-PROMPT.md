# 《风筝》资料站 · 工程层面提升到 9+ 分 · Agent 执行 Prompt

> 本文件是**自包含**的任务指令。新开一个 Agent 会话，把本文件全文粘贴给它即可执行。
> 范围严格限定在**工程层面**（代码、架构、构建、部署、性能、交互逻辑、健壮性）。
> **严禁**引入任何奖项申报素材类内容（静帧图、申报视频脚本、checklist、跑分报告等）——这些不在本任务内，也不得出现在交付物中。

---

## §0 角色与上下文

你是一名**资深前端工程师**，接手一个已上线的纯静态影视资料站（Vue 3 + Vite 5）。
站点主题是 2017 年谍战剧《风筝》，以"电影感档案"为视觉语言，核心是关系图谱。
当前工程评分约 **7.5/10**（架构、三平台部署、自研图谱引擎已强；但缺 i18n、字体未自托管、占位域名未清、构建无体积门禁）。
你的目标是把**工程完成度**推到 **9+**，不引入任何非工程负担。

项目根目录：`D:\autoclaw\workspaces\kite-site`（在 Agent 环境中可能是 `/workspace` 或对应挂载路径，先用 `git log --oneline -3` 与 `git status` 确认 HEAD 与是否干净）。

---

## §1 北极星（工程）

> 一个**纯静态、可离线、零外部运行时依赖、三平台一键部署、结构支持多语言、构建可度量**的高完成度前端工程。

验收以**工程指标**为准：首屏 JS 体积预算、零外部字体请求、i18n 覆盖率、构建产物确定性、三平台部署不破、既有交互零回归。

---

## §2 铁律（不可违背）

1. **纯静态**：不引入任何服务端/SSR/后端；不新增需要服务器运行的依赖。
2. **三平台部署不变**：`.github/workflows/*.yml` 的三条 CI（GitHub Pages / Vercel / Cloudflare Pages）必须保持可用；`vite.config.js` 的 `base` 多路径逻辑（`VITE_BASE`）不受影响。
3. **双主题 + reduced-motion 不变**：`dark`/`light` 主题、`prefers-reduced-motion` 降级必须保留且不被破坏。
4. **版权零风险**：不引入任何剧照/受版权图；仅用公版历史图与原创资产（封条/印章/胶片为原创 SVG/Canvas）。
5. **性能预算**：首屏（entry）JS 控制在合理预算内；新增依赖不得显著推高首屏；CJK 字体自托管必须做体积控制。
6. **不破坏已完成的图谱引擎**：`src/graph/GraphEngine.js`、`src/graph/useGraphData.js`、`src/views/GraphView.vue` 的现有能力（力导向、相机飞行、聚焦隔离、解密巡览、mini-map、洞察面板、aria-live）必须保留且无回归。
7. **本任务纯工程**：**不得**生成静帧图、申报视频、checklist、Lighthouse 跑分报告等任何奖项申报素材；也不得在代码/文档里预留这类钩子。

---

## §3 当前项目真实状态（已核实，HEAD `58f2396`）

> 以下为**已完成**项，Agent 必须复用、不得推倒重做或误删。

### 3.1 已完成（勿重做）
- **自研 Canvas2D 图谱引擎** `src/graph/GraphEngine.js`(838 行) + `src/graph/useGraphData.js`：无限平移、光标缩放、DPR、命中测试、相机缓动 `fit/centerOn`、自研力导向、主题令牌重绘、reduced-motion 静态、`useGraphData` 统一数据访问 + 介数中心性预计算。
- **图谱交互与叙事**（Layer3–5）：点击聚焦隔离、解密模式（进度徽章/秘密线索）、悬停电报条、洞察面板、mini-map、双指捏合触屏、解密档案巡览（10 幕）、aria-live 播报、`graphonboarding.vue` + `graphhelppanel.vue` + 图例。
- **图谱主模式已收敛为单一枚举**：`src/views/GraphView.vue:26` `const mode = ref('browse') // browse | decrypt | path | tour（任一时刻唯一）`。`layoutMode`(`GraphView.vue:32`) 与 `focusClickId`(`GraphView.vue:29`) 为正交状态（布局/隔离），属合理设计。
- **三平台 CI** `.github/workflows/`：三条工作流，Vercel/Cloudflare 带 guard 优雅跳过；`vite.config.js` 支持 `VITE_BASE` 多路径。
- **双模式构建**：`npm run build`（根路径）/`npm run build:gh`（子路径 `scripts/build-gh.cjs`，自动生成 `404.html` 供 Pages SPA 回退）。
- **echarts 仍在使用**：仅 `src/views/TimelineView.vue:6-10`（时间轴柱状图），`vite.config.js:76-80` 的 `manualChunks.echarts` 分包**有效，不得删除**。
- **无障碍**：reduced-motion、`aria-live`、27 项 Puppeteer 扫版通过。
- **全局状态** `src/store/app.js`：主题（localStorage 持久化 + `<html data-theme>`）、观剧进度（防剧透解锁）。

### 3.2 真实剩余工程工作（本任务范围）
| # | 工作 | 当前证据 | 优先级 |
|---|---|---|---|
| A | **i18n 英文版**（vue-i18n 静态） | 无 `src/i18n/`；全站 UI 文案硬编码中文 | P0 |
| B | **字体自托管** | `index.html:38-47` 仍走 Google Fonts（Noto Serif/Sans SC + JetBrains Mono），异步但外部依赖 | P0 |
| C | **清除占位域名** `kite.example.com` | `index.html:31,35`（og/twitter）、`public/sitemap.xml`（全）、`public/robots.txt:3` | P1 |
| D | **构建纪律** | `vite.config.js:72` `chunkSizeWarningLimit:1500`（实为隐藏警告，无真实门禁）；无 bundle 报告；无 TS | P1 |
| E | **图谱模式切换收尾** | `mode` 枚举已统一，但需确认 `focusClickId`/`layoutMode` 在模式切换时的清理与 Esc 单一出口 | P2 |
| F | **健壮性** | i18n 缺 fallbackLocale 处理；无 `VITE_SITE_URL` 注入机制；构建清空 `dist` 在受限环境依赖手动处理 | P2 |

---

## §4 各工作执行细则（含确切文件与落地方式）

### A. i18n 英文版（vue-i18n，纯静态）
- **依赖**：`npm i vue-i18n`（确认与 Vue 3 兼容版本）。
- **接入**：新建 `src/i18n/index.js`：
  ```js
  import { createI18n } from 'vue-i18n'
  import zh from './zh.json'; import en from './en.json'
  export default createI18n({
    legacy: false,                // 用 Composition API 的 $t / useI18n
    locale: localStorage.getItem('kite-locale') || 'zh',
    fallbackLocale: 'zh',
    messages: { zh, en },
  })
  ```
  在 `src/main.js` 注册 `app.use(i18n)`。
- **提取策略**：
  1. 用 `grep -rnE "[\x{4e00}-\x{9fff}]" src --include=*.vue --include=*.js` 盘点所有中文 UI 串（**排除** `src/graph/` 里的数据驱动文案与角色姓名/阵营名等专有名词——这些属内容，保持原样；**仅**提取按钮、提示、帮助面板、onboarding、统计文案、tooltip、档案件说明等界面文本）。
  2. `src/i18n/zh.json` 以当前中文为源（key 用语义化英文，如 `graph.focusHint`、`help.title`），`en.json` 提供英文翻译。
  3. 模板中用 `$t('key')`；`<script setup>` 中用 `const { t } = useI18n()` 后 `t('key')`。
- **切换 UI**：在 `src/components/NavBar.vue`（已有主题切换）旁增加语言切换（中/EN），写入 `localStorage('kite-locale')`，切词即换无需刷新。
- **约束**：i18n 不得破坏 `VITE_BASE` 多路径部署；`graphonboarding`/`graphhelppanel`/统计文案/档案件说明必须全部走 `$t`。
- **DoD**：`src/i18n/` 存在且 `zh`/`en` 完整；模板中无应翻译却硬编码的中文（专名除外）；切换语言全站即时生效；`npm run build` 双模式均通过；27/27 扫版仍过。

### B. 字体自托管
- **方式**：用 `@fontsource` 系列（按 weights 引入，控制体积）：
  - `@fontsource/noto-serif-sc` 引 500/700；`@fontsource/noto-sans-sc` 引 400/500；`@fontsource/jetbrains-mono` 引 400/500。
  - 在 `src/main.js` 或 `src/styles/main.scss` 顶层 `@import` 对应 css（fontsource 默认 `font-display: swap`）。
- **首屏优化**：仅 above-the-fold 的 Serif/Sans 关键字重参与首屏；`JetBrains Mono`（电报打字机）可标记为 `media="print" onload` 或动态 import 延迟加载。
- **去外部依赖**：删除 `index.html:38-47` 的 Google Fonts `<link>` 与 `preconnect`（连同 `<noscript>` 兜底里那份）。
- **CJK 体积控制**：fontsource 的 SC 字体会拆多文件 + `unicode-range`；确保只加载用到的字重；在 `vite.config.js` 里确认字体走 asset 而非被误判。
- **DoD**：构建后 `dist/` 内字体同源；`grep -r "fonts.googleapis\|fonts.gstatic" dist` 命中为 0；首屏字体开销在预算内；视觉与现状一致（字号/字重/行高无回退变化）。

### C. 占位域名 → 环境驱动（工程化消除硬编码）
- **机制**：新增 `.env` 与 `.env.example`，定义 `VITE_SITE_URL=https://youthho.github.io/kite-site`（默认值指向 GitHub Pages；Vercel/Cloudflare 部署时在对应平台环境变量覆盖）。
- **注入**（`index.html` 的 og/twitter）：用 Vite 内置 `import.meta.env.VITE_SITE_URL`，在 `src/main.js` 或一个小 Vite 插件于构建期把 `index.html` 里的占位替换为真实值；推荐写一个轻量插件 `scripts/inject-meta.cjs`（或复用 `vite.config.js` 现有插件数组）替换 `kite.example.com`。
- **sitemap.xml / robots.txt**（静态文件，不能用运行时 env）：新增 `scripts/gen-meta.cjs` 预构建脚本（在 `prebuild`/`build` 前执行），读取 `VITE_SITE_URL` 生成 `public/sitemap.xml` 与 `public/robots.txt`，替换所有 `kite.example.com`。
- **DoD**：`grep -rn "kite.example.com" dist public src index.html` 命中为 0；`og:image`/`twitter:image`/`sitemap`/`robots` 均指向 `VITE_SITE_URL` 真实值；三平台部署下值正确。

### D. 构建纪律（可度量）
- **bundle 报告**：`npm i -D rollup-plugin-visualizer`，新增脚本 `build:report`（如 `vite build --mode report` 或加 `--report`），生成 `stats.html` 供体积审查。
- **真实体积门禁**：将 `vite.config.js:72` 的 `chunkSizeWarningLimit:1500` 改为有意义的阈值（如 `500`），并在 `package.json` 加 `size-limit` 配置（`@size-limit/preset-app` 或 `@size-limit/file`）约束 entry 首屏体积；超出则 `npm run size` 失败。
- **TS（可选，低优先级）**：**默认不做全量迁移**（对成熟站点风险高、边际收益有限）。若做，仅对 `src/graph/` 公共 API 加 `// @ts-check` + JSDoc 类型，或加 `jsconfig.json` 路径别名；**不得因 TS 引入导致既有功能回归**。
- **DoD**：`npm run build:report` 产出报告；首屏 JS 在预算内；`chunkSizeWarningLimit` 为真实阈值；echarts 仍在独立 chunk 且**不进入首屏 entry**（确认 TimelineView 的 echarts 为按需/Lazy，不阻塞首屏）。

### E. 图谱模式切换收尾
- `mode` 枚举已统一，补一个**单一出口 `setMode(m)`**：进入新主模式前清理上一模式的副作用（如离开 `tour` 时 `focusClickId=null`、`tourIdx=0`；离开 `decrypt` 时恢复灰化等）。
- 确认 **Esc 永远是回到 `browse` 的单一路径**；`focusClickId`/`layoutMode` 与 `mode` 并存时行为可预期、无泄漏。
- **DoD**：任意模式组合切换无残留视觉/状态；27/27 扫版仍过；无新增 console 报错。

### F. 健壮性
- i18n 缺失 key 时 `fallbackLocale:'zh'` 兜底，不崩。
- `VITE_SITE_URL` 缺省时有合理默认，不报构建错。
- 确认三平台构建在改动后均绿（可本地用 `npm run build` + `npm run build:gh` 验证；Vercel/Cloudflare 的 CI guard 不被破坏）。
- **DoD**：异常路径不崩；构建与部署链路不变绿。

---

## §5 分阶段执行路线（每阶段独立 commit、可回滚）

- **Phase 0 — 基线对齐**：`git log` + 读 `GraphView.vue`/`GraphEngine.js`/`useGraphData.js`/`store/app.js`/`vite.config.js`/`index.html`/`TimelineView.vue`；确认 §3 状态；列出所有待翻译中文 UI 串清单（落 `src/i18n/INVENTORY.md` 仅内部参考，不交付用户）。
- **Phase A — i18n（P0）**：装 vue-i18n → `src/i18n/index.js` + `zh.json`/`en.json` → 改造 NavBar 语言切换 → 全站 `$t` 化 → 验证双模式构建 + 27/27。commit `feat(i18n): 引入 vue-i18n 中英双语`。
- **Phase B — 字体自托管（P0）**：装 @fontsource → 引入并删除 Google Fonts 链接 → Mono 延迟 → 验证零外部字体请求。commit `perf(fonts): 自托管字体，移除 Google Fonts 外部依赖`。
- **Phase C — 域名环境化（P1）**：`.env` + `inject-meta.cjs` + `gen-meta.cjs` → 替换 sitemap/robots/og。commit `fix(meta): 以 VITE_SITE_URL 驱动 sitemap/robots/OG，清除占位域名`。
- **Phase D — 构建纪律（P1）**：visualizer + size-limit + 真实 `chunkSizeWarningLimit` +（可选）graph JSDoc。commit `build: 引入 bundle 报告与体积门禁`。
- **Phase E — 图谱切换收尾（P2）**：`setMode` 单一出口 + Esc 校验。commit `refactor(graph): 统一模式切换出口与副作用清理`。
- **Phase F — 健壮性（P2）**：fallbackLocale、env 缺省、三平台绿。commit `chore: 健壮性与部署链路校验`。

每阶段结束后跑：`npm run build` 与 `npm run build:gh` 必须成功；涉及交互的改动需确认 27/27 扫版不破。

---

## §6 验收标准（工程指标）

| 指标 | 目标 |
|---|---|
| i18n 覆盖 | 全部界面 UI 串外部化；`en.json` 完整；专名除外 |
| 外部字体请求 | `dist` 中 `fonts.googleapis/gstatic` 命中 = 0 |
| 占位域名 | 全仓 `kite.example.com` 命中 = 0 |
| 首屏 JS | 在 `size-limit` 预算内；echarts 不进 entry |
| 三平台部署 | CI 三条工作流不受影响，双模式构建均绿 |
| 图谱零回归 | 现有全部交互可用；27/27 扫版仍过；无 console 报错 |
| reduced-motion / 双主题 | 不被破坏 |
| 版权 | 无新增受版权资产 |

---

## §7 起点命令（Agent 接手第一步）

```bash
cd <项目根>
git log --oneline -3
git status --short
# 确认 HEAD 为 58f2396 附近、工作区干净，然后从 Phase 0 开始
```

---

## §8 明确「不要做」清单（防止 Agent 走偏）

- ❌ 不生成/预留任何奖项申报素材（静帧、视频、checklist、跑分报告）。
- ❌ 不重写 `GraphEngine.js` / `useGraphData.js` / 图谱交互（已完成，仅做 §E 收尾）。
- ❌ 不删除 `vite.config.js` 的 `echarts` 分包（TimelineView 仍用）。
- ❌ 不破坏 `VITE_BASE` 多路径与三条 CI。
- ❌ 不做全量 TypeScript 迁移（除非低风险的 graph JSDoc，且零回归）。
- ❌ 不引入受版权图片/剧照。
- ❌ 不改动纯视觉设计语言（封条/印章/胶片/双主题令牌保持）。
