# CHANGELOG

## [2.0.0] - 2026-08-11

工程化代际升级：从「手搓展示站」重构为「可维护、可验证、可多语言、可离线、类型安全、内容有正确性保障的工程化内容平台」。

### 新增

- **数据正确性门禁**：`scripts/validate-data.cjs`（schema/交叉引用/破图/占位域名/一致性校验）+ `scripts/check-bom.cjs`（BOM 检测），接入 `prebuild` 与三条 CI
- **占位域名环境化**：`scripts/gen-sitemap.cjs` 由 `VITE_SITE_URL` 生成 sitemap/robots，零占位域名
- **字体自托管**：@fontsource 本地 woff2，删除 Google Fonts 外链，离线可用
- **名场面原创视觉**：`SceneCard.vue` CSS/SVG 构图卡替代缺失照片依赖，零破图、零版权风险
- **构建体积门禁**：`scripts/perf-check.cjs`（首屏 JS ≤200KB gzip、单 chunk ≤250KB），超限构建失败
- **图谱可分享状态**：mode/筛选/相机编码进 URL query，刷新与分享可还原
- **图谱导出**：工具条导出 PNG/SVG

### 变更

- 版本号 1.0.0 → 2.0.0

### 保留（勿动）

- 三条 CI（GitHub Pages / Vercel / Cloudflare Pages）
- `vite.config.js` 的 `VITE_BASE` 多路径逻辑
- echarts 依赖（TimelineView 统计图）
- 双主题 + prefers-reduced-motion 全部既有能力
