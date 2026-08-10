# 《风筝》专题站 · 冲奖级全面优化方案 与 Agent 执行 Prompt

> 目标：把现有站点从「完成度很高的同人站」提升到「能拿 Awwwards / CSS Design Awards / FWA / Webby 级别奖项的作品」。
> 文档分三部分：① 现状诊断（已经很强，但差在哪）② 优化蓝图（按维度）③ **可直接粘贴给 Agent 执行的完整 Prompt**。

---

## 一、现状诊断：已经很强，但距离「顶尖奖」差在哪

### 1.1 已经做对的（这些是护城河，优化时一律保留，不要动）

- **统一且高级的视觉语言**：暗色电影感 + 谍战「绝密档案」母题。胶片颗粒（`FilmGrain`）、扫描线（`ScanLine`）、红印章（`SealStamp`）、电报码装饰、金/血红/青绿三色阵营体系，全部贯穿到设计令牌（`src/styles/main.scss` 的 `:root` 变量）。
- **真正的双主题**：深色「胶片」/ 浅色「档案纸」，且浅色用 `data-theme='light'` 全量重映射，不是简单反色。
- **成体系的动效基建**：`src/utils/anim.js` 已经封装了 `pageEnter / revealUp / imageReveal / typewriter / parallax / titleSweep`，并统一尊重 `prefers-reduced-motion`。
- **一个有交互深度的关系图谱**：`src/views/GraphView.vue` 用 ECharts 做了搜索、阵营筛选、排序、点击弹出档案、原生 roam + 空白拖拽，视觉也按「顶级网络图」标准处理（默认干净、悬停浮现关系）。
- **加载屏、页面切换、滚动揭示、打字机**都已经就位，且有 6 秒安全阀防卡死。
- **导航、移动端抽屉、搜索、主题切换、回到顶部**组件齐全。
- **已具备三平台自动部署**（我们刚接好的 GitHub Actions + Vercel + Cloudflare Pages）。

### 1.2 顶尖设计奖到底看什么（评委视角）

Awwwards（SOTD / SOTM / Honorable Mention）、CSS Design Awards、FWA、Webby、Clio 的评审共性维度：
**Design（视觉）、Usability/UX、Creativity/Concept（创意与概念）、Content、Mobile、技术执行**。

最关键的一条现实：**评审在 1–2 分钟内决定是否进短名单**。决定成败的只有两件事——
1. **头 3 秒的第一印象**（首屏是否立即传达「这是什么体验、质感如何」）；
2. **一个让人记住的 Signature Moment**（签名式交互/视觉，评委事后能回想起来的那一下）。

你的站「视觉与质感」已经达标，但目前**缺少一个签名式记忆点**，且**性能是第一道隐形门槛**。

### 1.3 与「顶尖」之间的差距（按杠杆从大到小排序）

| 排名 | 差距 | 影响 | 现状证据 |
|---|---|---|---|
| 1 | **缺少 Signature Moment（记忆点）** | 评审记不住 → 难进短名单 | 首页是「索引网格」，动效是常规的淡入上移，无自定义光标、无 WebGL 质感层、无与「风筝/潜伏」强绑定的签名交互 |
| 2 | **性能门槛未过** | 直接被刷掉/体验掉帧 | `src/views/GraphView.vue` 用 `import * as echarts`（全量 ~1MB）；`index.html` 阻塞式 Google Fonts `<link>`（无 preload、无自托管，且在中国可能被墙导致 FOUT/白屏） |
| 3 | **交互层级停在「好」没到「惊艳」** | 差口气 | 无自定义光标/磁吸；页面切换是 `opacity+y:16` 平庸过渡；无 WebGL/Canvas 粒子；滚动编排偏基础 |
| 4 | **概念叙事不够「锋利」** | 头 3 秒没讲清体验 | 首页 Hero 是网格索引，没用一句话/一个动作立住「半生潜伏、信仰至上」的情绪钩子 |
| 5 | **细节闭环有缺口** | 显得「未完工」 | OG 图是 `picsum.photos` 占位（`index.html` 第 31 行）；`public/sitemap.xml` 还是 `kite.example.com`；图片无 AVIF/WebP、无懒加载、无 `srcset` |
| 6 | **可访问性 / 移动端一致性** | 评委/残障用户扣分项 | 已尊重 reduced-motion（好）；但图谱无键盘导航、金色文字 `#b8860b` 在深底对比度偏低、移动端图谱体验待优化 |
| 7 | **版权风险** | 公开参赛的隐患 | 粉丝站用了受版权剧照有风险；当前策略正确（演员肖像 + 公版历史照片），必须**继续保持**，不要混入剧照截图 |

---

## 二、优化蓝图（按维度给出具体落点）

### 维度 A · 概念与叙事（先定调，再动手）
- 给站点一条**清晰的「故事主轴」**：把散落的 9 个页面串成「一次解密行动」——首页 = 任务简报，图谱 = 锁定目标，角色/演员/分集/时间线/势力/历史/名场面 = 逐份档案。导航与文案统一用「绝密档案 / 解密中」语汇（现在已有雏形，需强化一致性）。
- 首页 Hero 必须在 **3 秒内**用一句主文案 + 一个动作立住情绪：「信仰至上，半生潜伏」已是好 slogan，但当前被埋在网格下面，应放到视觉重心。

### 维度 B · 视觉系统（在现有令牌上精修，不要推翻）
- 引入**更克制的留白节奏**与**更大的字号对比**（编辑感排版）：标题用 display 级字号 + 紧字距，正文行高 1.8+。
- 增加**一套「高光金」**用于关键强调，减少血红滥用（血红只留给「机密/危险」语义）。
- 统一圆角、描边、阴影三套尺度（已在 `k-card` 里有，扩展到按钮/输入/标签）。
- 设计一套**自定义 SVG favicon 动态态**（已有静态 `favicon.svg`，可加 hover/loading 态）。

### 维度 C · 动效与交互（最大杠杆，重点投入）
**必做 3 个签名式交互（Signature Package）：**
1. **自定义光标 + 磁吸**：圆形光标（带「解密中」态），按钮/链接 hover 时磁吸吸附（参考 Awwwards 主流做法）。新增 `src/components/CustomCursor.vue`，用 `gsap.quickTo` 做跟随，尊重 `pointer: fine` 与 reduced-motion。
2. **主题契合的页面切换**：用「红线/幕布 wipe」或「档案封条撕开」替代当前淡入（`src/components/PageTransition.vue`）。建议：离开页时一道血红细线横向扫过，进入页时内容从遮罩后揭开。
3. **WebGL / Canvas 质感层**：首页 Hero 背后加一层**轻量粒子/纸屑/引线**动效（Three.js 或原生 Canvas，严格控制性能预算，移动端降级为静态）。这是「风筝/潜伏」母题的视觉锚点，最容易成为记忆点。

**进阶编排（加分项）：**
- 时间线视图（`TimelineView.vue`）改为**横向滚动 + 钉住（pinned）叙事**，章节随滚动推进。
- 关系图谱节点 hover 时，关系标签用**打字机式逐字浮现**（呼应电报母题，已有 hover 显现可升级）。
- 首屏标题用 `titleSweep`（已有）升级为**遮罩扫过 + 字距收束**的「显影」效果。
- 滚动驱动 Hero 背景的「红线牵引」（一条细红线随滚动沿页面绘制，隐喻风筝线）。

### 维度 D · 性能工程（门槛，必须先过）
- **ECharts 按需引入**：把 `import * as echarts` 改为 `echarts/core` + `GraphChart` + `CanvasRenderer`（其余组件按需），预计把图谱包从 ~1MB 降到 ~250–350KB。并确保 `/graph` 路由级懒加载，首屏不加载。
- **字体自托管**：移除 `index.html` 的 Google Fonts `<link>`，改用自托管子集化 woff2（Noto Serif SC / Noto Sans SC / JetBrains Mono 的常用字重）+ `<link rel="preload">` + `font-display: swap`。推荐 `@fontsource` 或 `fonttools` 子集化，顺带解决中国访问稳定性。
- **图片优化**：`public/images` 的 11 张图转 AVIF/WebP（保留 jpg 兜底），加 `loading="lazy"`、`decoding="async"`、`<picture>` + `srcset`；Hero 大图用 blurhash/低清占位先铺底。
- **打包体检**：`npm run build` 后查 `dist/assets` 各 chunk 体积；设置性能预算（LCP < 2.5s、TBT < 200ms、CLS < 0.1）。

### 维度 E · 可访问性
- 保留并强化 reduced-motion 路径。
- 关系图谱增加**键盘可达**：方向键/ Tab 在节点间移动、Enter 打开档案面板、Esc 关闭；给画布加 `role="application"` 与说明。
- 修正对比度：金色 `#b8860b` 在深底用于正文时降到辅助层级，关键信息用纸色 `#e8dcc8` 或血红（提高对比）。
- 所有图标按钮补 `aria-label`（当前大部分有，过一遍）。

### 维度 F · 内容与版权
- **替换 OG 图**：用 ImageGen/设计工具生成一张定制的 1200×630 社交卡片（风筝 + 绝密档案视觉），写入 `index.html` 的 `og:image` 与 `twitter:image`。
- 修正 `public/sitemap.xml` 的 `kite.example.com` 为真实域名。
- **坚持只用公版历史照片 + 原创排版/插画资产**，不混入受版权剧照；页脚加「非官方同人/致敬」免责声明。

### 维度 G · 移动端
- 自定义光标仅在 `pointer: fine` 启用，触屏关闭。
- 图谱在移动端提供「列表优先」或简化手势；确认缩放/平移在触屏可用。
- 过一遍 9 个视图在 375 / 768 / 1280 三档的排版。

### 维度 H · 提交叙事（拿奖的隐形加分）
- 写一份 **Making-of / Case study**：概念来源、视觉系统、签名交互的技术实现、性能优化数据。Awwwards 提交时附上能显著提高评审好感。
- 准备 3–5 张高质量静帧 + 1 段 30s 演示视频（Capture 首屏 + 签名交互）。

---

## 三、完整 Agent 执行 Prompt（可直接交给 WorkBuddy / 任意 Agent 执行）

> 下面这段是**自包含**的，复制粘贴到一个新的 Agent 会话即可执行。它已包含项目背景、目标、分阶段任务（精确到文件）、约束、验收标准。

```
【角色】你是一名专注「电影感 / 叙事型」网页的资深前端与设计工程师，熟悉 Vue 3、Vite、GSAP、Three.js、无障碍与 Core Web Vitals。你的任务：把《风筝》(2017 谍战剧) 同人专题站优化到能冲击 Awwwards / CSS Design Awards / FWA 级别的设计奖。

【项目背景】
- 仓库：D:\autoclaw\workspaces\kite-site（Vue 3 + Vite 5 + Tailwind 3 + GSAP 3 + ECharts 5 + vue-router 4 的静态站）。
- 主题：《风筝》谍战「绝密档案」母题，暗色电影感 + 浅色「档案纸」双主题（<html data-theme="light"> 切换）。
- 关键文件：
  • 入口与主题：index.html（含阻塞式 Google Fonts、og:image 占位 picsum）、src/main.js（全局注册 GSAP）、src/App.vue（加载屏/进度条/路由过渡挂载）
  • 设计令牌：src/styles/main.scss（:root 变量、卡片/印章/胶片/纸纹等），浅色映射在 theme-light.css（由 scripts/gen_theme_css.py 生成，勿手改，改后跑脚本）
  • 动效库：src/utils/anim.js（pageEnter/revealUp/imageReveal/typewriter/parallax/titleSweep，已尊重 prefers-reduced-motion）
  • 组件：src/components/（LoadingScreen, NavBar, PageTransition, FilmGrain, ScanLine, SealStamp, CustomCursor[待建] 等）
  • 视图（9 个）：src/views/（HomeView, GraphView, CharactersView, CastView, EpisodesView, TimelineView, ArchitectureView, HistoryView, ScenesView）
  • 数据：src/data/*.json（角色/演员/分集/时间线/势力/历史/台词/关系图谱等）
  • 静态资源：public/images（11 张，1.5MB）、public/_headers、public/.nojekyll、public/sitemap.xml（域名是占位 kite.example.com）
  • 部署：已接好 GitHub Pages / Vercel / Cloudflare Pages 三条 Actions（.github/workflows）。vite.config.js 支持 VITE_BASE 环境变量兼容子路径。npm run build 为根路径，npm run build:gh 为 GitHub Pages 子路径。

【必须守住的硬约束】
1. 不能破坏已接好的三平台部署：任何改动跑完 `npm run build` 与 `npm run build:gh` 都必须成功，且两种模式的资源路径正确（根路径无 /kite-site/ 残留，子路径下 /images 已被插件改写）。
2. 双主题必须同时可用且视觉正确（深色 + 浅色档案纸），新增视觉一律用 CSS 变量，禁止硬编码颜色。
3. 必须保留并尊重 prefers-reduced-motion 降级路径（anim.js 已有，新增动效要接同一开关）。
4. 只使用公版历史照片 + 原创排版/插画资产，绝不引入受版权剧照截图。
5. 所有改动可增量提交，不一次性大改导致无法回滚。

【执行分阶段计划】

阶段 0 · 量化基线（先测再改）
- 跑 `npm run build`，记录 dist 总体积、各 chunk 大小、是否出现 /kite-site/ 或 /images 路径错误。
- 用 Lighthouse（或 WebPageTest）记录当前 LCP / TBT / CLS / 最大请求。
- 列出当前首屏关键请求链（Google Fonts 阻塞、ECharts 是否首屏加载）。

阶段 1 · 性能门槛（最高优先，先做）
- ECharts 改为按需引入：在 GraphView.vue 用 `echarts/core` + `GraphChart` + `CanvasRenderer`（如用到 tooltip/title 再补对应 Component），删除 `import * as echarts`。
- 字体自托管：下载 Noto Serif SC(500,700)、Noto Sans SC(400,500)、JetBrains Mono(400,500) 子集化 woff2 放入 src/assets/fonts（或 public/fonts），移除 index.html 的 Google Fonts <link>，改为 preload + @font-face + font-display:swap。
- 图片优化：public/images 转 AVIF/WebP（保留原图兜底），组件里用 <picture>+srcset，加 loading="lazy"/decoding="async"；Hero 大图加低清模糊占位。
- 路由级懒加载确认：/graph 的 ECharts 不进首屏包。
- 验收：首屏 JS < 200KB(gzip)，LCP < 2.5s，TBT < 200ms，构建仍通过 build 与 build:gh。

阶段 2 · 签名式交互（Signature Package，冲奖核心）
- 新增 src/components/CustomCursor.vue：圆形光标 + 磁吸（gsap.quickTo 跟随），hover 可交互元素时放大并显示「解密中」态；仅 pointer:fine 启用，reduced-motion 或触屏自动关闭；在 App.vue 挂载。
- 重写 src/components/PageTransition.vue：用「红线/幕布 wipe」或「封条撕开」主题化切换，替代当前 opacity+y 淡入；保持 reduced-motion 降级为纯淡入。
- 新增首页 WebGL/Canvas 质感层（src/components/HeroField.vue 或并入 HomeView）：轻量粒子/纸屑/引线动效，性能预算内（< 2ms/帧，移动端降级为静态渐变）；隐喻「风筝线 / 潜伏」。
- 关系图谱升级（GraphView.vue）：节点 hover 时关系标签用打字机式逐字浮现（复用 anim.js 的 typewriter），强化电报母题。
- 时间线视图（TimelineView.vue）：改为横向滚动 + 钉住叙事（ScrollTrigger pin），章节随滚动推进。

阶段 3 · 视觉系统精修
- 在 main.scss 现有令牌上新增「高光金」与统一圆角/描边/阴影三套尺度，扩展至按钮/输入/标签。
- 首页 Hero（HomeView.vue）重构：把「信仰至上 · 半生潜伏」放到视觉重心，3 秒内立住情绪；保留现有索引网格但作为次级入口；标题用 titleSweep 升级为「显影 + 字距收束」。
- 修正对比度：金色仅用于辅助，关键信息用纸色/血红；过一遍 9 视图正文可读性。
- 自定义 favicon 动态态（可选）。

阶段 4 · 内容 / 可访问性 / 移动端闭环
- 生成定制 1200×630 OG 社交卡（用 ImageGen 或设计工具，风筝+绝密档案视觉），替换 index.html 的 picsum og:image 与 twitter:image；修正 public/sitemap.xml 占位域名。
- 图增加键盘导航：方向键/Tab 移动节点、Enter 开档案、Esc 关；画布 role=application + 说明文案。
- 过一遍 375/768/1280 三档排版；自定义光标与 WebGL 在触屏正确关闭；移动端图谱提供可用手势或列表优先。
- 页脚加「非官方同人/致敬」免责声明。

阶段 5 · 收尾与证据
- 重新跑 Lighthouse，对比阶段 0 基线，输出优化前后数据表。
- 写一份 Case study / Making-of 草稿（概念、视觉系统、签名交互技术、性能数据），用于奖项提交。
- 准备 3–5 张静帧 + 30s 演示视频脚本（首屏 + 签名交互）。
- 全部改动增量提交，保留可回滚；不破坏三平台部署。

【验收标准 / Definition of Done】
- `npm run build` 与 `npm run build:gh` 均成功，两种模式资源路径零错误。
- 双主题视觉正常，reduced-motion 全程降级有效。
- 首屏 JS(gzip) < 200KB，LCP < 2.5s，TBT < 200ms，CLS < 0.1。
- 至少落地 3 个签名式交互（自定义光标+磁吸、主题化页面切换、WebGL/Canvas 质感层）。
- 无控制台报错；9 视图在 375/768/1280 均可用；图谱键盘可达。
- 无 picsum/example.com 占位；OG 图为定制；仅公版/原创资产。
- 提供优化前后性能对比 + Case study 草稿。

【默认工作方式】
- 每个阶段先小额改动 → 本地 `npm run dev` 目测 → `npm run build` 验证 → 再进入下一阶段。
- 遇到会破坏部署或双主题的改动，先停下说明，不要擅自大改。
- 完成后给出「下一阶段可继续执行的 Prompt 片段」。
```

---

## 四、给你的建议（优先级）

如果只能做三件事，按这个顺序：
1. **过了性能门槛**（ECharts 按需 + 字体自托管 + 图片优化）——这是能不能参赛的底线。
2. **做出 1 个真正的 Signature Moment**（推荐：首页 WebGL 引线/纸屑层 + 自定义磁吸光标）——这是能不能被记住的关键。
3. **把首页 Hero 改成 3 秒立住情绪的叙事入口** + 换掉 picsum OG 图。

需要我现在就**直接开始执行某个阶段**（比如先跑阶段 0 基线 + 阶段 1 性能），还是你想先把这份 Prompt 喂给一个独立 Agent 会话去做？告诉我起点即可。
