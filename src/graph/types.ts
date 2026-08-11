/**
 * 图谱数据强类型（对应 src/graph/schema.md 契约）
 * 2.0 · E：数据层类型化先行，消费方逐步接入
 */

/** 阵营枚举 */
export type FactionKey = 'junton' | 'zhongtong' | 'underground' | 'gongan' | 'civilian'

/** 关系类型枚举 */
export type LinkType = 'enemy' | 'superior' | 'family' | 'love' | 'comrade' | 'partner'

/** 情感极性 */
export type Tone = -1 | 0 | 1

/** 关键轴 */
export type KeyAxis = 'kite' | 'shadow' | null

/** 图谱节点（normalize 后的强类型形态） */
export interface NodeDatum {
  id: string
  name: string
  code: string | null
  faction: FactionKey
  x: number
  y: number
  role: string
  key: KeyAxis
  aliases: string[]
  centrality: number
  episodes: [number, number]
}

/** 图谱关系边（normalize 后的强类型形态） */
export interface LinkDatum {
  source: string
  target: string
  label: string
  type: LinkType
  strength: number // 1-5
  tone: Tone
  directed: boolean
  secret: boolean
  evidence: string
  activeEra: [number, number]
}

/** 派生指标 */
export interface GraphMetrics {
  nodes: number
  edges: number
  factions: number
  top: string
}

/** 最短路径结果 */
export interface PathResult {
  ids: string[]
  hops: number
  pairs: string[]
}

/** 原始 JSON 节点（schema.md 兼容读取前的形态，字段可缺省） */
export interface RawNodeDatum {
  id: string
  name: string
  code?: string | null
  faction: FactionKey
  x?: number
  y?: number
  role?: string
  key?: KeyAxis
  aliases?: string[]
  centrality?: number
  episodes?: [number, number]
}

/** 原始 JSON 边 */
export interface RawLinkDatum {
  source: string
  target: string
  label: string
  type?: LinkType
  strength?: number
  tone?: Tone
  directed?: boolean
  secret?: boolean
  evidence?: string
  activeEra?: [number, number]
}
