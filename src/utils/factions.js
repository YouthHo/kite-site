// 阵营基础信息（全站共享）
export const FACTION = {
  junton: { label: '军统', color: '#b91c1c' },
  zhongtong: { label: '中统', color: '#8c4a2f' },
  underground: { label: '地下党', color: '#2f4a4f' },
  gongan: { label: '公安', color: '#3d3d3d' },
  civilian: { label: '平民', color: '#8a7355' },
}

export const factionColor = (f) => FACTION[f]?.color || '#555048'
export const factionLabel = (f) => FACTION[f]?.label || f || '—'
