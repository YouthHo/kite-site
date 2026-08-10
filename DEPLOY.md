# 自动部署说明

推送到 `master` 分支后，三条部署流水线会并行触发。未配置凭据的平台会自动跳过，不会让 CI 变红。

| 平台 | 工作流 | 访问路径 | 需要的凭据 |
| --- | --- | --- | --- |
| GitHub Pages | `.github/workflows/deploy-github-pages.yml` | `/kite-site/` 子路径 | 无（仅需在仓库开启 Pages） |
| Vercel | `.github/workflows/deploy-vercel.yml` | 根路径 `/` | 3 个 Secrets |
| Cloudflare Pages | `.github/workflows/deploy-cloudflare-pages.yml` | 根路径 `/` | 2 个 Secrets |

---

## 一、GitHub Pages

只需一次性设置：

1. 仓库 → **Settings** → **Pages**
2. **Build and deployment → Source** 选择 **GitHub Actions**

之后每次推送自动构建部署，地址为 `https://<用户名>.github.io/kite-site/`。

**为什么要区分 base**：GitHub Pages 项目站点跑在 `/kite-site/` 子路径下，
而 Vercel / Cloudflare 在根路径。工作流会按仓库名自动注入 `VITE_BASE`，
构建脚本据此改写全部静态资源路径，无需手动改代码。

本地复现该构建：

```bash
npm run build:gh          # 等价于 VITE_BASE=/kite-site/ npm run build
```

## 二、Vercel

在仓库 **Settings → Secrets and variables → Actions** 添加：

| Secret 名 | 获取方式 |
| --- | --- |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | 项目根目录执行 `npx vercel link` 后，见 `.vercel/project.json` 的 `orgId` |
| `VERCEL_PROJECT_ID` | 同上文件的 `projectId` |

> 如果你更习惯 Vercel 官方的 Git 集成（在 Vercel 后台直接 Import 仓库），
> 那就**不要**配置上面的 Secrets，工作流会自动跳过，避免重复部署。

## 三、Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages** → 创建一个 Pages 项目，
   项目名建议直接用 `kite-site`（与仓库同名，工作流默认取仓库名）。
2. 在仓库 Secrets 添加：

| Secret 名 | 获取方式 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | My Profile → API Tokens → 使用 **Cloudflare Pages: Edit** 模板创建 |
| `CLOUDFLARE_ACCOUNT_ID` | Dashboard 右侧栏 / 概览页可见 |

如果 Pages 项目名与仓库名不同，在 **Settings → Secrets and variables → Actions →
Variables** 里加一个仓库变量 `CLOUDFLARE_PROJECT_NAME` 指定即可。

---

## SPA 路由回退机制

本站用 `createWebHistory`，深链接（如 `/graph`）必须由服务端回退到入口 HTML，
三个平台各自的方案已经就位：

- **GitHub Pages** — 构建时自动把 `index.html` 复制为 `404.html`（`vite.config.js` 中的 `spa-fallback-404` 插件）
- **Vercel** — `vercel.json` 的 `rewrites` 规则
- **Cloudflare Pages** — `public/_redirects`（`/* /index.html 200`）

缓存策略由 `public/_headers`（Cloudflare/Netlify）和 `vercel.json`（Vercel）
分别声明：带指纹的 `/assets/*` 长期强缓存，入口 HTML 不缓存。

## 遗留待办

- `public/sitemap.xml` 中的域名仍是占位符 `https://kite.example.com`，
  确定正式域名后需替换。
- `dist_bak/` 是历史构建备份且已被 Git 追踪，确认无用后可以删除以减小仓库体积。
