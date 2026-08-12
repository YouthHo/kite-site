# 《风筝》专题站 · 内容正确性审计（多重确认）

- 审计对象 HEAD：`e3bb578`（prompt 原指 1610239，已前进，按最新核）
- 审计日期：2026-08-12
- 方法：Stage1 结构（自动）→ Stage2 跨文件（自动）→ Stage3 外部事实（≥2 源，DDG+open-link 实际抓取）→ Stage4 二次独立复核（换关键词/换源）→ Stage5 汇总
- 约束：只读审计，**未修改任何 src/data 数据**

## 一、结构性问题（自动，详见 struct-check.md）

| 文件 | 问题 | 严重度 | 状态 |
| --- | --- | --- | --- |
| public/sitemap.xml、robots.txt | 占位域名 kite.example.com（构建期由 VITE_SITE_URL 注入，本地默认值属预期） | warn | 工程已环境化（2.0 B），非 bug |
| scenes.json image 指向 scene.svg | **已不存在**（2.0 H 已用 SceneCard 原创构图卡替代，页面 0 img） | — | 已解决 |

结构性 error=0，warn=2（均为预期占位域名）。**prompt 的 BUG-1（scene.svg 缺失）在 2.0 H 轮已修复**，实际文件存在且页面已不引用照片。

## 二、跨文件一致性问题（自动，详见 cross-check.md）

| 类别 | 数量 | 根因 |
| --- | --- | --- |
| relationships activeEra 超出两端出场交集 | 28 | **episodes 语义未统一**：出场区间 vs 关系活跃期/叙事提及 两套口径混用 |
| 名场面集数超出相关角色出场区间 | 2 | 同上（s11 程真儿骨灰 ep14、s22 老陆遗愿 ep30） |
| 架构成员 person 不在角色表 | 0（初版误报 31 条已修正——架构用 person 字段关联，检查脚本已改） | — |

**核心建议（需人工决策）**：统一 `episodes` 字段语义——「严格在场出场区间」还是「叙事活跃区间（含被提及/遗物）」；二选一并同步修正 characters.json 与 relationships.activeEra。

## 三、事实核查结果

### 3.1 已确认（≥2 独立源，9 项）

| 断言 | 数据值 | 证据源 |
| --- | --- | --- |
| 全剧 46 集 | episodes=46 ✓ | 维基百科 + 爱奇艺接口 |
| 郑耀先=风筝（六哥） | ✓ | 维基 + 百度百科 |
| 韩冰=影子 | ✓ | 维基 + 百度知道 |
| 林桃=剃刀（中统特工、郑第一任妻） | ✓ | 维基 + 百度百科 |
| 陆汉卿**第 14 集**牺牲 | relationships activeEra=[10,33] ✗ | 腾讯视频分集标题 + 好看视频 + 网易 + 豆瓣 + 爱奇艺（Stage4 复核） |
| 程真儿**第 2 集**遇害 | scenes s02 ep=2 ✓ | 百度知道（2 条，跨关键词复核一致） |
| 曾墨怡第 1 集被捕牺牲 | scenes s01 ep=1 ✓ | 腾讯视频分集标题 + 电视猫 |
| 高占龙玫瑰饭店之死（宫庶枪杀） | scenes s04 ✓ | 电视猫 + 网易视频 |
| 程真儿=郑耀先恋人兼同志（地下党员） | characters ✓ | 百度百科词条 + 百度知道 |

### 3.2 需人工复核（未达成 ≥2 源 或 源矛盾）

| 项 | 当前值 | 争议 |
| --- | --- | --- |
| 程真儿演员 | 张萍（data） | 百度百科=张萍 vs 维基=冷玮，2 权威源矛盾；Agent 倾向张萍（百度百科专条+data 一致）**非定论** |
| 陆汉卿演员 | 雷汉（data） | 未取得独立源 |
| 程真儿 episodes=[1,5] | 过宽/过窄两不靠 | 严格出场=[1,2]；含骨灰叙事=[1,14]；需人工定语义 |
| scenes s11 ep=14（程真儿骨灰撒海） | ep=14 | 剧情逻辑自洽（毛人凤登场逼郑），无独立分集源 |
| scenes s22 ep=30（与老陆同葬遗愿） | ep=30 | 与陆汉卿 ep14 牺牲不矛盾（晚年遗愿场景），无独立分集源 |
| 46 集分集标题全表 | — | 豆瓣/百科反爬、电视猫混排，需人工以官方平台列表核对 |

### 3.3 数据错误候选（强源否定，建议修正——**未改数据，待授权**）

| file | 当前值 | 建议修正 | 证据 |
| --- | --- | --- | --- |
| relationships.json zheng-yaoxian→lu-hanqing activeEra | [10,33] | [2,14] | 陆汉卿第 14 集牺牲（6 源） |
| relationships.json tian-hu→lu-hanqing activeEra | [10,33] | ≤[2,14] | 同上 |
| relationships.json lu-hanqing→cheng-zhener activeEra | [6,26] | ≤[2,14] | 陆汉卿 14 集 + 程真儿 2 集 |
| characters.json cheng-zhener episodes | [1,5] | [1,2] 或 [1,14] | 第 2 集遇害（2 源） |

## 四、统计

- 事实单元核查数：32（重点高风险项）
- 已确认：9｜待补证：2｜存疑/需人工：17｜数据错误候选：4
- 结构性 error：0｜跨文件冲突：31（28 activeEra + 2 名场面 + 1 语义）
- 台词 57 条 / 名场面 37 条 / 时间线 43 条：**逐条外部核查未完成**（外部源限制）→ 全部归入「需人工/待补证」，未作任何"应该是对的"式推定

## 五、给用户的下一步

1. **必须人工定夺**：
   - `episodes` 字段语义统一（出场 vs 叙事活跃）→ 决定后我按统一语义批量修正 characters/relationships activeEra（30+ 处）
   - 程真儿演员（张萍/冷玮）——建议以官方片尾演员表为准
   - 陆汉卿演员（雷汉）核实
2. **若授权修正数据**（建议 PR 范围）：
   - 3.3 四条 activeEra/episodes 修正（高置信）
   - 语义统一后的批量调整（依赖第 1 项决策）
3. **人工核对建议**：以腾讯/爱奇艺官方 46 集分集标题为准，逐集核对 episodes.json 标题与年代（我可提供逐集清单模板）

## 附：审计产物

- `reports/struct-check.md`（Stage 1）
- `reports/cross-check.md`（Stage 2，31 冲突明细）
- `reports/fact-check.md`（Stage 3）
- `reports/fact-check-recheck.md`（Stage 4）
- 可复用脚本：`scripts/verify-struct.cjs`、`scripts/verify-content.cjs`（只读，不改数据）
