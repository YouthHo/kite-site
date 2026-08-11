import { TYPE_META, lightenHex } from './useGraphData'

/**
 * GraphEngine —— 自研 Canvas2D 关系图渲染引擎
 * 能力：无限平移 / 光标中心缩放 / 双指捏合 / DPR 自适应 / 命中测试 /
 *       可编程相机（fit/centerOn 缓动）/ 主题令牌重绘 / reduced-motion 静态模式 /
 *       风筝线边（悬链+摆动+电报脉冲）/ 印章节点 / 力导向模拟 / 演化出生动画
 */
export class GraphEngine {
  constructor(canvas, { getData, onNodeClick, onNodeHover, onDecrypt, prefersReduced = false }) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.getData = getData // () => useGraphData 返回值（含响应式 .value）
    this.onNodeClick = onNodeClick
    this.onNodeHover = onNodeHover
    this.onDecrypt = onDecrypt
    this.reduced = prefersReduced
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)

    this.cam = { x: 50, y: 50, scale: 6 }
    this.camTarget = null // 缓动目标 {x,y,scale}
    this.fitScale = 6 // fit 视图基准缩放：所有尺寸量 × (scale/fitScale)，保证 fit 时设计尺寸=屏幕像素、缩放时等比
    this.nodePos = new Map() // 拖拽/力模拟覆盖坐标
    this.hover = null
    this.drag = null // {id, ox, oy}
    this.pan = null // {sx, sy, cx, cy}
    this.pinch = null // {d0, c0x, c0y, s0}
    this.pathResult = null
    this.focusNodeId = null
    this.focusClick = null // 点击聚焦：隔离自我网络
    this.decryptMode = false // 解密模式：初始遮蔽
    this.decrypted = new Set() // 已揭开节点
    this.hoverHighlight = true // C2：悬停高亮开关（默认开，关闭时悬停无任何高亮/强调/脉冲）
    this.appear = new Map() // id -> 出现时间戳
    this.vanish = new Map() // id -> 消失时间戳（残影淡出）
    this.lastIds = null // 上一帧可见节点集（diff 出消散）
    this.miniOn = true // mini-map 总览
    this.dragFollow = new Map() // 拖拽邻居跟随位移
    this.forceOn = false
    this.forceStep = 0
    this.raf = 0
    this.running = false
    this.tokens = null
    this.emitHover = null
    this._w = 0
    this._h = 0

    this._onPointerDown = (e) => this._pointerDown(e)
    this._onPointerMove = (e) => this._pointerMove(e)
    this._onPointerUp = (e) => this._pointerUp(e)
    this._onWheel = (e) => this._wheel(e)
    this._onLeave = () => {
      if (!this.pan && !this.drag) this._setHover(null)
    }
    this.pointers = new Map() // pointerId -> {x,y}（双指捏合跟踪）
    this.pinch = null // {dist, midX, midY, scale0, camX0, camY0}
    canvas.addEventListener('pointerdown', this._onPointerDown)
    canvas.addEventListener('pointermove', this._onPointerMove)
    window.addEventListener('pointermove', this._onPointerMove)
    window.addEventListener('pointerup', this._onPointerUp)
    window.addEventListener('pointercancel', this._onPointerUp)
    canvas.addEventListener('wheel', this._onWheel, { passive: false })
    canvas.addEventListener('pointerleave', this._onLeave)
    this.resize()
  }

  /* ================= 生命周期 ================= */
  resize() {
    const r = this.canvas.getBoundingClientRect()
    this._w = Math.max(1, r.width)
    this._h = Math.max(1, r.height)
    this.canvas.width = Math.round(this._w * this.dpr)
    this.canvas.height = Math.round(this._h * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.requestRender()
  }

  setTheme(light) {
    const edgeBase = (hex) => (light ? hex + '80' : hex + '8c') // 50%/55% 透明度
    this.tokens = {
      light,
      label: light ? 'rgba(60,52,40,0.95)' : 'rgba(235,225,205,0.95)',
      labelDim: light ? 'rgba(110,103,90,0.85)' : 'rgba(138,130,117,0.9)',
      labelBg: light ? 'rgba(250,244,231,0.92)' : 'rgba(12,12,12,0.82)',
      labelBorder: light ? 'rgba(60,52,40,0.15)' : 'rgba(255,255,255,0.12)',
      nodeBorder: light ? 'rgba(60,52,40,0.35)' : 'rgba(255,255,255,0.22)',
      nodeGlow: light ? '33' : '44',
      dimOpacity: 0.14,
      edge: Object.fromEntries(Object.entries(TYPE_META).map(([k, m]) => [k, edgeBase(m.color)])),
      edgeHover: '#b8860b',
      path: '#b8860b',
      focus: '#b8860b',
      sealKite: '#b8860b',
      sealShadow: '#d8475c',
    }
    this.requestRender()
  }

  start() {
    // 强制接管：取消可能挂起的一次性帧（如 fit 缓动触发的 requestRender），启动常驻循环
    cancelAnimationFrame(this.raf)
    this.running = true
    if (this.reduced) {
      this.render()
      this.running = false
      return
    }
    const loop = () => {
      if (!this.running) return
      this.render()
      this.raf = requestAnimationFrame(loop)
    }
    loop()
  }

  requestRender() {
    if (this.running || this.reduced) return
    this.running = true
    const once = () => {
      this.running = false
      if (this.reduced) {
        this.render()
        return
      }
      this.render()
    }
    this.raf = requestAnimationFrame(once)
  }

  dispose() {
    this.running = false
    cancelAnimationFrame(this.raf)
    this.canvas.removeEventListener('pointerdown', this._onPointerDown)
    this.canvas.removeEventListener('pointermove', this._onPointerMove)
    window.removeEventListener('pointermove', this._onPointerMove)
    window.removeEventListener('pointerup', this._onPointerUp)
    window.removeEventListener('pointercancel', this._onPointerUp)
    this.canvas.removeEventListener('wheel', this._onWheel)
    this.canvas.removeEventListener('pointerleave', this._onLeave)
  }

  /* ================= 公开控制 ================= */
  exportPNG() {
    // 导出当前画布为 PNG（2x DPR 高清）
    const out = document.createElement('canvas')
    out.width = this._w * 2
    out.height = this._h * 2
    const octx = out.getContext('2d')
    octx.fillStyle = this.tokens.light ? '#efe6d3' : '#0b0b0b'
    octx.fillRect(0, 0, out.width, out.height)
    octx.drawImage(this.canvas, 0, 0, out.width, out.height)
    return out.toDataURL('image/png')
  }

  exportSVG() {
    // 导出矢量快照（节点+边+标签，可缩放不失真）
    const d = this.getData()
    const ui = this.cam.scale / this.fitScale
    const nodes = d.visibleNodes.value
    const links = d.visibleLinks.value
    const w = this._w
    const h = this._h
    const posOf = (id) => {
      const n = d.byId[id]
      const p = this.nodePos.get(id) || { x: n.x, y: n.y }
      return this.worldToScreen(p.x, p.y)
    }
    const bg = this.tokens.light ? '#efe6d3' : '#0b0b0b'
    let body = `<rect width="${w}" height="${h}" fill="${bg}"/>`
    for (const l of links) {
      const a = posOf(l.source)
      const b = posOf(l.target)
      const meta = TYPE_META[l.type]
      const midX = (a.x + b.x) / 2
      const len = Math.hypot(b.x - a.x, b.y - a.y)
      const sag = Math.min(26, len * 0.12) * ui
      const cy = (a.y + b.y) / 2 + sag
      const dash = meta.dash ? ` stroke-dasharray="6 5"` : ''
      const opacity = this.tokens.light ? 0.5 : 0.55
      body += `<path d="M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${midX.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}" fill="none" stroke="${meta.color}" stroke-width="${(0.8 + l.strength * 0.4).toFixed(1)}" opacity="${opacity}"${dash}/>`
    }
    for (const n of nodes) {
      const p = posOf(n.id)
      const r = nodeRadius(n) * ui
      const color = d.FACTION[n.faction]?.color || '#555048'
      body += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" stroke="${this.tokens.nodeBorder}" stroke-width="1"/>`
      const fs = Math.max(8, Math.min(r * 0.66, 20))
      body += `<text x="${p.x.toFixed(1)}" y="${(p.y + fs * 0.35).toFixed(1)}" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="${fs.toFixed(1)}" fill="${this.tokens.label}">${n.name}</text>`
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  }

  setFocus(id) {
    this.focusNodeId = id
    this.requestRender()
  }
  setPath(result) {
    this.pathResult = result
    this.requestRender()
  }
  setDecrypt(on) {
    this.decryptMode = on
    if (!on) this.decrypted.clear()
    this.requestRender()
  }
  setHoverHighlight(on) {
    this.hoverHighlight = !!on
    this.requestRender()
  }
  decryptNode(id) {
    this.decrypted.add(id)
    this.requestRender()
  }
  setFocusClick(id) {
    this.focusClick = id
    this.requestRender()
  }
  setForce(on) {
    this.forceOn = on
    if (on) this.forceStep = 0
    this.requestRender()
  }

  fit() {
    // 数据坐标 0-100 居中于画布：cam=(50,50) 即数据 50 映射到画布中心
    const s = Math.min((this._w * 0.84) / 100, (this._h * 0.84) / 100)
    this.fitScale = s
    this._tweenCam({ x: 50, y: 50, scale: s }, 450)
  }

  centerOn(id, duration = 450) {
    const n = this.getData().byId[id]
    if (!n) return
    const targetScale = Math.max(this.cam.scale, 7)
    this._tweenCam({ x: n.x, y: n.y, scale: targetScale }, duration)
  }

  _tweenCam(target, dur) {
    if (this.reduced) {
      this.cam = target
      this.requestRender()
      return
    }
    const from = { ...this.cam }
    const t0 = performance.now()
    this.camTarget = { from, to: target, t0, dur }
  }

  /* ================= 坐标变换 ================= */
  screenToWorld(px, py) {
    return { x: (px - this._w / 2) / this.cam.scale + this.cam.x, y: (py - this._h / 2) / this.cam.scale + this.cam.y }
  }
  worldToScreen(wx, wy) {
    return { x: (wx - this.cam.x) * this.cam.scale + this._w / 2, y: (wy - this.cam.y) * this.cam.scale + this._h / 2 }
  }

  nodeScreenPos(id) {
    const d = this.getData()
    const n = d.byId[id]
    if (!n) return null
    const p = this.nodePos.get(id) || { x: n.x, y: n.y }
    return this.worldToScreen(p.x, p.y)
  }

  /* ================= 事件 ================= */
  _hitNode(px, py) {
    const d = this.getData()
    const w = this.screenToWorld(px, py)
    let best = null
    let bestD = Infinity
    const ui = this.cam.scale / this.fitScale
    // C1：命中 = 指针中心落在圆圈内（视觉半径 + 4px 屏幕容差，换算为世界单位）
    for (const n of d.visibleNodes.value) {
      const p = this.nodePos.get(n.id) || { x: n.x, y: n.y }
      const r = Math.hypot(w.x - p.x, w.y - p.y)
      const hitR = (nodeRadius(n) * ui + 4) / this.cam.scale
      if (r < hitR && r < bestD) {
        best = n.id
        bestD = r
      }
    }
    return best
  }

  _pointerDown(e) {
    const rect = this.canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    this.pointers.set(e.pointerId, { x: px, y: py })
    if (this.pointers.size >= 2) {
      // 进入双指捏合：记录初始距离/中点/相机
      const [a, b] = [...this.pointers.values()]
      this.pinch = {
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        midX: (a.x + b.x) / 2,
        midY: (a.y + b.y) / 2,
        scale0: this.cam.scale,
        camX0: this.cam.x,
        camY0: this.cam.y,
      }
      this.drag = null
      this.pan = null
      return
    }
    const hit = this._hitNode(px, py)
    if (hit) {
      const d = this.getData()
      const n = d.byId[hit]
      const w0 = this.screenToWorld(px, py)
      this.drag = { id: hit, ox: n.x - w0.x, oy: n.y - w0.y, startX: w0.x, startY: w0.y }
      this._setHover(hit)
    } else {
      this.pan = { sx: px, sy: py, cx: this.cam.x, cy: this.cam.y }
    }
  }

  _pointerMove(e) {
    const rect = this.canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, { x: px, y: py })
    if (this.pinch && this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1
      const midX = (a.x + b.x) / 2
      const midY = (a.y + b.y) / 2
      const ns = Math.min(60, Math.max(1.2, (this.pinch.scale0 * dist) / this.pinch.dist))
      // 缩放锚定初始中点处的世界点，位移随当前中点自然叠加
      const w0x = (this.pinch.midX - this._w / 2) / this.pinch.scale0 + this.pinch.camX0
      const w0y = (this.pinch.midY - this._h / 2) / this.pinch.scale0 + this.pinch.camY0
      this.cam.scale = ns
      this.cam.x = w0x - (midX - this._w / 2) / ns
      this.cam.y = w0y - (midY - this._h / 2) / ns
      this.camTarget = null
      this.requestRender()
      return
    }
    if (this.drag) {
      const w = this.screenToWorld(px, py)
      const target = { x: w.x + this.drag.ox, y: w.y + this.drag.oy }
      const prev = this.nodePos.get(this.drag.id) || { x: w.x + this.drag.ox, y: w.y + this.drag.oy }
      this.nodePos.set(this.drag.id, target)
      // 拖拽邻居跟随：相邻节点随动 12%（风筝线牵动感）
      const d = this.getData()
      const dx = target.x - prev.x
      const dy = target.y - prev.y
      if (Math.hypot(dx, dy) > 0.02) {
        for (const l of d.links) {
          let nb = null
          if (l.source === this.drag.id) nb = l.target
          else if (l.target === this.drag.id) nb = l.source
          if (!nb) continue
          const cur = this.nodePos.get(nb) || { x: d.byId[nb].x, y: d.byId[nb].y }
          this.nodePos.set(nb, { x: cur.x + dx * 0.12, y: cur.y + dy * 0.12 })
        }
      }
      this._setHover(this.drag.id)
      this.requestRender()
      return
    }
    if (this.pan) {
      this.cam.x = this.pan.cx + (this.pan.sx - px) / this.cam.scale
      this.cam.y = this.pan.cy + (this.pan.sy - py) / this.cam.scale
      this.requestRender()
      return
    }
    // hover
    const hit = this._hitNode(px, py)
    this._setHover(hit)
  }

  _pointerUp(e) {
    this.pointers.delete(e.pointerId)
    if (this.pinch && this.pointers.size < 2) {
      this.pinch = null
      // 单指抬起后转为平移模式
      const [p] = [...this.pointers.values()]
      if (p) this.pan = { sx: p.x, sy: p.y, cx: this.cam.x, cy: this.cam.y }
    }
    if (this.drag) {
      const cur = this.nodePos.get(this.drag.id)
      const moved = cur ? Math.hypot(cur.x - this.drag.startX, cur.y - this.drag.startY) : 0
      if (moved < 6 / this.cam.scale) {
        // 位移小于阈值 = 点击（而非拖拽）
        if (this.decryptMode && !this.decrypted.has(this.drag.id)) {
          // 解密模式：首次点击=揭开
          this.decryptNode(this.drag.id)
          this.onDecrypt?.(this.drag.id)
        } else {
          this.onNodeClick?.(this.drag.id)
        }
      }
    }
    this.drag = null
    this.pan = null
  }

  _wheel(e) {
    e.preventDefault()
    if (this.reduced) return
    const rect = this.canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const factor = Math.pow(1.0015, -e.deltaY)
    this._zoomAt(px, py, factor)
  }

  _zoomAt(px, py, factor) {
    const ns = Math.min(60, Math.max(1.2, this.cam.scale * factor))
    const w = this.screenToWorld(px, py)
    this.cam.scale = ns
    // 保持光标下的世界点不动
    this.cam.x = w.x - (px - this._w / 2) / ns
    this.cam.y = w.y - (py - this._h / 2) / ns
    this.camTarget = null
    this.requestRender()
  }

  _setHover(id) {
    if (this.hover === id) return
    this.hover = id
    this.onNodeHover?.(id)
    this.requestRender()
  }

  /* ================= 力导向模拟（自研斥力-弹簧） ================= */
  _forceStepOnce() {
    const d = this.getData()
    const ns = d.visibleNodes.value
    if (ns.length < 2) return
    const pos = {}
    for (const n of ns) {
      const p = this.nodePos.get(n.id)
      pos[n.id] = p ? { ...p } : { x: n.x, y: n.y }
    }
    const vel = {}
    for (const n of ns) vel[n.id] = { x: 0, y: 0 }
    const repulsion = 340
    const restLen = 16
    const k = 0.02
    // 斥力
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const a = pos[ns[i].id]
        const b = pos[ns[j].id]
        let dx = a.x - b.x
        let dy = a.y - b.y
        let dist = Math.hypot(dx, dy) || 1
        const f = repulsion / (dist * dist)
        dx /= dist
        dy /= dist
        vel[ns[i].id].x += dx * f
        vel[ns[i].id].y += dy * f
        vel[ns[j].id].x -= dx * f
        vel[ns[j].id].y -= dy * f
      }
    }
    // 弹簧
    const ids = new Set(ns.map((n) => n.id))
    for (const l of d.visibleLinks.value) {
      if (!ids.has(l.source) || !ids.has(l.target)) continue
      const a = pos[l.source]
      const b = pos[l.target]
      let dx = a.x - b.x
      let dy = a.y - b.y
      const dist = Math.hypot(dx, dy) || 1
      const f = k * (dist - restLen - (l.strength - 1) * 2)
      dx /= dist
      dy /= dist
      vel[l.source].x -= dx * f
      vel[l.source].y -= dy * f
      vel[l.target].x += dx * f
      vel[l.target].y += dy * f
    }
    // 中心引力 + 阻尼 + 更新
    for (const n of ns) {
      const p = pos[n.id]
      vel[n.id].x += (50 - p.x) * 0.004
      vel[n.id].y += (50 - p.y) * 0.004
      vel[n.id].x *= 0.6
      vel[n.id].y *= 0.6
      pos[n.id].x += vel[n.id].x
      pos[n.id].y += vel[n.id].y
      this.nodePos.set(n.id, pos[n.id])
    }
    this.forceStep++
  }

  /* ================= 渲染 ================= */
  render() {
    const ctx = this.ctx
    const { _w: w, _h: h } = this
    if (!w || !h) return
    // 相机缓动
    if (this.camTarget && !this.reduced) {
      const { from, to, t0, dur } = this.camTarget
      const t = Math.min(1, (performance.now() - t0) / dur)
      const e = 1 - Math.pow(1 - t, 3)
      this.cam.x = from.x + (to.x - from.x) * e
      this.cam.y = from.y + (to.y - from.y) * e
      this.cam.scale = from.scale + (to.scale - from.scale) * e
      if (t >= 1) this.camTarget = null
    }
    // 力导向持续模拟
    if (this.forceOn && !this.reduced && this.forceStep < 600) {
      for (let i = 0; i < 2; i++) this._forceStepOnce()
    }

    ctx.clearRect(0, 0, w, h)
    if (!this.tokens) return

    const d = this.getData()
    const now = performance.now()
    const { visibleNodes, visibleLinks } = d
    const nodes = visibleNodes.value
    const links = visibleLinks.value
    if (!nodes.length) return

    // 消散残影：上一帧存在、本帧消失的节点淡出 320ms
    const curIds = new Set(nodes.map((n) => n.id))
    if (this.lastIds) {
      for (const id of this.lastIds) {
        if (!curIds.has(id) && !this.vanish.has(id)) this.vanish.set(id, now)
      }
    }
    this.lastIds = curIds
    for (const [id, t] of this.vanish) {
      if (now - t > 320) this.vanish.delete(id)
    }

    const hoverNode = this.hoverHighlight ? this.hover : null
    const hh = this.hoverHighlight
    const focusId = this.focusNodeId
    const fc = this.focusClick
    const fcNeighbors = fc ? new Set() : null
    if (fcNeighbors) {
      for (const l of links) {
        if (l.source === fc) fcNeighbors.add(l.target)
        if (l.target === fc) fcNeighbors.add(l.source)
      }
      fcNeighbors.add(fc)
    }
    const pathIds = this.pathResult ? new Set(this.pathResult.ids) : null
    const pathPairs = this.pathResult ? new Set(this.pathResult.pairs) : null
    const hoverNeighbors = hoverNode ? new Set() : null
    if (hoverNeighbors) {
      for (const l of links) {
        if (l.source === hoverNode) hoverNeighbors.add(l.target)
        if (l.target === hoverNode) hoverNeighbors.add(l.source)
      }
      hoverNeighbors.add(hoverNode)
    }

    const s = this.cam.scale
    const ui = s / this.fitScale // fit 视图基准：ui=1 时设计尺寸即屏幕像素，缩放时等比
    const T = this.tokens

    // ---- 边：风筝线 ----
    const posOf = (id) => {
      const n = d.byId[id]
      const p = this.nodePos.get(id) || { x: n.x, y: n.y }
      return this.worldToScreen(p.x, p.y)
    }
    const dimAll = pathIds || hoverNode || fc

    for (const l of links) {
      // 解密模式：secret 边两端未全解密则隐藏（保持神秘）
      if (this.decryptMode && l.secret && (!this.decrypted.has(l.source) || !this.decrypted.has(l.target))) continue
      const a = posOf(l.source)
      const b = posOf(l.target)
      if (!a || !b) continue
      const meta = TYPE_META[l.type]
      const onPath = pathPairs?.has(l.source + '>' + l.target) || pathPairs?.has(l.target + '>' + l.source)
      const isHoverEdge = hoverNode && (l.source === hoverNode || l.target === hoverNode)
      const isFocusEdge = focusId && (l.source === focusId || l.target === focusId)
      const isFcEdge = fc && (l.source === fc || l.target === fc)

      let opacity = 1
      if (pathIds && !onPath) opacity = 0.1
      else if (hoverNode && !isHoverEdge && !this.drag) opacity = 0.08
      else if (fc && !isFcEdge && !this.drag) opacity = 0.12
      else if (fc && isFcEdge) opacity = 1

      const width = (0.7 + l.strength * 0.4) * ui * (onPath ? 2.4 : 1)
      const midX = (a.x + b.x) / 2
      const midY = (a.y + b.y) / 2
      // 悬链垂坠：与屏幕距离成比例的下垂 + 微弱摆动
      const len = Math.hypot(b.x - a.x, b.y - a.y)
      const sag = Math.min(26, len * 0.12) * ui
      const sway = this.reduced ? 0 : Math.sin(now / 2200 + (l.source.length + l.target.length)) * 1.6 * ui
      const cy = midY + sag + sway
      const dash = meta.dash
      ctx.save()
      ctx.globalAlpha = opacity
      ctx.strokeStyle = onPath ? T.path : isHoverEdge || isFocusEdge ? T.edgeHover : T.edge[l.type]
      ctx.lineWidth = width
      ctx.setLineDash(dash ? [5 * ui, 4 * ui] : l.secret ? [2 * ui, 5 * ui] : [])
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.quadraticCurveTo(midX, cy, b.x, b.y)
      ctx.stroke()
      ctx.setLineDash([])
      // 有向箭头
      if (l.directed && !this.reduced) {
        const t = 0.86
        const qx = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * midX + t * t * b.x
        const qy = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * cy + t * t * b.y
        const dqx = 2 * (1 - t) * (midX - a.x) + 2 * t * (b.x - midX)
        const dqy = 2 * (1 - t) * (cy - a.y) + 2 * t * (b.y - cy)
        const ang = Math.atan2(dqy, dqx)
        const as = 4 * ui
        ctx.fillStyle = ctx.strokeStyle
        ctx.beginPath()
        ctx.moveTo(qx + Math.cos(ang) * as, qy + Math.sin(ang) * as)
        ctx.lineTo(qx + Math.cos(ang + 2.5) * as, qy + Math.sin(ang + 2.5) * as)
        ctx.lineTo(qx + Math.cos(ang - 2.5) * as, qy + Math.sin(ang - 2.5) * as)
        ctx.closePath()
        ctx.fill()
      }
      // 电报脉冲：悬停边、聚焦边或路径边上光点行进
      if (!this.reduced && opacity > 0.5 && (isHoverEdge || isFcEdge || onPath)) {
        const tt = (now / 1300) % 1
        const qx = (1 - tt) * (1 - tt) * a.x + 2 * (1 - tt) * tt * midX + tt * tt * b.x
        const qy = (1 - tt) * (1 - tt) * a.y + 2 * (1 - tt) * tt * cy + tt * tt * b.y
        ctx.save()
        ctx.globalAlpha = 0.95
        ctx.shadowColor = '#b8860b'
        ctx.shadowBlur = 10
        ctx.fillStyle = '#f0d9a0'
        ctx.beginPath()
        ctx.arc(qx, qy, 2.6 * ui, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      ctx.restore()
    }

    // ---- 节点 ----
    for (const n of nodes) {
      const p = posOf(n.id)
      const appearT = this._appearT(n.id, now)
      if (appearT <= 0) continue
      const r = nodeRadius(n) * ui * appearT // fit 视图下 = 设计像素，缩放等比
      if (r < 1.2) continue // 过小不画
      const color = d.FACTION[n.faction]?.color || '#555048'
      const onPath = pathIds?.has(n.id)
      const isHover = hoverNode === n.id
      const isFocus = focusId === n.id
      const isDecrypted = !this.decryptMode || this.decrypted.has(n.id)
      const dimmed = pathIds ? !onPath : hoverNode && !isHover && !this.drag ? true : fc && !fcNeighbors.has(n.id) && !this.drag

      ctx.save()
      ctx.globalAlpha = dimmed ? T.dimOpacity : 1
      if (this.decryptMode && !isDecrypted) {
        // 解密模式遮蔽：灰化节点 + 「机密」红条遮罩名字
        ctx.fillStyle = 'rgba(90,86,78,0.9)'
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(60,56,50,0.8)'
        ctx.lineWidth = 1 * ui
        ctx.stroke()
        if (r > 10) {
          const bw = r * 1.15
          const bh = Math.max(6, r * 0.34)
          ctx.fillStyle = 'rgba(157,34,53,0.78)'
          ctx.beginPath()
          ctx.roundRect(p.x - bw / 2, p.y + r * 0.45, bw, bh, 2)
          ctx.fill()
          ctx.fillStyle = 'rgba(240,230,210,0.9)'
          ctx.font = `500 ${Math.max(6, bh * 0.52)}px "Noto Sans SC", sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('机密', p.x, p.y + r * 0.45 + bh / 2)
        }
        ctx.restore()
        continue
      }
      // 印章节点（kite / shadow）：画完整姓名（+代号小字），圈内不溢出
      if (n.key) {
        const seal = n.key === 'kite' ? T.sealKite : T.sealShadow
        ctx.shadowColor = seal
        ctx.shadowBlur = 16 * (isHover ? 1.5 : 1)
        ctx.lineWidth = 1.6 * ui
        ctx.strokeStyle = seal
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.stroke()
        ctx.lineWidth = 0.7 * ui
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * 0.78, 0, Math.PI * 2)
        ctx.stroke()
        ctx.shadowBlur = 0
        const g = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.3, r * 0.1, p.x, p.y, r * 0.8)
        g.addColorStop(0, lightenHex(color, 0.45))
        g.addColorStop(1, color)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * 0.72, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.shadowColor = color + T.nodeGlow
        ctx.shadowBlur = 10
        const g = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.3, r * 0.1, p.x, p.y, r)
        g.addColorStop(0, lightenHex(color, 0.4))
        g.addColorStop(1, color)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.lineWidth = (onPath || isFocus ? 2.2 : 1.1) * ui
        ctx.strokeStyle = onPath || isFocus ? T.focus : T.nodeBorder
        ctx.stroke()
      }
      // C3：悬停时邻居节点正向强调（金色细环），非邻居仍 dim
      const isNb = hh && !!hoverNeighbors && hoverNeighbors.has(n.id) && !isHover && !this.drag
      // D：名字写在圆圈内（单行居中；measureText 收缩；放不下不画；绝不溢出/换行）
      const margin = r * 0.2
      const maxW = 2 * (r - margin)
      if (r > 7) {
        let fs = Math.min(Math.max(r * 0.66, 7), 22)
        let weight = fs >= 12 ? 600 : 500
        ctx.font = `${weight} ${fs}px "Noto Sans SC", sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        let tw = ctx.measureText(n.name).width
        let guard = 0
        while (tw > maxW && fs > 6.5 && guard < 8) {
          fs *= 0.86
          ctx.font = `${weight} ${fs}px "Noto Sans SC", sans-serif`
          tw = ctx.measureText(n.name).width
          guard++
        }
        if (tw <= maxW && fs >= 6) {
          ctx.fillStyle = 'rgba(255,255,255,0.94)'
          ctx.shadowColor = 'rgba(0,0,0,0.8)'
          ctx.shadowBlur = 2
          if (n.key && n.code) {
            // 印章节点：姓名 + 代号两行（都做收缩检查，放不下只画姓名）
            ctx.fillText(n.name, p.x, p.y - fs * 0.34)
            const fs2 = Math.max(6, fs * 0.58)
            ctx.font = `500 ${fs2}px "Noto Sans SC", sans-serif`
            if (ctx.measureText(n.code).width <= maxW) ctx.fillText(n.code, p.x, p.y + fs * 0.52)
          } else {
            ctx.fillText(n.name, p.x, p.y)
          }
          ctx.shadowBlur = 0
        }
      }
      if (isNb) {
        ctx.strokeStyle = 'rgba(184,134,11,0.9)'
        ctx.lineWidth = 1.4 * ui
        ctx.beginPath()
        ctx.arc(p.x, p.y, r + 2.5 * ui, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()
    }

    // ---- C4：悬停邻边关系文字沿曲线切线嵌入线中（贴线不漂移；线够长才画） ----
    if (hoverNode && !this.reduced) {
      const p = posOf(hoverNode)
      const neighbors = links.filter((l) => l.source === hoverNode || l.target === hoverNode)
      ctx.font = `500 ${10.5 * ui}px "Noto Sans SC", sans-serif`
      for (const l of neighbors) {
        const other = l.source === hoverNode ? l.target : l.source
        const op = posOf(other)
        if (!op) continue
        const len = Math.hypot(op.x - p.x, op.y - p.y)
        const text = l.label
        const tw = ctx.measureText(text).width
        // 线足够长才画（屏幕像素 > 文字宽 + 余量），避免短边文字重叠
        if (len < tw + 30 * ui) continue
        // 曲线中点（含悬链垂坠）
        const sag = Math.min(26, len * 0.12) * ui
        const midX = (p.x + op.x) / 2
        const midY = (p.y + op.y) / 2 + sag
        // 切线方向：quadratic 在 t=0.5 的切线恒为端点向量方向
        const ang = Math.atan2(op.y - p.y, op.x - p.x)
        ctx.save()
        ctx.translate(midX, midY)
        ctx.rotate(ang)
        const padX = 6 * ui
        const padY = 3 * ui
        const lh = 14 * ui
        ctx.fillStyle = T.labelBg
        ctx.strokeStyle = T.labelBorder
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(-tw / 2 - padX, -lh / 2 - padY, tw + padX * 2, lh + padY * 2, 8 * ui)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = T.labelDim
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, 0, 0)
        ctx.restore()
      }
    }

    // ---- 消散残影 ----
    if (!this.reduced && this.vanish.size) {
      const d2 = this.getData()
      for (const [id, t] of this.vanish) {
        const n = d2.byId[id]
        if (!n) continue
        const p = this.worldToScreen(n.x, n.y)
        const a = 1 - (now - t) / 320
        if (a <= 0) continue
        const rv = nodeRadius(n) * ui
        ctx.save()
        ctx.globalAlpha = a * 0.5
        ctx.fillStyle = d2.FACTION[n.faction]?.color || '#555048'
        ctx.beginPath()
        ctx.arc(p.x, p.y, rv, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    // ---- mini-map 总览（右下角） ----
    if (this.miniOn && !this.reduced) {
      const mw = Math.min(132, w * 0.22)
      const mh = mw * 0.62
      const mx = w - mw - 10
      const my = h - mh - 10
      ctx.save()
      ctx.globalAlpha = 0.75
      ctx.fillStyle = T.light ? 'rgba(250,244,231,0.7)' : 'rgba(10,10,10,0.66)'
      ctx.strokeStyle = T.labelBorder
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(mx, my, mw, mh, 4)
      ctx.fill()
      ctx.stroke()
      // 节点小点（世界坐标 → 迷你图）
      const sx = (wx) => mx + (wx / 100) * mw
      const sy = (wy) => my + (wy / 100) * mh
      for (const n of nodes) {
        const p = this.nodePos.get(n.id) || { x: n.x, y: n.y }
        const col = this.decryptMode && !this.decrypted.has(n.id) ? '#6a655c' : d.FACTION[n.faction]?.color || '#888'
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.arc(sx(p.x), sy(p.y), n.key ? 3 : 2, 0, Math.PI * 2)
        ctx.fill()
      }
      // 视口框
      const vx0 = sx(this.cam.x)
      const vy0 = sy(this.cam.y)
      const vw = (w / this.cam.scale / 100) * mw
      const vh = (h / this.cam.scale / 100) * mh
      ctx.strokeStyle = T.light ? 'rgba(60,52,40,0.8)' : 'rgba(240,220,190,0.85)'
      ctx.lineWidth = 1
      ctx.strokeRect(vx0, vy0, Math.max(6, vw), Math.max(5, vh))
      ctx.restore()
    }
  }

  _appearT(id, now) {
    if (this.reduced) return 1
    let t = this.appear.get(id)
    if (t === undefined) {
      t = now
      this.appear.set(id, t)
    }
    const dt = now - t
    if (dt > 420) return 1
    return 1 - Math.pow(1 - dt / 420, 3) // easeOutCubic
  }
}

function nodeRadius(n) {
  // 与 useGraphData.nodeSize 一致的世界单位半径
  const span = n.episodes[1] - n.episodes[0]
  const size = Math.max(30, Math.min(58, 26 + n.centrality * 1.9 + (span > 30 ? 6 : span > 10 ? 2 : 0)))
  return size / 2
}
