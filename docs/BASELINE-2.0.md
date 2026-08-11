# BASELINE · 2.0 升级基线快照

> 生成时间：2026-08-11 · HEAD：1610239 · 用途：2.0 工程化升级的起点对照

## 依赖规模

| 依赖 | 版本 | 用途 |
| --- | --- | --- |
| vue | ^3.4.38 | 框架 |
| vue-router | ^4.4.3 | 路由 |
| vue-i18n | 无 | G4 缺口 |
| gsap | ^3.12.5 | 动画 |
| echarts | ^5.5.1 | 仅 TimelineView 统计图（保留勿删） |
| lucide-vue-next | — | 图标 |
| tailwindcss | ^3.4 | 样式 |

## 构建体积（1610239 基线，npm run build）

| 产物 | 体积 |
| --- | --- |
| 首屏 JS（index+vendor+gsap） | ≈138KB gzip |
| echarts chunk | ≈509KB raw / ≈170KB gzip（懒加载） |
| dist 总体积 | ≈2.86MB |

## 数据规模

| 数据 | 规模 |
| --- | --- |
| characters.json | 30 角色 |
| relationships.json | 30 节点 / 67 边（含 type/strength/tone/directed/secret/activeEra/evidence/centrality） |
| episodes.json | 46 集 |
| scenes.json | 37 名场面（**全部指向缺失的 scene.svg** —— G7 真 bug） |
| quotes.json | 57 句台词 |
| history.json / architecture.json / timeline.json | 各档案视图数据 |

## 已知缺口（2.0 待办，对应 Workstream）

- G1 版本 1.0.0 → 2.0.0（A）
- G2 sitemap/robots 占位域名（B）
- G3 Google Fonts 外链（C）
- G4 无 i18n（D）
- G5 无 TypeScript（E）
- G6 无体积门禁（F）
- G7 scene.svg 缺失破图（H）
- G8 搜索弱（J）
- G9 无数据校验（G）
