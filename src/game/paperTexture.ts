import * as THREE from 'three'

// Procedural manuscript-paper texture for the track floor. Generated once at
// engine init, no per-frame cost. Designed to tile along the Z axis (the
// player's direction of travel).
//
// v2 of this file (per "underbaked" feedback):
//   - Lane interior gets alternating subtle luminance so the three lanes
//     read as distinct without consciously seeing them
//   - Dividers are warm-brown ink (not pencil gray), much more visible
//   - Dividers carry perspective tick marks at regular intervals for a
//     sense of speed
//   - Margin body text is actual serif Latin (Lorem ipsum), not abstract
//     dashes — reads as "blurred prose" at distance
//   - Red margin scribbles slightly bumped in presence

const W = 1024
const H = 1024

// Margin geometry — the outer ~11.5% on each side holds Lorem-Ipsum and
// scribbles; the inner 77% is the playable lane area.
const MARGIN_FRAC = 0.115

// Lane divider U-coordinates (0..1) computed from world geometry:
//   floor full width = LANE_COUNT * LANE_WIDTH + 2 = 8.6 units
//   texture U=[0,1] maps to world X=[-4.3, +4.3]
//   lane edges at world X = ±LANE_WIDTH*1.5 and ±LANE_WIDTH*0.5 = ±3.3, ±1.1
const DIVIDER_U = [0.1163, 0.3721, 0.6279, 0.8837]

// Per-tile baked page number — shows once in each tile's corner so the player
// reads "...p. 247...p. 248...p. 249..." as they cross pages. (The scrolling
// page-number decals on top of this give a second, moving layer.)
const BAKED_PAGE_NUMBER = 247

// ─── Cream base + warm grain ─────────────────────────────────────────────────

function fillCreamGrain(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#F5EFE0'
  ctx.fillRect(0, 0, W, H)

  for (let i = 0; i < 14; i++) {
    const cx = Math.random() * W
    const cy = Math.random() * H
    const r = 120 + Math.random() * 220
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, 'rgba(225, 205, 170, 0.10)')
    g.addColorStop(1, 'rgba(225, 205, 170, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const img = ctx.getImageData(0, 0, W, H)
  const data = img.data
  for (let i = 0; i < data.length; i += 4) {
    const jitter = (Math.random() - 0.5) * 12
    data[i]     = Math.max(0, Math.min(255, data[i]     + jitter))
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + jitter * 0.9))
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + jitter * 0.7))
  }
  ctx.putImageData(img, 0, 0)
}

// ─── Alternating lane luminance ─────────────────────────────────────────────

function drawLaneShading(ctx: CanvasRenderingContext2D) {
  // Center lane stays at base cream. Outer lanes (lane 0 and lane 2) get a
  // ~6% darker overlay — subtle enough that the eye doesn't consciously
  // register it, strong enough to feel the lanes underfoot.
  ctx.save()
  ctx.fillStyle = 'rgba(180, 158, 120, 0.10)'
  // Lane 0: between dividers at u=0.1163 and u=0.3721
  const lane0L = DIVIDER_U[0] * W
  const lane0R = DIVIDER_U[1] * W
  // Lane 2: between dividers at u=0.6279 and u=0.8837
  const lane2L = DIVIDER_U[2] * W
  const lane2R = DIVIDER_U[3] * W
  ctx.fillRect(lane0L, 0, lane0R - lane0L, H)
  ctx.fillRect(lane2L, 0, lane2R - lane2L, H)
  ctx.restore()
}

// ─── Faint horizontal rule lines ────────────────────────────────────────────

function drawRuledLines(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.strokeStyle = 'rgba(110, 90, 60, 0.10)'
  ctx.lineWidth = 1.2
  for (let y = 32; y < H; y += 64) {
    ctx.beginPath()
    ctx.moveTo(0, y + (Math.random() - 0.5) * 2)
    for (let x = 64; x <= W; x += 64) {
      const yy = y + (Math.random() - 0.5) * 2
      ctx.lineTo(x, yy)
    }
    ctx.stroke()
  }
  ctx.restore()
}

// ─── Serif Lorem ipsum body text in the margins ─────────────────────────────

// Real Latin so it reads as prose at distance, but small + low contrast so
// it never competes with the cards.
const LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.`.split(/\s+/)

function drawMarginLorem(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.font = '11px Georgia, "Times New Roman", serif'
  ctx.fillStyle = 'rgba(80, 60, 40, 0.22)'
  ctx.textBaseline = 'top'

  const drawColumn = (xLeft: number, xRight: number, yStart: number, yEnd: number, wordOffset: number) => {
    const lineHeight = 14
    const colWidth = xRight - xLeft
    let y = yStart
    let wi = wordOffset
    while (y < yEnd) {
      let line = ''
      let lineWidth = 0
      // greedy word wrap
      while (wi < LOREM.length) {
        const word = LOREM[wi]
        const w = ctx.measureText((line ? line + ' ' : '') + word).width
        if (w > colWidth - 6) break
        line = line ? line + ' ' + word : word
        lineWidth = w
        wi++
      }
      if (wi >= LOREM.length) wi = 0  // loop the corpus
      // ragged right indent
      ctx.fillText(line, xLeft + 2, y)
      void lineWidth
      y += lineHeight
    }
  }

  const leftRight = W * MARGIN_FRAC - 12
  const rightLeft = W * (1 - MARGIN_FRAC) + 12

  // Two paragraphs per side with a gap between, different word offsets so
  // left and right margins don't read as mirrored copies.
  drawColumn(8,         leftRight, 40,  340, 0)
  drawColumn(8,         leftRight, 380, 700, 42)
  drawColumn(8,         leftRight, 740, 1010, 96)

  drawColumn(rightLeft, W - 8,     60,  360, 18)
  drawColumn(rightLeft, W - 8,     400, 720, 70)
  drawColumn(rightLeft, W - 8,     760, 1010, 130)

  ctx.restore()
}

// ─── Red margin-note scribbles ──────────────────────────────────────────────

function drawMarginScribbles(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.strokeStyle = 'rgba(180, 30, 40, 0.72)'
  ctx.lineWidth = 1.8
  ctx.lineCap = 'round'

  const squiggle = (cx: number, cy: number) => {
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    let x = cx
    let y = cy
    for (let i = 0; i < 5; i++) {
      x += 4 + Math.random() * 8
      y += (Math.random() - 0.5) * 6
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  const underline = (cx: number, cy: number, w: number) => {
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    let x = cx
    while (x < cx + w) {
      const dx = 5 + Math.random() * 3
      const dy = (Math.random() - 0.5) * 1.6
      ctx.lineTo(x + dx, cy + dy)
      x += dx
    }
    ctx.stroke()
  }

  // 5 marks per side, randomized but deterministic-ish via Math.random at init time
  for (let i = 0; i < 5; i++) {
    const x = 8 + Math.random() * (W * MARGIN_FRAC - 50)
    const y = 80 + Math.random() * (H - 160)
    if (Math.random() < 0.5) squiggle(x, y); else underline(x, y, 30 + Math.random() * 30)
  }
  for (let i = 0; i < 5; i++) {
    const x = W * (1 - MARGIN_FRAC) + 6 + Math.random() * (W * MARGIN_FRAC - 50)
    const y = 80 + Math.random() * (H - 160)
    if (Math.random() < 0.5) squiggle(x, y); else underline(x, y, 30 + Math.random() * 30)
  }

  ctx.restore()
}

// ─── Lane dividers — warm brown ink with perspective ticks ──────────────────

function drawDividers(ctx: CanvasRenderingContext2D) {
  ctx.save()

  for (const u of DIVIDER_U) {
    const x = u * W

    // Primary ink stroke — warm brown, much more visible than the v1 pencil.
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.78)'
    ctx.lineWidth = 3.2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x + (Math.random() - 0.5) * 1.2, -10)
    for (let y = 32; y <= H + 10; y += 32) {
      const xx = x + (Math.random() - 0.5) * 1.4
      ctx.lineTo(xx, y)
    }
    ctx.stroke()

    // Soft overlay stroke for ink-pressure variation.
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.28)'
    ctx.lineWidth = 1.2
    ctx.stroke()
  }

  // Perspective tick marks — small horizontal hatch across each divider
  // every 128 px of texture height. With the texture tiling 4x along Z,
  // a 128 px interval in a 1024-tall tile = 0.125 tile = ~2.8 world units
  // → roughly 8 ticks visible at any moment, plenty for speed feel.
  ctx.strokeStyle = 'rgba(139, 90, 43, 0.62)'
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  const tickHalf = 10
  for (let y = 64; y < H; y += 128) {
    for (const u of DIVIDER_U) {
      const x = u * W
      ctx.beginPath()
      ctx.moveTo(x - tickHalf, y)
      ctx.lineTo(x + tickHalf, y)
      ctx.stroke()
    }
  }

  ctx.restore()
}

// ─── Baked page number, one per tile ────────────────────────────────────────

function drawBakedPageNumber(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.font = 'italic 600 16px Georgia, "Times New Roman", serif'
  ctx.fillStyle = 'rgba(80, 60, 40, 0.42)'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  // Bottom-right of each tile — far margin corner.
  ctx.fillText(`p. ${BAKED_PAGE_NUMBER}`, W - 22, H - 36)
  ctx.restore()
}

// ─── Compose ────────────────────────────────────────────────────────────────

export function createPaperFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  fillCreamGrain(ctx)
  drawLaneShading(ctx)
  drawMarginLorem(ctx)
  drawRuledLines(ctx)
  drawMarginScribbles(ctx)
  drawDividers(ctx)
  drawBakedPageNumber(ctx)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 4
  return tex
}

export const PAPER_REPEAT_V = 4

// ─── Page-edge shadow at the player's feet ──────────────────────────────────
//
// A thin band of darker color baked into a small 2:512 texture, used by a
// flat plane in front of the player. Gradient runs from transparent at the
// "far" edge to a soft warm-brown shadow at the "near" edge — reads as the
// page having physical thickness as the camera looks down on it.

export function createPageEdgeShadowTexture(): THREE.CanvasTexture {
  const w = 16
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  // Vertical gradient: top of texture = transparent, bottom = warm-brown shadow.
  // When the plane is laid on the floor with its far edge "up" and near
  // edge "down" (toward the camera), this reads as a shadow underfoot.
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0,    'rgba(110, 80, 50, 0)')
  g.addColorStop(0.5,  'rgba(110, 80, 50, 0.10)')
  g.addColorStop(1,    'rgba(80,  55, 30, 0.45)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// ─── Page-number decal texture (one per pool entry) ─────────────────────────

export function drawPageNumberTexture(canvas: HTMLCanvasElement, n: number) {
  const w = canvas.width
  const h = canvas.height
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, w, h)
  ctx.font = 'italic 800 60px Georgia, "Times New Roman", serif'
  ctx.fillStyle = 'rgba(80, 60, 40, 0.55)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`p. ${n}`, w / 2, h / 2)
}

export function createPageNumberCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 96
  return canvas
}
