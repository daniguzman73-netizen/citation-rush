import * as THREE from 'three'

// Procedural manuscript-paper texture for the track floor. Generated once at
// engine init, no per-frame cost. Designed to tile along the Z axis (the
// player's direction of travel) without obvious seams.
//
// The texture is intentionally NOT photoreal — it's a stylized cream paper
// with subtle warm grain, very faint horizontal rule lines (running across
// the player's path like notebook rungs), and decorative blurred "fake text"
// in the margin regions. All static. The lane interior reads cleanest so the
// citation cards remain the eye's anchor; the margins do the world-building.

const W = 1024
const H = 1024

// Margin geometry — keep the lane interior cleaner than the periphery.
// Track width is LANE_COUNT * LANE_WIDTH + 2 ≈ 8.6 units. Lane interior
// (LANE_COUNT * LANE_WIDTH = 6.6 units) corresponds to the centered 6.6/8.6
// fraction of the texture width = ~77%. Margins are the outer ~11.5% each side.
const MARGIN_FRAC = 0.115

function fillCreamGrain(ctx: CanvasRenderingContext2D) {
  // Base cream — warm off-white, slightly more yellow than pure paper white.
  ctx.fillStyle = '#F5EFE0'
  ctx.fillRect(0, 0, W, H)

  // Warm uneven blotches — extremely subtle, gives "aged paper" feel without
  // pushing the contrast.
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

  // Fine grain — pixel-level noise at very low opacity.
  const img = ctx.getImageData(0, 0, W, H)
  const data = img.data
  for (let i = 0; i < data.length; i += 4) {
    // ±6 brightness jitter, biased warm
    const jitter = (Math.random() - 0.5) * 12
    data[i]     = Math.max(0, Math.min(255, data[i]     + jitter))
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + jitter * 0.9))
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + jitter * 0.7))
  }
  ctx.putImageData(img, 0, 0)
}

function drawRuledLines(ctx: CanvasRenderingContext2D) {
  // Faint horizontal rule lines running across the texture's V axis. With the
  // floor lying flat (rotation.x = -π/2) and the texture's V-axis aligned to Z,
  // these read as rungs perpendicular to the player's travel — notebook ruling.
  // Spacing = 64 px in a 1024 tile (so 16 lines per tile), drawn with sketchy
  // hand-drawn-feeling slight jitter to avoid feeling printed.
  ctx.save()
  ctx.strokeStyle = 'rgba(110, 90, 60, 0.10)'
  ctx.lineWidth = 1.2
  for (let y = 32; y < H; y += 64) {
    ctx.beginPath()
    // Draw with a slight wobble — ~6 segments across the width, each y offset by a few px.
    let prevX = 0
    let prevY = y + (Math.random() - 0.5) * 2
    ctx.moveTo(prevX, prevY)
    for (let x = 64; x <= W; x += 64) {
      const yy = y + (Math.random() - 0.5) * 2
      ctx.lineTo(x, yy)
      prevX = x; prevY = yy
    }
    ctx.stroke()
  }
  ctx.restore()
}

function drawMarginBodyText(ctx: CanvasRenderingContext2D) {
  // Decorative "body text" passages in the margin regions only. They're
  // intentionally unreadable — short dashes at small scale arranged in
  // paragraph-like blocks. Gives the periphery a scholarly-page vibe without
  // any actual letterforms (which would betray the texture tiling).
  const leftMarginRight = W * MARGIN_FRAC
  const rightMarginLeft = W * (1 - MARGIN_FRAC)

  ctx.save()
  ctx.fillStyle = 'rgba(80, 60, 40, 0.32)'

  // Draw "paragraphs" of short horizontal dashes in each margin band.
  // Paragraph positions vary in Y so it doesn't loop suspiciously.
  const drawParagraph = (xStart: number, xEnd: number, yStart: number, lineHeight: number, lines: number) => {
    let y = yStart
    for (let l = 0; l < lines; l++) {
      let x = xStart + Math.random() * 6
      const lineEnd = xEnd - Math.random() * 30  // ragged right edge
      while (x < lineEnd) {
        const w = 4 + Math.random() * 14  // "word" width
        const gap = 3 + Math.random() * 3
        ctx.fillRect(x, y, w, 2)
        x += w + gap
      }
      y += lineHeight
    }
  }

  // Left margin: ~4 paragraphs vertically distributed
  drawParagraph(20,                  leftMarginRight - 16, 60,  10, 8)
  drawParagraph(20,                  leftMarginRight - 16, 230, 10, 6)
  drawParagraph(20,                  leftMarginRight - 16, 360, 10, 9)
  drawParagraph(20,                  leftMarginRight - 16, 560, 10, 7)
  drawParagraph(20,                  leftMarginRight - 16, 720, 10, 8)
  drawParagraph(20,                  leftMarginRight - 16, 880, 10, 5)

  // Right margin: similar, different Y offsets
  drawParagraph(rightMarginLeft + 16, W - 20,              90,  10, 7)
  drawParagraph(rightMarginLeft + 16, W - 20,              250, 10, 9)
  drawParagraph(rightMarginLeft + 16, W - 20,              420, 10, 6)
  drawParagraph(rightMarginLeft + 16, W - 20,              590, 10, 8)
  drawParagraph(rightMarginLeft + 16, W - 20,              760, 10, 7)
  drawParagraph(rightMarginLeft + 16, W - 20,              910, 10, 5)

  ctx.restore()
}

function drawMarginScribbles(ctx: CanvasRenderingContext2D) {
  // Sparse red margin-note scribbles — short loose squiggles in the margin
  // regions, the kind a professor would scratch in the margin of a draft.
  // Low density (~6 per tile) so they don't compete with the cards.
  ctx.save()
  ctx.strokeStyle = 'rgba(180, 30, 40, 0.55)'
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'

  const drawSquiggle = (cx: number, cy: number, len: number) => {
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    let x = cx
    let y = cy
    for (let i = 0; i < 5; i++) {
      const dx = 4 + Math.random() * 8
      const dy = (Math.random() - 0.5) * 6
      x += dx
      y += dy
      ctx.lineTo(x, y)
    }
    ctx.stroke()
    void len
  }

  // Left margin scribbles
  for (let i = 0; i < 3; i++) {
    const x = 8 + Math.random() * (W * MARGIN_FRAC - 50)
    const y = 100 + Math.random() * (H - 200)
    drawSquiggle(x, y, 40)
  }
  // Right margin scribbles
  for (let i = 0; i < 3; i++) {
    const x = W * (1 - MARGIN_FRAC) + 6 + Math.random() * (W * MARGIN_FRAC - 50)
    const y = 100 + Math.random() * (H - 200)
    drawSquiggle(x, y, 40)
  }

  ctx.restore()
}

function drawSoftLaneDividers(ctx: CanvasRenderingContext2D) {
  // Pencil-stroke lane dividers baked into the floor texture. Four vertical
  // strokes corresponding to the lane boundaries. Soft, slightly imperfect,
  // graphite-warm rather than black.
  //
  // Lane edges in world X are at ±LANE_WIDTH * 1.5 and ±LANE_WIDTH * 0.5.
  // The floor's full width = LANE_COUNT * LANE_WIDTH + 2 = 8.6 units.
  // Texture U=[0,1] maps to world X=[-4.3, +4.3]. So:
  //   u(-3.3) = (4.3 - 3.3)/8.6 = 0.1163
  //   u(-1.1) = (4.3 - 1.1)/8.6 = 0.3721
  //   u(+1.1) = (4.3 + 1.1)/8.6 = 0.6279
  //   u(+3.3) = (4.3 + 3.3)/8.6 = 0.8837
  const positions = [0.1163, 0.3721, 0.6279, 0.8837]

  ctx.save()
  for (const u of positions) {
    const x = u * W
    // Draw the divider as a stack of slightly-jittered short segments, blended
    // softly. Reads as a hand-drawn pencil line rather than a printed border.
    ctx.strokeStyle = 'rgba(120, 95, 60, 0.42)'
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.beginPath()
    let prevY = -10
    let prevX = x + (Math.random() - 0.5) * 1.2
    ctx.moveTo(prevX, prevY)
    for (let y = 24; y <= H + 10; y += 32) {
      const xx = x + (Math.random() - 0.5) * 1.6
      ctx.lineTo(xx, y)
      prevX = xx; prevY = y
    }
    ctx.stroke()
    // A second very-faint overlay stroke at a slight offset — pencil
    // pressure variation.
    ctx.strokeStyle = 'rgba(120, 95, 60, 0.18)'
    ctx.lineWidth = 1.0
    ctx.stroke()
  }
  ctx.restore()
}

export function createPaperFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  fillCreamGrain(ctx)
  drawMarginBodyText(ctx)
  drawRuledLines(ctx)
  drawMarginScribbles(ctx)
  drawSoftLaneDividers(ctx)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.ClampToEdgeWrapping  // texture spans the full width once
  tex.wrapT = THREE.RepeatWrapping        // tile along Z (player's direction)
  tex.anisotropy = 4
  return tex
}

// Repeat factor on V axis (Z direction). With TRACK_LENGTH = 90 units, we want
// roughly one tile every ~22 world units so the ruled-paper feel reads at
// gameplay speeds without an obvious loop.
export const PAPER_REPEAT_V = 4
