// 阵营基础信息（全站共享）
export const FACTION = {
  junton: { label: '军统', color: '#9d2235' },
  zhongtong: { label: '中统', color: '#7d3b52' },
  underground: { label: '地下党', color: '#1e4a52' },
  gongan: { label: '公安', color: '#3d3d3d' },
  civilian: { label: '平民', color: '#8b7355' },
}

export const factionColor = (f) => FACTION[f]?.color || '#555048'
export const factionLabel = (f) => FACTION[f]?.label || f || '—'
