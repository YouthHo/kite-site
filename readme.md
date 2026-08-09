# 风筝 The Kite · 影视专题站

> 《风筝》（柳云龙执导，2017）观众专属影视资料站 —— 电影级谍战沉浸体验，信仰至上，半生潜伏。
> 本仓库采用 **CC BY-NC 4.0（署名-非商业性使用）** 许可，详见 [LICENSE.md](LICENSE.md)。

纯静态 · Vue 3 + Vite + Tailwind CSS v3 + GSAP + ECharts，构建后 `dist/` 可直接部署到任意静态托管平台。

## 功能总览

| 页面 | 路由 | 核心内容 |
| --- | --- | --- |
| 首页 | `/` | 电影级开场：历史影像主视觉（Ken Burns）、标题模糊入场、金色细线、入口卡片、悬停浮现的分享栏 |
| 人物关系图谱 | `/graph` | ECharts 图谱：名字徽章节点、连线关系标签、阵营筛选 + **人物自由勾选 + 全选/全不选**、**四种排序**（阵营/姓名拼音/代号/出场）、独立缩放控件 |
| 角色档案库 | `/characters` | 29 人档案，按阵营分组且**可折叠**（全部展开/收起），结局防剧透锁，关联人物显示关系 |
| 演员阵容 | `/cast` | 16 位演员统一多彩名字卡，详情面板含角色照位 |
| 分集剧情 | `/episodes` | 46 集详细剧情（每集 7-9 句还原细节），档案纸质感，进度锁 |
| 全剧时间线 | `/timeline` | 横向长卷轴：剧情上行/历史下行，节点点亮，五段分区（带年份），ECharts 统计 |
| 势力架构 | `/architecture` | 军统/中统/中共三方树形图，徽章节点，主题自适应 |
| 历史背景 | `/history` | 四类真实历史牛皮纸档案卡（可展开，互斥切换） |
| 名场面与台词 | `/scenes` | 37 名场面瀑布流 + 灯箱，57 句台词卡片（复制） |

全站通用：**深色胶片 / 浅色档案纸双主题**（导航栏太阳/月亮一键切换）、首屏解密加载（每会话一次）、胶片颗粒、扫描线、全局搜索、观剧进度锁（localStorage）、自定义滚动条、红印章装饰、返回顶部。

## 技术栈

- **框架** Vue 3（`<script setup>`）+ Vue Router 4（history 模式，路由懒加载 + 空闲预热）
- **样式** Tailwind CSS v3 + SCSS；浅色主题由 `scripts/gen_theme_css.py` 生成映射（`src/styles/theme-light.css`）
- **动画** GSAP 3 + ScrollTrigger（入场、滚动触发、钉住横向滚动、打字机等）
- **图谱** ECharts 5（人物关系图、年代统计，随主题换色）
- **图标** lucide-vue-next
- **数据** 9 个 JSON 文件存于 `src/data/`

## 项目结构

```
kite-site/
├── index.html               # SEO 元信息 + 主题预执行脚本（防闪烁）
├── package.json             # license: CC-BY-NC-4.0
├── vite.config.js           # 手动分包：gsap / echarts / vendor
├── tailwind.config.js       # 视觉设计系统
├── vercel.json / netlify.toml / public/robots.txt / public/sitemap.xml
├── LICENSE.md               # CC BY-NC 4.0 非商用许可
├── scripts/
│   ├── check-case.cjs       # prebuild 大小写校验（防 Linux 构建失败）
│   ├── gen_theme_css.py     # 浅色主题映射生成器
│   └── fetch_*.py           # Wikimedia 图片抓取工具
└── src/
    ├── main.js / App.vue / router / store / utils / styles
    ├── data/                # ★ 9 个 JSON 数据文件
    └── components/ views/   # 19 个组件 + 9 个页面
```

## 快速开始

```bash
npm install
npm run dev        # 开发：http://localhost:5173
npm run build      # 构建（含大小写校验）：输出 dist/
npm run preview    # 本地预览构建产物
```

## 部署

- **Vercel**：导入仓库即部署（`vercel.json` 已内置 SPA 回退与缓存头）
- **Netlify**：Build `npm run build`、Publish `dist`（`netlify.toml` 已就绪）
- **自有服务器**：`dist/` 全量上传 + Nginx `try_files $uri $uri/ /index.html`
- 部署前把 `public/sitemap.xml`、`robots.txt` 里的 `kite.example.com` 换成真实域名

## 版权与许可（重要）

- **本站原创内容**（页面、设计、整理文案）：CC BY-NC 4.0 —— 可自由分享、演绎，**禁止商用**，须署名。完整条款见 LICENSE.md。
- **《风筝》剧集内容**（剧情、人物、台词）：版权归权利人所有，本站为基于公开资料的事实性整理，仅供学习交流。
- **图片来源**：站内真实照片来自 Wikimedia Commons / Wikipedia（公共领域或自由许可），主要为历史人物照（戴笠、毛人凤、周恩来、徐恩曾）与历史影像（重庆大轰炸、延安 1938）。**署名与许可信息**：
  - `hist_戴笠.jpg` / `hist_mao_renfeng.jpg` / `hist_周恩来.jpg` / `hist_徐恩曾.jpg` / `hist_yanan.jpg` / `hist_chongqing_bombing.jpg` / `actor_li_xiaoran.jpg` / `actor_zhang_meng.jpg`：Wikimedia Commons，许可见各文件页（多为公共领域或 CC BY-SA），如需正式使用请按 Wikimedia 页面要求署名。
  - 其余图片（剧照、名场面）为占位图，正式上线前请替换为授权素材。

## 图片替换指南

| 位置 | 推荐尺寸 | 文件/字段 |
| --- | --- | --- |
| 人物头像/剧照位 | 600×800（竖） | `src/data/characters.json` → `image` |
| 演员照片 | 600×800（竖） | `src/data/actors.json` → `image` |
| 剧集剧照 | 960×540（横） | `src/data/episodes.json` → `image` |
| 名场面 | 800×500（横） | `src/data/scenes.json` → `image` |
| 历史配图 | 800×450（横） | `src/data/history.json` → `image` |

素材放入 `public/images/` 后改 JSON 路径即可。图谱中无真实照片的人物自动显示阵营色名字徽章。

## 内容准确性说明

- 剧情、人物、演员、台词基于百度百科、电视猫、szjqz.net 分集剧情、豆瓣、知乎等公开资料整理（数据文件保留 `source` 字段）。
- 分集剧情为多源交叉整理的详细版（每集约 7-9 句），个别细节不同渠道存在版本差异，以剧集本身为准。
- 已知缺口：曾墨怡、高占龙、江万朝、冷眉珊、坚冰等配角饰演者未能从公开渠道核实，`actor` 字段显示"待考"。

## 自定义指南

- **改颜色/字体**：`tailwind.config.js` + `src/styles/main.scss`（浅色映射改 `scripts/gen_theme_css.py` 后重新生成）
- **改文案/数据**：`src/data/*.json`
- **改动画**：`src/utils/anim.js` 集中工具 + 各页面 GSAP 调用
- **观剧进度锁阈值**：`EpisodesView.vue` 的 `lockThreshold`
- **浅色主题**：`main.scss` 的 `[data-theme='light']` 块 + `theme-light.css`

## 质量与验证

- prebuild 自动执行 `check-case.cjs`（44 个源文件 import 大小写校验，防 Windows/Linux 差异）
- 已用 puppeteer + 真实 Chrome 做过导航、缩放、互斥展开、对比度审计等回归测试
- 浏览器：现代 Chrome/Edge/Firefox/Safari；移动端支持汉堡菜单、图谱手势缩放、动画降级（prefers-reduced-motion）

## 免责声明

本站为粉丝自制资料站，与剧组及播出平台无任何关联。所有商标与剧集素材版权归权利人所有，如涉侵权请联系删除。
