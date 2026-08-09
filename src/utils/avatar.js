// 头像工具：真实照片缺失时生成阵营色字母头像（SVG data URI）
const FACTION_COLOR = {
  junton: '#9d2235',
  zhongtong: '#7d3b52',
  underground: '#1e4a52',
  gongan: '#3d3d3d',
  civilian: '#8b7355',
}

export function avatarUri(id, name, faction, size = 240) {
  const color = FACTION_COLOR[faction] || '#555048'
  const ch = (name || '?').slice(0, 2)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<rect width="${size}" height="${size}" fill="${color}"/>` +
    `<rect width="${size}" height="${size}" fill="url(#g)" opacity="0.55"/>` +
    `<defs><radialGradient id="g" cx="0.5" cy="0.38" r="0.95">` +
    `<stop offset="0" stop-color="#ffffff" stop-opacity="0.32"/><stop offset="1" stop-color="#000000" stop-opacity="0.6"/>` +
    `</radialGradient></defs>` +
    `<text x="${size / 2}" y="${size * 0.62}" text-anchor="middle" font-family="'Noto Serif SC',serif" font-size="${size * 0.38}" fill="#f0e6d2">${ch}</text>` +
    `<rect x="${size * 0.15}" y="${size * 0.82}" width="${size * 0.7}" height="${Math.max(2, size * 0.012)}" fill="#e8dcc8" opacity="0.35"/>` +
    `</svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

/** 是否真实照片（本地公版图/真实源；picsum 占位不算） */
export function isRealPhoto(url) {
  return !!url && !String(url).includes('picsum.photos')
}
