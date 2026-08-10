// GitHub Pages 专用构建入口
// 作用：注入子路径 base（项目站点地址为 https://<user>.github.io/<repo>/），
// 然后调用标准 build。跨平台可用（Windows / macOS / Linux）。
//
// 用法：
//   npm run build:gh                    # 默认 base = /kite-site/
//   GH_PAGES_BASE=/other/ npm run build:gh
const { spawnSync } = require('node:child_process');

// 优先取环境变量；CI 中由工作流按仓库名自动注入
const base = process.env.GH_PAGES_BASE || process.env.VITE_BASE || '/kite-site/';
const normalized = ('/' + base.replace(/^\/+|\/+$/g, '') + '/').replace(/\/{2,}/g, '/');

console.log('[build:gh] VITE_BASE =', normalized);

const r = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, VITE_BASE: normalized },
});

process.exit(r.status === null ? 1 : r.status);
