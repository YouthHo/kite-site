# 风筝 The Kite · 影视专题站

> 《风筝》（柳云龙执导，2017）观众专属影视资料站 —— 电影级谍战沉浸体验，信仰至上，半生潜伏。

纯静态 · Vue 3 + Vite + Tailwind CSS v3 + GSAP + ECharts，构建后 `dist/` 可直接部署到任意静态托管平台。

## 功能总览

| 页面 | 路由 | 核心内容 |
| --- | --- | --- |
| 首页 | `/` | 电影级开场：Ken Burns 主视觉、标题模糊入场、金色细线展开、8 个功能入口、电报码装饰 |
| 人物关系图谱 | `/graph` | ECharts 动态图谱：节点爆炸式入场、连线光点流动、阵营筛选、搜索、点击弹出档案卡 |
| 角色档案库 | `/characters` | 29 人档案，按阵营分组，含结局防剧透锁、台词、关联人物、出场集数标签云 |
| 演员阵容 | `/cast` | 16 位演员卡片墙（黑白→彩色 hover），详情面板 + 角色/演员照拖动对比 |
| 分集剧情 | `/episodes` | 46 集完整剧情，集数导航（进度锁），档案纸质感详情页，上下集跳转 |
| 全剧时间线 | `/timeline` | 横向长卷轴（ScrollTrigger 钉住滚动），44 个节点，五段分区，真实历史标注，ECharts 统计 |
| 势力架构 | `/architecture` | 军统/中统/中共三方树形架构，逐层展开动画，节点弹窗 |
| 历史背景 | `/history` | 四类真实历史档案卡片，可展开，重要术语高亮 |
| 名场面与台词 | `/scenes` | 37 个名场面瀑布流 + 灯箱，57 句经典台词卡片（复制功能） |

全站通用：首屏解密加载动画、胶片颗粒、扫描线、自定义滚动条、全局搜索、观剧进度锁（localStorage 持久化）、分享按钮、返回顶部、路由红色进度条、页面切换过渡。

## 技术栈

- **框架** Vue 3（`<script setup>`）+ Vue Router 4（history 模式，路由懒加载）
- **样式** Tailwind CSS v3 + SCSS（自定义滚动条、颗粒、扫描线、档案装饰等）
- **动画** GSAP 3 + ScrollTrigger（页面入场、滚动触发、视差、钉住横向滚动、打字机等）
- **图谱** ECharts 5（人物关系图、年代统计）
- **图标** lucide-vue-next
- **数据** 全部 JSON 存于 `src/data/`，共 9 个文件

## 项目结构

```
kite-site/
├── index.html               # SEO 元信息 + 字体预加载 + 内联首屏样式
├── package.json
├── vite.config.js           # 手动分包：gsap / echarts / vendor
├── tailwind.config.js       # 视觉设计系统（颜色/字体/极简动画）
├── postcss.config.js
├── vercel.json              # SPA 路由回退 + 静态资源缓存
├── netlify.toml             # 同上（Netlify）
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── sitemap.xml          # 部署前把 kite.example.com 换成你的域名
└── src/
    ├── main.js              # 全局注册 GSAP + ScrollTrigger
    ├── App.vue              # 进度条 / NavBar / 页脚 / 全局组件
    ├── router/index.js      # 9 条路由，懒加载
    ├── store/app.js         # 观剧进度（localStorage）+ 搜索开关
    ├── utils/anim.js        # 动画工具集（错落入场/滚动浮现/打字机/视差…）
    ├── styles/main.scss     # 全局视觉系统
    ├── data/                # ★ 9 个 JSON 数据文件（内容均基于真实剧集）
    │   ├── characters.json    # 29 个人物
    │   ├── actors.json        # 16 位演员
    │   ├── episodes.json      # 46 集分集剧情
    │   ├── relationships.json # 图谱节点（坐标）+ 40 条关系
    │   ├── timeline.json      # 44 个时间节点（剧情 + 真实历史）
    │   ├── architecture.json  # 三方势力树（31 节点）
    │   ├── history.json       # 4 类历史档案
    │   ├── quotes.json        # 57 句台词
    │   └── scenes.json        # 37 个名场面
    ├── components/          # 16 个组件
    └── views/               # 9 个页面
```

## 快速开始

```bash
npm install
npm run dev        # 开发：http://localhost:5173
npm run build      # 构建：输出 dist/
npm run preview    # 本地预览构建产物
```

## 部署

### Vercel（推荐，5 分钟）

1. 把项目推到 GitHub
2. vercel.com → New Project → 导入仓库（框架选 Vite，其余默认）
3. 完成。`vercel.json` 已内置 SPA 回退与缓存头

### Netlify

1. 推送到 GitHub/GitLab
2. app.netlify.com → Add new site → Import
3. Build command 填 `npm run build`，Publish directory 填 `dist`
4. `netlify.toml` 已就绪

### 任意静态托管 / 自有服务器（Nginx 示例）

```bash
npm run build
# 将 dist/ 上传到服务器，如 /var/www/kite
```

```nginx
server {
  listen 80;
  server_name kite.example.com;
  root /var/www/kite;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }   # history 路由回退
  location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
}
```

> 注意：`sitemap.xml` / `robots.txt` 中的 `kite.example.com` 部署前请替换为你的真实域名。

## 图片替换指南（占位图）

当前全部图片使用 picsum.photos 占位（暗角/黑白滤镜由 CSS 统一处理，替换后观感一致）。需要替换的位置：

| 位置 | 推荐尺寸 | 文件/字段 |
| --- | --- | --- |
| 首页主视觉 | 1920×1080 | `HomeView.vue` 中的 hero `<img>` |
| 人物头像 | 600×800（竖） | `src/data/characters.json` → `image` 字段 |
| 演员照片 | 600×800（竖） | `src/data/actors.json` → `image` 字段 |
| 剧集剧照 | 960×540（横） | `src/data/episodes.json` → `image` 字段 |
| 名场面 | 800×500（横） | `src/data/scenes.json` → `image` 字段 |
| 历史配图 | 800×450（横） | `src/data/history.json` → `image` 字段 |

建议正式素材放 `public/images/` 并改用相对路径（如 `/images/zyx.jpg`）。

## 内容准确性说明

- 全部剧情、人物、演员、台词基于公开资料整理：百度百科《风筝》词条、电视猫剧情页、豆瓣、知乎/贴吧台词整理等（见数据文件 `source` 字段）。
- 台词中说话人归属以公开整理稿为准，个别角色归属存在不同版本流传，已在 `quotes.json` 保留原文。
- 已知缺口：曾墨怡、高占龙、江万朝、冷眉珊、坚冰等配角的饰演者未能从公开渠道核实，`actor` 字段留空并显示"待考"，欢迎补充。
- 剧照均为占位图，非真实剧照；本站为非官方粉丝站，内容仅供学习交流。

## 自定义指南

- **改颜色/字体**：`tailwind.config.js` 的 `theme.extend`（色板注释完整）
- **改文案**：数据都在 `src/data/*.json`，改 JSON 即可
- **改动画**：`src/utils/anim.js` 集中了入场/滚动/打字机等工具；页面内 GSAP 调用均有注释
- **观剧进度锁阈值**：`EpisodesView.vue` 的 `lockThreshold`（默认前 8 集免费）

## 性能与兼容

- 路由懒加载 + GSAP/ECharts/vendor 手动分包
- 图片 `loading="lazy"` + 模糊→清晰过渡
- 移动端：汉堡菜单、上下布局、图谱 `roam` 手势缩放、简化动画（`prefers-reduced-motion` 全部降级为淡入）
- 浏览器：现代 Chrome/Edge/Firefox/Safari；字体走 Google Fonts（国内部署建议自托管 `Noto Serif SC`，见 `index.html` 注释）

## 免责声明

本站为粉丝自制资料站，与剧组及播出平台无任何关联。所有商标与剧集素材版权归权利人所有，如涉侵权请联系删除。
