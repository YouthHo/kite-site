# 《风筝》关系图谱 · 从底层到顶层的脱胎换骨重建 · Agent 执行 Prompt（产品经理 Brief）

> 使用说明：本文是**自包含、可直接复制粘贴到任意 Agent 会话执行**的产品经理 Brief，专门重做本站最核心的功能——**人物关系图谱**。
> 本版本已对照仓库真实状态校准（基于 commit `5c46f3a` 之后的代码）。凡引用到的现有文件、数据字段、设计令牌均为事实，Agent 应直接读源码而非凭空假设。
> 目标：把关系图谱从「功能完备但视觉受 ECharts 制约」升级为**全球领先、国际顶尖设计技术水准**的叙事型关系图谱，成为整个站点最被记住的签名体验。

---

## 0. 你的角色与任务

你是 **Lead 前端架构师 + 创意技术专家（Creative Technologist）**，兼具产品嗅觉与图形学功底。
任务：把现有《风筝》关系图谱**从底层工程地基开始脱胎换骨**，一路打磨到顶层叙事与视觉，最终交付一个**国际一流（Awwwards / CSS Design Awards / FWA 级别）的关系图谱**。
你必须同时做到：
- **底层扎实**：数据契约、渲染引擎、物理布局、性能预算、无障碍，像工业级产品一样可靠；
- **顶层惊艳**：视觉语言（风筝线 / 封条 / 电报母题）、签名交互、叙事智能（解密 WHO IS KITE · WHO IS SHADOW），像获奖作品一样有记忆点。

本 Brief 不要求逐行写死代码，但要求你在约束内做出专业决策并**执行到可运行、可验证、可回滚**。

---

## 1. 产品定位与北极星

**定位**：全站最核心的「人物关系解密台」——剧迷在这里看清 30 年谍战线上的每一根牵绊；设计/技术评审在这里被一套**有电影感、有叙事、有技术前瞻性**的关系可视化惊艳。

**北极星（North Star）**：
> 用户在图谱页停留的 30 秒内，至少经历一次「哇」——可能是某条关系线的电报脉冲、某次点击后网络像被抽紧的风筝线一样收束聚焦、或「解密模式」下真相逐层揭开的瞬间；并在离开时记住这个图谱。

**双用户都要服务好**：① 剧迷/资料查阅者（找得到人、看得清关系、查得到最短链路、读得懂阵营）；② 设计/技术评审（被视觉与交互说服「这代表当下最高水准」）。

---

## 2. 铁律（不可违背的硬约束 · 全部继承自全站，仍然有效）

1. **纯静态（最高优先级）**：禁止任何后端 / 数据库 / 服务端运行时。图谱所有数据来自 `src/data/relationships.json`，一切计算（布局、路径、筛选、过滤）在客户端完成。允许 Canvas / WebGL / 客户端搜索筛选。
2. **部署目标不变**：必须保留 `.github/workflows/` 三条工作流与 `vite.config.js` 的 `VITE_BASE` 机制（兼容根路径与 `/kite-site/` 子路径）。`npm run build` 与 `npm run build:gh` **都必须成功**，两种模式资源路径零错误。
3. **双主题并存**：深色「胶片」+ 浅色「档案纸」都必须精致可用（`<html data-theme="light">` 切换，由 `src/store/app.js` 的 `theme` ref 驱动）。图谱视觉一律用 CSS 变量 / 令牌，禁止硬编码颜色，两套主题都要逐一目测。
4. **reduced-motion 全程尊重**：新增一切动效必须接入降级开关（现有 `src/utils/anim.js` 的 `prefersReduced` 是静态布尔；建议升级为响应式，但至少保持同源降级）。触屏 / 低端设备 / reduced-motion 下：无物理模拟、无绘入动画、无粒子，功能（hover/click/键盘/筛选/路径）仍完整可用。
5. **版权零风险**：节点不使用任何照片（现有方案是用姓名做图形头像，见 `src/components/NameBadge.vue`，这是正确且强有力的设计选择，保留并升级）。绝不引入受版权剧照。任何插画/SVG 资产必须原创。
6. **性能预算是一等约束**：LCP < 2.5s、TBT < 200ms、CLS < 0.1、首屏 JS(gzip) < 200KB、Lighthouse Performance ≥ 95。图谱在独立路由（vue-router 懒加载），其专属 chunk 可大于首屏预算，但必须 **60fps 运行、DPR 清晰、移动端不卡**；不得让首屏 JS 回退；新增依赖（d3 / regl / pixi 等）必须懒加载且计入体积预算。

---

## 3. 当前项目真实状态（写于 commit 5c46f3a 之后 · 已达成事实 · 勿推倒重来，要在其上脱胎换骨）

> 以下为已提交成果，Agent 应**先读懂再改造**，复用其中正确的部分（数据模型、筛选逻辑、键盘导航、电报打字机、双主题、设计令牌）。

### 3.1 现有图谱实现（`src/views/GraphView.vue`，775 行）
- **渲染**：`echarts/core` + `GraphChart` + `CanvasRenderer`（按需引入，懒加载 chunk，不进首屏）。`onMounted` 里 `echarts.init`。
- **布局**：`none`=手绘坐标（节点 `x/y` 为 0–100 百分比坐标系，来自 `relationships.json`）+ `force`=力导向模拟（可调节斥力/连线长）。
- **关系语义**：`TYPE_META`（enemy 敌对红虚线 / superior 上下级 / family 亲情金 / love 爱情粉 / comrade 同志青 / partner 接头褐），数据每条约 `{source,target,label,type,strength,tone}`。
- **筛选体系**：阵营筛选（5 阵营）、人物多选（sidebar 列表勾选）、关键词搜索、排序（阵营/姓名/代号/出场跨度）。
- **时间轴演化**：`ep` 1–46 滑块 + 播放键，按角色 `episodes` 跨度控制出场（未出场不显示）。
- **最短路径**：`computePath` 用 BFS（无权图），路径模式可选起点/终点，高亮路径节点与边。
- **交互**：原生 roam（滚轮缩放/双指捏合/节点拖拽）+ 空白处手动平移（`graphRoam` dispatchAction）；点击节点 → 右侧弹出档案卡（`openPanel`，GSAP 滑入 + `typewriter` 电报逐字简介）。
- **键盘**：方向键在 `sortedList` 间移动焦点、Enter 开档案、Esc 关闭/退出路径模式；容器 `role="application"` + aria-label。
- **视觉**：节点径向渐变 + 名字在下方；边按类型着色；统计条；玻璃拟态侧栏（`.glass`）；深/浅主题已在 `buildOption` 内按 `theme.value` 切换颜色。
- **已知天花板（本次要突破的）**：ECharts 节点只能是圆、边只能是简单曲线，无法做风筝线/封条/电报脉冲等签名视觉；物理模拟偏弱；难以承载「解密」叙事与高质量辉光/粒子。

### 3.2 数据层（`src/data/relationships.json`，约 30 节点 / 70+ 关系，精确数以文件为准）
- `nodes`: `{id, name, code, faction, x, y}`，坐标 0–100。
- `links`: `{source, target, label, type, strength, tone}`。
- 人物 richer 字段在 `src/data/characters.json`（`episodes[0]/[1]` 出场跨度、`identity`、`actor`、`brief` 等），GraphView 用 `charMap` 合并读取。
- `src/utils/factions.js`：`FACTION`（junton 军统 #9d2235 / zhongtong 中统 #7d3b52 / underground 地下党 #1e4a52 / gongan 公安 #3d3d3d / civilian 平民 #8b7355）+ `factionLabel`。
- `src/components/NameBadge.vue`：姓名即头像（圆形径向渐变 / lg 档案名卡「KITE FILE」），无照片兜底，版权安全且视觉统一。

### 3.3 设计系统与复用资产
- 令牌（`src/styles/main.scss`）：`--gold #b8860b`、`--gold-highlight #d9a441`、`--blood`（红色语义）、`--dur-fast/base/slow`、`--ease-out/inout`；`.serif-title`、`.gold-line`、`.badge-faction`、`.glass`。浅色主题在 `[data-theme='light']` 与 `src/styles/theme-light.css` 覆盖。
- `src/utils/anim.js`：`typewriter`（电报打字机，带光标）、`titleSweep`（遮罩扫过显影）、`pageEnter`、`prefersReduced`。
- `src/components/HeroField.vue`：余烬粒子 Canvas（隐喻「风筝线/潜伏」），可作为图谱背景氛围层的参考实现。
- `src/components/CustomCursor.vue`：双层磁吸光标（仅 `pointer:fine`），图谱节点应与之联动。
- `src/store/app.js`：`theme` ref + `toggleTheme`、可复用的 `searchOpen` 等全局状态。

---

## 4. 从底层到顶层的重建蓝图（逐层给方向与标准）

### Layer 0 · 数据层（地基 · 先打，再往上盖）
- **升级 `relationships.json` 为强契约数据模型**，并新增 `src/graph/useGraphData.js`（或 `composables/useGraphData.js`）统一数据访问，让图谱、筛选、搜索、路径、档案卡共享同一事实源：
  - 节点增补：`role`（身份，如「军统王牌特工/中共卧底」）、`key`（布尔，`kite`=风筝 / `shadow`=影子，用于叙事）、`centrality`（可选，由脚本预计算度数/介数，用于尺寸与排序）、`aliases`。
  - 关系增补：`directed`（方向语义，如「上线→下属」）、`activeEra`（该关系活跃的子集区间，支撑更精准的时间演化）、`secret`（布尔，解密模式用）、`evidence`（一句剧情佐证，可被档案卡/洞察面板引用）。
  - 保留现有 `type/strength/tone/label`，向后兼容（提供兼容读取，避免一次性断代）。
- **预计算衍生数据**：写一个构建期/运行期的小脚本或 composable，从关系网络算出度数中心性、阵营分布、共同邻居，供尺寸映射与「洞察面板」使用。
- 输出：一份数据 schema 说明（注释写进 JSON 或独立 `src/graph/schema.md`），确保 Agent 后续各层都基于契约而非散落字段。

### Layer 1 · 渲染引擎（引擎地基 · 决定上限）
- **替换 ECharts 为自研渲染管线**（ECharts 是视觉天花板，建议最终移除；若需稳妥可保留为降级分支，但默认走新引擎）。推荐技术选型（在约束内由你决定，动手前 3 行说明取舍）：
  - **布局物理**：`d3-force`（仅 `d3-force` 子集，约 10–30KB gzip）做力导向；手绘坐标模式保留为默认「王牌视图」。
  - **绘制**：首选 **Canvas2D 自定义渲染器**（完全艺术控制、DPR 清晰、体积小）；若追求辉光/粒子/泛光等电影感，**叠加一层 WebGL**（如 `regl` 或 `PixiJS`）专做发光与粒子，Canvas2D 画主体。WebGL 必须懒加载、移动端可关。
  - 禁止引入会把首屏 JS 撑破的重依赖；一切图谱相关依赖走**路由懒加载 chunk**。
- **`GraphEngine` 抽象**（新建 `src/graph/engine.js` 或 `src/graph/GraphEngine.ts`）：封装
  - 无限平移 / 以光标为中心缩放 / 双指捏合（触屏）；
  - DPR 自适应清晰绘制；
  - **命中测试**（hover / click / 键盘焦点 → 节点 id）；
  - **可编程相机**（fit 全图 / centerOn(node) / focusNeighborhood(node) 带缓动）；
  - **主题重绘**（不重建实例，仅换令牌重绘）；
  - **reduced-motion**：关闭模拟与绘入动画，直接渲染静态坐标。
- 验收：用当前 `relationships.json` 数据，新引擎须**功能对标**现有图谱（同款筛选/搜索/路径/时间轴/键盘都能跑），且 60fps、DPR 清晰、双主题正常。

### Layer 2 · 视觉设计系统（图形语言 · 签名感来源）
- **节点（Nodes）**：告别千篇一律的圆。建议分级视觉：
  - 关键特工（kite/shadow 及核心角色）用「**封条 / 印章**」字形（圆形印章轮廓 + 姓名篆意排版），普通角色用阵营色径向渐变圆（与 `NameBadge` 同语言）；
  - 尺寸由 `centrality` 或叙事权重映射，而非仅出场跨度；
  - 名字标签用全站字体系统（标题 serif / 正文 sans），主题感知，保证双主题对比度（浅色下深字、深色下浅字）。
- **边（Edges）= 签名核心**：渲染为 **「风筝线」**——带轻微悬链垂坠（catenary sag）与微弱随风摆动的细线，隐喻牵绊与潜伏；按关系语义区分：
  - 敌对：磨损红虚线、略带颤动；
  - 爱情：暖色柔曲线；
  - 同志：稳重青线；
  - 上下级：结构化直线带节点；
  - 粗细由 `strength` 映射。
  - 选中/悬停时，沿边跑一道**「电报脉冲」**（光点沿风筝线行进），呼应谍战母题。
- **深度与氛围**：复用全站胶片颗粒 + 暗角（vignette）；背景可叠一层极淡的「电码/地图」纹理（参考 `HeroField.vue` 的隐喻手法），与节点层形成轻微视差。聚焦时辉光（bloom）增强。
- **配色**：沿用 `factions.js` 五阵营色 + `--gold`/`--blood` 令牌；所有颜色走 CSS 变量 / `graphTokens` 对象，双主题自动切换。
- 交付：一组合适的「图例即设计元素」（阵营 + 关系类型可点击筛选，已是现状，升级其视觉与动效）。

### Layer 3 · 交互与动效（最大杠杆 · 重点投入）
- **聚焦 / 散焦（Focus & Defocus）**：点击或键盘聚焦某节点 → **隔离其自我网络**（邻居高亮、其余淡至 ~0.12），相机缓动框定该节点；连线以「**被抽紧的风筝线**」方式绘入（签名动效）。Esc 释放。
- **路径模式 2.0**：选 A→B → 连接链路上的风筝线**依次点亮**（脉冲顺着线传递），并显示跳数与「关系链」如电报逐字打出（复用 `typewriter`）。BFS 逻辑已有，重点升级*结果的可视化*。
- **时间轴演化升级**：EP 滑块拖动 → 网络随角色进出**生长 / 消散**（节点淡入缩放出生、溶解退出，边随之形成），把「时间线」做成叙事刮擦条；播放键保留。
- **筛选即编排**：阵营 / 关系类型切换时，节点与边**动画进出**，而非硬 `setOption`。
- **悬停电报**：hover 关系 → 标签以电报打字机浮现（复用 `anim.js`）；节点与 `CustomCursor` 磁吸联动。
- **拖拽物理**：拖动节点 → 邻居经模拟跟随（力导向）。
- **搜索 / 跳转**：输入姓名 → 相机飞向该节点并脉冲提示。
- 全部动效走 `--dur-*` / `--ease-*` 令牌；reduced-motion 下为瞬时静态态。

### Layer 4 · 叙事智能（顶层体验 · 记忆点）
- **「解密」模式（Decrypt Mode）**：初始呈现**被遮蔽的网络**（节点/边模糊或打码），随用户探索/点击逐层揭开——把图谱变成一场「破译 WHO IS KITE · WHO IS SHADOW」的解谜体验，紧扣全站语汇。这是核心签名时刻。
- **双轴秘密引导**：以 kite（郑耀先）/ shadow（韩冰）为两大轴秘密，提供一段引导式「解密档案」巡览，沿图谱揭示反转。
- **洞察面板**：档案卡之外，增加「关系网络」洞察——最短链路、共同联系人、阵营分布、关键枢纽，把数据变成叙事。
- **导航辅助**：密集状态下提供 **mini-map / 总览缩略图**；空态 / 图例作为设计时刻而非简陋兜底。

### Layer 5 · 质量与证据（决定能不能拿奖）
- **无障碍**：键盘（方向键沿图邻接移动焦点、Enter 开档案、Esc 关闭，焦点可见）、屏幕阅读器 live region 播报当前节点与关系、**reduced-motion 完整静态模式**、Tab 可达面板控件。
- **移动端**：触屏平移/捏合、点按=聚焦、小屏优先列表（复用现有侧栏列表）；中端机 60fps / 不发热。
- **性能**：60fps；DPR 清晰；粒子对象池化；无布局抖动；用现有 Puppeteer 审计（375/768/1280 × 图谱路由）验证 27/27 无报错无溢出。
- **证据产出**：写一份「图谱 Case Study」（概念、视觉系统、签名交互技术实现、性能数据），产出 3–5 张高质量静帧 + 30s 演示视频脚本（首屏 → 聚焦抽线 → 路径脉冲 → 解密揭开 → 时间演化），与全站奖项推进一致。

---

## 5. 执行路线（分阶段 · 每阶段独立可验证、可回滚）

> 通用规则：每阶段先小额改动 → `npm run dev` 目测 → `npm run build` + `npm run build:gh` 验证 → 再进下一阶段。遇到会破坏部署 / 双主题 / 版权 / 性能预算的改动，先停下说明。保留 ECharts 路径作为回退，直到新引擎功能对齐再移除。

**Phase 0 · 基线测量**
- 读 `GraphView.vue` / `relationships.json` / `factions.js` / `NameBadge.vue` / `anim.js` / `main.scss`  tokens。
- 记录图谱路由的 Lighthouse / WebPageTest（LCP/TBT/CLS）、graph chunk 体积、节点/关系精确数、现有交互清单与强弱项。产出 `docs/graph-baseline.md`。

**Phase 1 · 数据层**
- 升级 `relationships.json` 契约 + 新建 `useGraphData` composable + 衍生计算（中心性/阵营分布/共同邻居）。保持现有图谱仍可运行（兼容读取）。验收：数据契约清晰、单事实源、旧组件无破坏。

**Phase 2 · 渲染引擎**
- 实现 `GraphEngine`（d3-force + Canvas2D，可选 WebGL 辉光层），封装平移/缩放/命中/相机/主题/reduced-motion，路由懒加载。先用当前数据对标现有功能（筛选/搜索/路径/时间轴/键盘）。验收：功能对标达成、60fps、DPR 清晰、双主题、reduced-motion 静态可用。

**Phase 3 · 视觉语言**
- 节点封条/印章分级、风筝线边 + 电报脉冲、深度颗粒氛围、graphTokens 双主题。验收：视觉显著区别于 ECharts 圆点曲线，双主题精致，对比度达标。

**Phase 4 · 交互与动效**
- 聚焦抽线、路径脉冲、时间演化动画、筛选编排、悬停电报、磁吸光标联动、拖拽物理、搜索飞入。验收：签名交互可用、reduced-motion/触屏降级正确、60fps、无控制台报错。

**Phase 5 · 叙事智能**
- 解密模式、kite/shadow 引导巡览、洞察面板、mini-map。验收：叙事主轴清晰、解密体验顺滑、双主题可用。

**Phase 6 · 质量闭环**
- 无障碍审计（WCAG AA 目标）+ 键盘走查 + 屏幕阅读器；375/768/1280 三档精修（复用 Puppeteer 审计）；Lighthouse ≥95；若新引擎稳定则移除 ECharts 依赖并验证体积。验收：全部硬约束满足；对比 Phase 0 显著改善。

**Phase 7 · 证据与收尾**
- 图谱 Case Study + 静帧 + 视频脚本；增量提交、可回滚；给出「下一阶段可继续的 Prompt 片段」与奖项提交 checklist。

---

## 6. 验收标准 / Definition of Done

- [ ] `npm run build` 与 `npm run build:gh` 均成功，两种模式资源路径零错误（保留三平台部署）。
- [ ] 纯静态（无后端/数据库/服务端运行时）；双主题视觉正常；reduced-motion 全程降级有效。
- [ ] 性能：图谱路由 60fps、DPR 清晰；首屏 JS(gzip) < 200KB 不回退；Lighthouse Performance ≥ 95；graph chunk 懒加载、体积计入预算。
- [ ] 渲染引擎为自研（ECharts 已移除或仅作明确标注的降级分支）；节点/边视觉为定制的风筝线 / 封条语言，非 ECharts 默认圆点曲线。
- [ ] 至少落地签名交互集合：聚焦抽线隔离、路径电报脉冲、时间轴生长演化、悬停电报标签、（加分）解密模式。
- [ ] 无障碍达 WCAG 2.1 AA 目标；键盘全可达（含屏幕阅读器 live region）；图谱路由在 375/768/1280 均无横向溢出/报错。
- [ ] 版权零风险：无任何剧照/照片，节点为原创姓名/印章图形。
- [ ] 提供：图谱前后性能对比 + Case Study + 静帧 + 演示视频脚本。

---

## 7. 工作方式约定

- 默认**增量提交、可回滚**；不一次性大改。
- 任何会破坏「三平台部署 / 双主题 / 版权零风险 / 性能预算」的改动，**先停下说明**，不要擅自推进。
- 每完成一个 Phase，输出「改动清单 + 验证结果（含 build/build:gh 与 Lighthouse/ Puppeteer 数据）+ 下一 Phase 起点」。
- 技术选型在约束内由你专业决定；重大决策（渲染引擎、是否 WebGL、是否移除 ECharts）动手前用 3 行说明取舍。
- 严禁破坏现有可用功能（筛选/搜索/路径/键盘/双主题）；新引擎须先功能对标再移除旧实现。

---

## 8. 第一个可执行起点（从这里开始）

1. 进入仓库 `D:\autoclaw\workspaces\kite-site`，先 `git log --oneline -8` 与通读第 3 节列出的文件，确认当前图谱实现与数据契约。
2. 执行 **Phase 0 基线**：跑一次 `/graph` 路由的 Lighthouse，统计节点/关系精确数量与 graph chunk 体积，写成 `docs/graph-baseline.md`。
3. 进入 **Phase 1 数据层**：先不动渲染，仅升级 `relationships.json` 契约 + 新建 `useGraphData`，保持现有图谱可运行。
4. 之后进 **Phase 2 引擎**：用 d3-force + Canvas2D 搭 `GraphEngine`，先用当前数据对标现有全部交互，跑通 `build`+`build:gh` 后再深化视觉。

开始执行，遇到决策点用简短说明，不要等待。
