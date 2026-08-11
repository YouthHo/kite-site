# 关系图谱 · 交互与界面层全面重构执行 Prompt（从底层逻辑到顶层体验）

> 适用范围：仅 `src/views/GraphView.vue`、`src/graph/*`、`src/components/*`（与图谱相关者）、`src/utils/*`、`src/data/relationships.json` 的**交互/界面/可读性问题**。
> 下游定位：本 prompt 是「图谱」这条产品线的**第二代重构**——第一代（引擎/视觉层，commit `d158d68`→`58f2396`）已交付自研 Canvas2D 引擎、数据契约、解密巡览、洞察面板。第一代解决的是"渲染能力"，但**操作逻辑与界面可读性没跟上**，这正是本次要脱胎换骨的对象。
> 用法：把全文交给一个 Agent 会话，从 §7 起点命令开始执行。Agent 必须先用 `git log --oneline -8` 与 §3 的诊断逐条核对，确认 `GraphView.vue` 仍是 ~638 行、`GraphEngine.js` 仍是 ~798 行后再动手。

---

## §0 角色与使命

你是一名**资深前端体验架构师 + 交互设计师**，专长数据可视化与信息图的交互系统设计。你的任务不是"美化"，而是**重新定义这套关系图谱的操作范式**——让一个第一次访问、对技术完全不懂的观众，也能在 10 秒内理解"这是什么、我能做什么、怎么退出来"，并且全程不出现文字重叠、不出现"我点了但不知道发生了什么"。

交付物必须达到国际设计奖（Awwwards / CSS Design Awards / FWA）级别的交互清晰度与电影叙事质感。

---

## §1 北极星与可验收目标（必须 measurable）

1. **零文字重叠**：任何缩放/布局/筛选状态下，画布上的节点名、关系名、状态条彼此不压字（重叠检测：截任意 5 个视角，肉眼零压字）。
2. **零操作歧义**：任意时刻用户能回答"我现在在哪种模式 / 怎么退出 / 刚才那下点击做了什么"。提供常驻「状态条」+ 每个控件 `title`/tooltip。
3. **零学习成本**：首次进入有≤40 秒的引导（可跳过、可重看），覆盖"缩放/平移/点节点/三种模式/筛选"。
4. **操作逻辑自洽**：消除互相冲突的模式叠加；主操作（点节点=看档案）在所有非特殊模式下恒定；特殊模式（解密/路径）有明确的"进入态"与"退出按钮"，绝不静默改变主操作含义。
5. **性能不退化**：LCP<2.5s、首屏图谱 JS<200KB、交互 60fps（引擎当前 4.4ms/帧，保持）、reduced-motion 下完全静态可用。

---

## §2 不可违背的铁律（违反任一条即算失败）

1. **纯静态站点**：不得引入后端 / SSR / 付费 API / 需密钥的服务。所有逻辑在构建期或浏览器端完成。
2. **三平台部署不变**：保留 `.github/workflows/deploy-*.yml`、`vite.config.js` 的 `VITE_BASE` 支持、`public/_headers`、`public/.nojekyll`、`DEPLOY.md`。改动后 `npm run build` 与 `npm run build:gh` 必须双双通过。
3. **双主题 + reduced-motion**：`src/store/app.js` 的 `theme`（dark/light）与 `prefersReduced`（`src/utils/anim.js`）必须继续驱动；新增任何动效都需提供 `prefers-reduced-motion` 静态降级。
4. **版权零风险**：节点继续用「姓名印章/姓名徽章」图形（见 `NameBadge.vue`/`SealStamp.vue`），**绝不引入任何剧照、演员照片或受版权保护的图像**。关系与人物数据以 `src/data/characters.json` 公版剧情为准。
5. **性能预算**：首屏图谱相关 JS ≤ 200KB（gzip）；不新增重型依赖（禁止 three.js / d3 全量 / echarts 回归）。需要力导向/几何计算可继续用现有自研 `GraphEngine` 内的算法。
6. **不破坏既有正确资产**：以下必须保留并复用，只允许在其上扩展——
   - `src/graph/GraphEngine.js` 的相机/缩放/平移/捏合/DPR/命中测试/`fit()`/`centerOn()`/力模拟/mini-map 能力；
   - `src/graph/useGraphData.js` + `src/graph/schema.md` 数据契约（新增字段必须同步 `schema.md`）；
   - 解密巡览 `TOUR_STEPS`、洞察面板、关系类型图例（`TYPE_META`）、`CustomCursor.vue` 磁吸光标、`NameBadge.vue`、`SealStamp.vue`、`PageTransition.vue`。
7. **可回滚**：每个 Phase 一个独立 commit；每步后用 `npm run build` 验证；任一 Phase 失败可 `git revert` 单独回退而不影响其他。

---

## §3 当前真实状态诊断（带着证据，Agent 必须逐条核对）

### 3.1 已经做对、要保留的资产
- 自研 `GraphEngine`（Canvas2D）：相机缓动、光标缩放、双指捏合、DPR、`_hitNode` 命中、力导向、`fit`/`centerOn`、mini-map —— 能力到位。
- 数据层 `useGraphData`：`visibleNodes`/`visibleLinks`/`sortedList`/`stats`/`shortestPath`/`commonNeighbors`/`factionSpread` 齐备；`schema.md` 契约清晰。
- 视觉语言：风筝线边（悬链+摆动+电报脉冲）、印章节点（kite金/shadow红）、六色语义关系边、药丸标签——设计质感好。
- 已有关卡：解密巡览（10 幕 kites/shadow 双轴）、洞察面板、关系类型图例、屏幕阅读器 `aria-live`、键盘方向键导航。

### 3.2 真正的问题（用户原话：操作逻辑漏洞多、不直觉、缺乏说明、文字重叠、一片混乱、界面不友好）——逐条定位

**【问题 A｜文字重叠·核心】节点名标签无任何避让**
- `GraphEngine.js` 第 669–677 行：`ctx.fillText(n.name, p.x, p.y + r + 5*ui)` 在**每个节点正下方**绘制名字，完全没有碰撞检测。全图 30 个节点名（如"郑耀先""高君宝""周志乾"）在 fit 视图与缩放/力导向下彼此压字。
- 唯一有避让逻辑的是**悬停关系标签**（第 682–719 行的矩形堆叠避让），节点名标签反而没做。
- 后果：用户第一眼看到的就是"一堆名字糊在一起"，即"一片混乱"。

**【问题 B｜文字重叠·加剧】筛选/力导向后布局更挤，标签反而不收**
- `fit()`（第 169–174 行）把 0–100 世界坐标铺满画布；30 节点间距约 80px，而 11px 字号的中文名宽 22–44px，下方标签必重叠。
- 力导向开启后节点位置由算法决定，作者精心手绘的 `x/y`（`relationships.json`，`schema.md` 称"王牌视图默认布局"）被破坏，无任何"锁定/恢复手绘布局"通道，拥挤更随机。

**【问题 C｜缺乏说明·核心】没有 onboarding，唯一提示极弱**
- `GraphView.vue` 第 369 行：仅一行 `KITE-MAP · 滚轮/双指缩放 · 拖拽平移 · 点击节点查看档案`，10px 字号、`#555048`（近黑底几乎看不见）、`pointer-events-none`，且**没解释三种模式、时间轴、图例含义**。
- 全仓库 `grep` 确认：**没有任何 help / onboarding / tour / guide / legend 说明组件**（只有 `SearchModal.vue`）。
- 图例（第 463–482 行）只列了阵营色与关系线色，**没有解释节点大小=重要度、印章=kite/shadow、虚线=敌对**这些关键语义。

**【问题 D｜操作逻辑漏洞·核心】多个模式互相叠加、状态隐藏、主操作被静默劫持**
- 存在 5 个互相独立的开关：`tour`(巡览) / `decryptMode`(解密模式) / `pathMode`(路径) / `focusClick`(点击隔离) / `layoutMode`(力导向)。它们可以任意叠加，组合态不可见。
- **主操作随模式静默变义**：`GraphEngine.js` 第 326–338 行——`decryptMode` 下点击节点变成"揭开"（解密）而非"看档案"；`GraphView.vue` 第 107–127 行 `handleNodeClick` 在 `tour` 下变成"推进下一幕"。用户完全无法预知"我这一下点下去会发生什么"。
- **两个"解密"概念混淆**：顶部按钮文字在"解密档案"(启动巡览)与"退出巡览"间切换（第 383 行），而另有"解密模式"(逐节点揭开)——同词两义，极度迷惑。
- **Esc 状态机隐藏**（`GraphView.vue` 第 278–287 行）：依次尝试 pathMode→selected→focusNodeId→focusClick 退出，用户看不到"当前按 Esc 会退什么"。
- **路径模式歧义**：第 384–398 行按钮只写"路径模式"；第 424–429 行提示"请点击终点"，但同时画布与侧栏行都响应（第 113–127、228–240 行），入口不统一。
- **侧栏行语义反直觉**：`onRowClick`（第 228–240 行）普通模式下点击"名字行"=勾选/取消筛选（`personSel`），而用户预期是"看资料"；真正看资料要戳右侧小 `Info` 图标（第 559–566 行）。且 `personSel` 默认全选（第 78 行），列表看起来"全高亮"，用户误以为在强调而非筛选。

**【问题 E｜界面不友好】工具条无图标/无 tooltip/状态不可见，移动端拥挤**
- 顶部工具条（第 377–412 行）是纯文字按钮，无图标、无 `title`、无 tooltip；唯一反馈是细微边框变色（`border-[#b8860b]`），极易忽略——"我现在到底在哪个模式"全靠猜。
- 移动端 `max-w-[62%]` 换行拥挤；左下角图例 `max-w-[48%]` 与右下角时间轴可能重叠；mini-map（引擎第 741–776 行）固定在右下，与时间轴同位竞争。

**【问题 F｜小 bug】平移逻辑重复赋值**
- `GraphEngine.js` 第 307–308 行 `this.cam.x` 被连续赋值两次（第一行为死代码），应清理。

### 3.3 诊断结论（给 Agent 的定调）
引擎与视觉**已经够好**，问题 100% 集中在**交互范式与界面可读性**这一层。因此本次重构是**在现有引擎之上重建交互层**，不是重写引擎。重点攻克：① 标签避让（A/B）② 引导与图例（C）③ 统一交互状态机、消除静默劫持（D）④ 工具条/状态条/响应式（E）⑤ 清理 F。

---

## §4 重构蓝图：从底层逻辑到顶层体验（Layer 0 → Layer 5）

### Layer 0 · 交互状态模型（最底层，先决条件）
把 3.2-D 里那堆互相叠加的布尔开关，收敛为**一个显式状态机**，由 `GraphView.vue` 顶层持有并渲染"状态条"。

- 定义唯一 `mode`：`'browse' | 'decrypt' | 'path' | 'tour'`（互斥，任一时刻唯一）。
- 定义 `selection`：`{ hoverId, focusId(隔离), panelId(档案卡), pathStart, pathEnd }` 与 `mode` 解耦——**主操作恒为"点节点=看档案"**，除非 `mode` 显式改变它（且改变时必须伴随可见的"进入态"）。
- 定义**每个 mode 的进入条件、退出方式、对主操作的影响**，写成一张契约表（见 §5 Phase 1 交付物）。
- Esc 行为由当前 `mode` + `selection` 唯一决定，并在状态条上**实时显示"按 Esc 退出 X"**。
- 禁止 `decryptMode` 与 `tour` 同时激活；进入其中一个先退出另一个。

### Layer 1 · 画布可读性（消灭文字重叠）
- **节点名标签避让**：在 `GraphEngine.render` 的节点绘制段（第 583–680 行）加入与悬停标签同级的避让算法——用贪心+力排斥（或 quadtree 空间划分）为每个标签求无重叠位置；重叠无法避免时绘制**引线(label leader line)** 指向节点而非压字。
- **标签分级显隐（decluttering）**：依据 `this.cam.scale`（即 `ui`）决定标签密度——缩得越小，只显示高中心性/印章节点名；放大才逐级显示全部。避免"一缩小就全糊"。
- **节点大小图例**：在图例面板补一句"节点越大=剧情权重越高（中心性驱动）"，并在 `schema.md` 标注 `centrality` 含义。
- **关系名标签**沿用现有避让（第 682–719 行），但扩展到"聚焦隔离时显示被聚焦节点的全部关系名"也走避让。

### Layer 2 · 引导与图例（消灭"缺乏说明"）
- **首次进入引导**（独立 overlay 组件 `GraphOnboarding.vue`，非解密巡览）：分步高亮"缩放/平移/点节点看档案/三种模式/时间轴/筛选"，每步一句人话+可跳过+「不再显示」写入 `localStorage`（复用 `app.js` 的持久化范式）。与 `CustomCursor` 磁吸联动。
- **常驻帮助入口**：工具条加 `?` 按钮，打开帮助面板（复用引导内容的可滚动版）。
- **图例面板升级**：除阵营色、关系线色外，明确标注：节点大小=重要度、印章金/红=kite/shadow、虚线=敌对、箭头=有向。可放进侧栏或折叠浮层。

### Layer 3 · 操作界面重构（消灭"不直觉/不友好"）
- **工具条组件化** `GraphToolbar.vue`：每个控件 = 图标 + 文字 + `title` tooltip；激活态有强对比（底色+图标填充），并显示模式说明一句话。
- **主操作恒定**：默认 `browse` 模式下，画布点击节点 = 打开档案卡（保持 `openPanel`）。`decrypt` 模式用**独立入口按钮**且进入时画布出现"解密蒙层提示"，点击才揭开——不让它偷偷改掉 browse 的主操作；退出 decrypt 即恢复 browse 主操作。
- **路径模式显式双步**：进入后画布顶部固定显示"① 点击起点"，选完变"② 点击终点"，两端节点高亮+连线预览；提供"取消"按钮。画布与侧栏入口统一为同一函数。
- **隔离/聚焦**提供可见的"退出隔离"按钮（不只靠 Esc），`Esc` 提示同步在状态条。
- **侧栏行语义纠正**：默认点击名字行 = 打开档案卡（符合直觉）；勾选筛选改用行前独立复选框（已存在的小方块，第 550–555 行），不再用"点击整行"暗含筛选；`personSel` 默认**不全选**，改为空选=显示全部（或用"全部/无"显式按钮，第 537–539 行已存在，保留并强化文案）。

### Layer 4 · 上下文智能与叙事连贯
- **状态条** `GraphStatusBar.vue`：常驻显示 当前模式 / 选中节点 / Esc 可退出项 / 统计（节点·连线·阵营·核心）——把第 372–374 行的角落统计与模式提示整合为可读面板。
- 保留并串联：解密巡览、洞察面板、关系图例、mini-map；mini-map 改到不与时间轴/图例冲突的位置（如右上或左侧竖排），或改为可拖拽/可隐藏。
- 移动端：工具条/图例/时间轴/状态条做响应式重排（底部抽屉 or 折叠），保证窄屏不重叠。

### Layer 5 · 可访问性·移动端·性能·奖项证据
- 画布节点名无法被读屏直接读（canvas 限制）——用"列表视图"作为画布的 DOM 文本等价（侧栏 `sortedList` 已是，强化其"画布等价文本"语义并加 `aria`）。
- 全量走 `prefersReduced` 静态降级；键盘导航完整保留并补充"Tab 到工具条"焦点环。
- 交付**奖项素材**：3–5 张 1440p 静帧（不同模式/主题）、15–30s 演示视频脚本（含引导→浏览→聚焦→解密→路径的叙事线）、`DEPLOY.md` 增补"图谱交互说明"一节。
- 跑通 `npm run build` + `npm run build:gh` + 27 项扫版（沿用现有 `scripts/check-*.cjs`/Puppeteer 巡检）+ Lighthouse（LCP/TBT）。

---

## §5 分阶段执行路线（每阶段独立 commit、可验证、可回滚）

**Phase 0 · 基线对齐（30 分钟）**
- `git pull` + `git log --oneline -8` 确认 HEAD；`npm run build` 跑通存 baseline。
- 产出：`docs/graph-ux-baseline.md`（截图 3 张：默认视图/解密模式/路径模式，标注问题 A–F 位置）。
- 不要改代码。

**Phase 1 · 交互状态机（Layer 0）**
- 在 `GraphView.vue` 引入 `mode` ref 与 `selection` 对象，重写 `handleNodeClick`/`toggleDecrypt`/`startTour`/`togglePathMode`/`onKey(Esc)` 使其全部经状态机。
- 交付 `docs/graph-state-machine.md`：mode×进入×退出×主操作影响 契约表。
- 验证：手动模拟 5 种 mode 切换，确认不再叠加、Esc 提示正确、主操作在 browse 恒定。

**Phase 2 · 标签避让与可读性（Layer 1，问题 A/B）**
- 在 `GraphEngine.render` 节点段加避让+引线+分级显隐；新增 `nodeSizeLegend` 数据。
- 清理 `GraphEngine.js` 第 307–308 行死代码（问题 F）。
- 验证：fit / 缩放到 1.2 / 力导向 三种状态下各截 1 图，肉眼零压字。

**Phase 3 · 引导与图例（Layer 2，问题 C）**
- 新建 `GraphOnboarding.vue`（首run overlay +「不再显示」持久化）、`GraphHelpPanel.vue`；升级图例（节点大小/印章/虚线说明）。
- 验证：清 `localStorage` 首次进入看到引导；`?` 打开帮助。

**Phase 4 · 工具条与状态条（Layer 3/4，问题 D/E）**
- 新建 `GraphToolbar.vue`（图标+文字+tooltip）、`GraphStatusBar.vue`；纠正侧栏行语义（点击=看档案，筛选用复选框）；路径模式显式双步 UI；隔离"退出"按钮。
- 验证：每个控件 hover 出 tooltip；模式切换状态条实时更新；路径双步清晰。

**Phase 5 · 响应式与移动端（Layer 4/5）**
- 工具条/图例/时间轴/状态条窄屏重排（底部抽屉/折叠）；mini-map 错位修复。
- 验证：375px / 768px / 1440px 三档截图无重叠。

**Phase 6 · 可访问性与奖项证据（Layer 5）**
- 侧栏加 `aria` 等价语义；reduced-motion 全量核对；产出静帧+视频脚本+`DEPLOY.md` 增补。
- 验证：Lighthouse LCP<2.5s、TBT<200ms；27 项扫版通过；键盘全流程可操作。

**Phase 7 · 收尾**
- `npm run build` + `npm run build:gh` 双通过；`git push`（若凭据可用）；更新 `docs/case-study.md` 记录前后对比。

---

## §6 验收清单（Definition of Done）

- [ ] 任意 5 个视角截图：节点名/关系名/状态条**零重叠**（A/B 解决）
- [ ] 首次进入有 ≤40s 引导，可跳过可重看；`?` 帮助可达；图例解释大小/印章/虚线（C 解决）
- [ ] `mode` 唯一且状态条实时显示；browse 下点节点恒=看档案；decrypt/path/tour 进入有可见"进入态"+明确退出（D 解决）
- [ ] 工具条每控件有图标+tooltip；模式切换有强对比反馈；移动端无重叠（E 解决）
- [ ] `GraphEngine.js` 第 307–308 死代码已清理（F 解决）
- [ ] 双主题 + reduced-motion 全功能可用
- [ ] `npm run build` 与 `npm run build:gh` 均通过；首屏图谱 JS ≤200KB；60fps
- [ ] 三平台部署配置未被破坏；`DEPLOY.md` 增补图谱交互说明
- [ ] 奖项素材（静帧×≥3、视频脚本）已产出
- [ ] 不引入任何剧照/演员照片（版权零风险）

---

## §7 起点命令（Agent 第一个动作）

```bash
cd "D:/autoclaw/workspaces/kite-site"
git pull --ff-only
git log --oneline -8
npm run build 2>&1 | tail -5   # 确认 baseline 可构建
# 然后读 §3 诊断，核对 GraphView.vue(≈638行) 与 GraphEngine.js(≈798行) 行号一致后，从 Phase 0 开始
```

---

## §8 给 Agent 的"不要做"清单（防推倒重来）

- ❌ 不要重写 `GraphEngine` 的相机/缩放/力导向/mini-map——它们是对的，只在节点标签段（第 583–680 行）加避让。
- ❌ 不要删 `TOUR_STEPS`、洞察面板、`TYPE_META` 图例、自定义光标。
- ❌ 不要引入 three.js / d3 / echarts（性能与版权铁律）。
- ❌ 不要把"解密巡览"和"解密模式"合并成一个概念——它们语义不同，只是 UI 上要更清晰地区分（见 Layer 0/3）。
- ❌ 不要改变 `relationships.json` 的 `x/y` 手绘布局语义；力导向是"可选叠加"，必须提供"恢复手绘布局"通道（呼应 `resetView`）。
