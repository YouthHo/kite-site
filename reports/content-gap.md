# 内容缺口报告（3.0 S2-U2 数据作者任务清单）

> 日期：2026-08-13 · 原则：默认只读不改数据；以下字段/内容均需经五重确认后由人工授权写入。

## S2 · 资料深度（现有 JSON 增字段）

| 文件 | 建议字段 | 说明 |
| --- | --- | --- |
| characters.json | `era` | 活跃年代区间（如 1946-1980）——可与现有 episodes 推导，需人工核 |
| characters.json | `factionHistory` | 阵营沿革简述（郑耀先：军统→公安档案科） |
| characters.json | `keyEpisodes` | 关联剧集 id 数组（角色核心集）——**部分可从 scenes/quotes 反推，需人工定边界** |
| characters.json | `relationshipNarrative` | 与核心人物关系叙事（现有 relationships.evidence 可迁移） |
| characters.json | `representativeQuotes` | 关联 quotes id（可从 quotes.character 反推 ✓ 工程可自动） |
| characters.json | `archetype` | 原型注释（虚构/灵感来源，不得编造真实人物） |
| episodes.json | `synopsis/appearances/keyScenes/quotes/historicalContext/trivia` | 分集详情——**46 集逐集人工编写，最大缺口** |

## T2 · 新内容类型（新增 JSON + View）

| 类型 | 内容 | 状态 |
| --- | --- | --- |
| glossary.json | 军统/中统/地下党/延安/保密局/风筝/代号等术语 | 公版史实，可整理 |
| orgs.json | 阵营组织百科（含关键人物 id、徽记 id） | 现有 architecture.json 可扩展 |
| essays.json | 信仰/潜伏/身份/父子主题原创解读 | 纯原创观点，标注"解读" |
| timeline-events.json | 真实历史事件锚点 | **timeline.json 已有 18 条 history 节点，可迁移** |

## U2 · 交叉链接（工程侧可自动）

- `getCharacterEpisodes(id)`：从 scenes/quotes 反推出场集 ✓ 可自动生成
- `getSceneContext(id)` / `getQuoteSource(id)`：数据已有引用关系 ✓
- 各 View「关联区块」：工程框架就位，数据齐后自动渲染

## 工程侧已就绪（无需数据）

- TimelineView 双轴对照筛选（F3）已实现：全部/剧情线/史实线
- 档案卡「进入剧集 →」漫游链（V2 基础）
- reader.css 阅读模式待挂载（需文章类内容）

## 建议优先级

1. 高：episodes 分集详情（46 集，工作量最大，建议人工分批）→ 解锁 F2 阅读模式
2. 中：glossary/orgs（公版资料，AI 整理 + 人工审核）
3. 低：essays（原创解读，内容作者任务）
