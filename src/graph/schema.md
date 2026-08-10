# 图谱数据契约 · schema.md

> 唯一事实源：`src/data/relationships.json` + `src/data/characters.json`
> 统一访问：`src/graph/useGraphData.js`（图谱/筛选/搜索/路径/档案卡/洞察面板全部经由它，禁止直接读 JSON）
> 本契约是各层（引擎/视觉/交互/叙事）的字段规范。新增字段必须同步本文件。

## nodes（节点）

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | string | ✅ | 唯一标识（与 characters.json id 一致） |
| `name` | string | ✅ | 显示名 |
| `code` | string/null | ✅ | 代号（风筝/影子/剃刀…） |
| `faction` | enum | ✅ | junton / zhongtong / underground / gongan / civilian |
| `x` / `y` | number 0-100 | ✅ | 手绘坐标（王牌视图默认布局） |
| `role` | string | + | 身份一句话（军统王牌特工 / 中共卧底…） |
| `key` | enum/null | + | 'kite'（风筝轴）/ 'shadow'（影子轴）/ null |
| `aliases` | string[] | + | 别名（与 characters.json aliases 同步） |
| `centrality` | number | 脚本 | 度数中心性（computeMetrics 预计算，驱动尺寸/排序） |
| `episodes` | [first,last] | ✅ | 出场集数范围（来自 characters.json） |

## links（关系边）

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `source` / `target` | string | ✅ | 节点 id（无向语义；有向时 source→target） |
| `label` | string | ✅ | 关系名（一生之敌·晚年伴侣…） |
| `type` | enum | ✅ | enemy / superior / family / love / comrade / partner |
| `strength` | number 1-5 | ✅ | 关系强度（驱动线宽/物理） |
| `tone` | -1/0/1 | ✅ | 情感极性（敌/中性/亲） |
| `directed` | boolean | + | 方向语义（上线→下属、密令、审讯等有向） |
| `activeEra` | [a,b] | + | 关系活跃集数区间（时间演化精度；默认=两端出场交集） |
| `secret` | boolean | + | 秘密关系（解密模式遮蔽对象） |
| `evidence` | string | + | 一句剧情佐证（档案卡/洞察面板引用） |

## 派生数据（computeMetrics.js 预计算，随 useGraphData 暴露）

- `degree`：每节点度数（全图 / 当前筛选两档）
- `betweenness`：介数中心性（BFS 近似，稀疏图足够）
- `factionSpread`：阵营分布（节点数 / 边数）
- `commonNeighbors(a,b)`：共同邻居（洞察面板「共同联系人」）
- `shortestPath(a,b)`：无权 BFS 最短路径（路径模式）

## 兼容规则

- 旧字段（type/strength/tone/label）为必填主键；新字段缺省时有安全回退（见 useGraphData 的 normalize）。
- 任何消费方不得假设字段存在：一律经 `useGraphData` 的 `normalize` 层取值。
