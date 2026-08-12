# Stage 1 · 结构静态校验报告

- HEAD: 55cdd18 audit(content): 内容正确性多重确认审计 — Stage1结构(0 error)+Stage2跨文件(31冲突:28 activeEra语义+2名场面+1架构修正后0)+Stage3外部核查(DDG+open-link实抓:9项已确认,含陆汉卿第14集牺牲/程真儿第2集遇害/郑耀先=风筝等)+Stage4换路径复核(2项升确认)+Stage5汇总CONTENT-AUDIT.md；4条数据错误候选(activeEra/episodes)建议修正未改数据；全部报告+可复用校验脚本
- 日期: 2026-08-12

## 结果：error=0 warn=2

| 文件 | 行 | 问题 | 严重度 |
| --- | --- | --- | --- |
| public/sitemap.xml | - | 含占位域名 kite.example.com（构建期由 VITE_SITE_URL 注入，本地默认值属预期） | warn |
| public/robots.txt | - | 含占位域名 kite.example.com（构建期由 VITE_SITE_URL 注入，本地默认值属预期） | warn |

## 规模快照
- relationships: 30 节点 / 67 边
- characters: 30 · quotes: 57 · scenes: 37