// 大小写敏感校验：模拟 Linux 解析，检查 src 下所有 import/import() 引用
// 防止 "本地 Windows 能构建、Vercel Linux 失败" 的文件名大小写问题
// 用法: node scripts/check-case.js（已挂到 package.json 的 prebuild）
const fs = require('fs');
const path = require('path');

const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p);
    else if (/\.(vue|js|json|scss)$/.test(f)) files.push(p);
  }
})(path.join('src'));

const fileset = new Set(files.map((f) => f.split(path.sep).join('/')));
let bad = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const re = /(?:from\s+|import\s*\()\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src))) {
    const spec = m[1];
    if (!spec.startsWith('.') && !spec.startsWith('@/')) continue;
    const base = spec.startsWith('@/') ? path.join('src') : path.dirname(f);
    const rel = spec.startsWith('@/') ? spec.slice(2) : spec;
    const target = path.join(base, rel).split(path.sep).join('/');
    // 目录级引用（如 ./router）交给 vite 解析
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) continue;
    const resolvable =
      fileset.has(target) ||
      ['.js', '.vue', '.json'].some((ext) => fileset.has(target + ext)) ||
      fileset.has(target + '/index.js');
    if (!resolvable) {
      console.error('CASE MISMATCH:', f, '->', spec);
      bad++;
    }
  }
}
if (bad > 0) {
  console.error('\n共 ' + bad + ' 处 import 与文件名大小写不一致（Linux/Vercel 会构建失败），请修正后重试。');
  process.exit(1);
}
console.log('check-case: OK (' + files.length + ' files)');
