import * as THREE from 'three'
import { CITATION_SPECS, type CitationType } from './constants'

// Card layout — drawn at high res so it stays crisp when scaled in 3D.
// Polish-pass layout (per design brief):
//   - dominant centered LABEL with auto-fit
//   - icon as a top-left circular badge (crisp canvas-path SVG-equivalent)
//   - citation text small at bottom
//   - per-type texture treatments baked in (sheen / paper lines / scanlines / cross-hatch / shimmer)
const W = 640
const H = 400

const LABEL_MAX_WIDTH = W - 80
const LABEL_BASE_PX = 130

// Family stack the canvas uses. Inter is loaded via the <link> in index.html;
// if it hasn't resolved before the texture is drawn, system-ui is the fallback
// (visually similar, and the texture regenerates once fonts.ready resolves).
const FONT_STACK = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

interface CardMeta {
  label: string
  citation: string
  authorline: string  // smaller second line — author + venue split for hierarchy
  drawIcon: (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => void
}

// ─── Icon helpers — crisp canvas paths, no emoji ────────────────────────────

function iconCheck(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = s * 0.18
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.34, cy + s * 0.04)
  ctx.lineTo(cx - s * 0.06, cy + s * 0.30)
  ctx.lineTo(cx + s * 0.36, cy - s * 0.26)
  ctx.stroke()
}

function iconDocClock(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  // Document outline
  ctx.fillStyle = '#ffffff'
  const dw = s * 0.62, dh = s * 0.78
  const dx = cx - dw / 2, dy = cy - dh / 2
  ctx.beginPath()
  ctx.moveTo(dx, dy)
  ctx.lineTo(dx + dw * 0.72, dy)
  ctx.lineTo(dx + dw, dy + dh * 0.24)
  ctx.lineTo(dx + dw, dy + dh)
  ctx.lineTo(dx, dy + dh)
  ctx.closePath()
  ctx.fill()
  // folded corner
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.beginPath()
  ctx.moveTo(dx + dw * 0.72, dy)
  ctx.lineTo(dx + dw, dy + dh * 0.24)
  ctx.lineTo(dx + dw * 0.72, dy + dh * 0.24)
  ctx.closePath()
  ctx.fill()
  // Clock overlay (lower right)
  const ccx = cx + s * 0.18, ccy = cy + s * 0.22, cr = s * 0.20
  ctx.fillStyle = '#1f2937'
  ctx.beginPath(); ctx.arc(ccx, ccy, cr, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = s * 0.04
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(ccx, ccy); ctx.lineTo(ccx, ccy - cr * 0.55)
  ctx.moveTo(ccx, ccy); ctx.lineTo(ccx + cr * 0.45, ccy + cr * 0.1)
  ctx.stroke()
}

function iconLock(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  // shackle
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = s * 0.14
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(cx, cy - s * 0.06, s * 0.26, Math.PI, 0)
  ctx.stroke()
  // body
  ctx.fillStyle = '#ffffff'
  const bw = s * 0.74, bh = s * 0.50
  const bx = cx - bw / 2, by = cy + s * 0.08
  ctx.beginPath()
  ctx.roundRect(bx, by, bw, bh, s * 0.10)
  ctx.fill()
  // keyhole
  ctx.fillStyle = '#9a3412'
  ctx.beginPath(); ctx.arc(cx, by + bh * 0.42, s * 0.07, 0, Math.PI * 2); ctx.fill()
  ctx.fillRect(cx - s * 0.04, by + bh * 0.42, s * 0.08, s * 0.18)
}

function iconWarning(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(cx, cy - s * 0.42)
  ctx.lineTo(cx + s * 0.48, cy + s * 0.34)
  ctx.lineTo(cx - s * 0.48, cy + s * 0.34)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#7f1d1d'
  ctx.beginPath()
  ctx.roundRect(cx - s * 0.05, cy - s * 0.18, s * 0.10, s * 0.30, s * 0.04)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx, cy + s * 0.22, s * 0.07, 0, Math.PI * 2)
  ctx.fill()
}

function iconGhost(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.fillStyle = '#ffffff'
  const r = s * 0.42
  ctx.beginPath()
  ctx.moveTo(cx - r, cy + s * 0.38)
  ctx.lineTo(cx - r, cy - s * 0.02)
  ctx.arc(cx, cy - s * 0.02, r, Math.PI, 0)
  ctx.lineTo(cx + r, cy + s * 0.38)
  for (let i = 0; i < 4; i++) {
    const sx = cx + r - (i * r) / 2 - r / 4
    ctx.quadraticCurveTo(sx, cy + s * 0.55, sx - r / 4, cy + s * 0.38)
  }
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#5b21b6'
  ctx.beginPath(); ctx.arc(cx - s * 0.14, cy - s * 0.04, s * 0.07, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + s * 0.14, cy - s * 0.04, s * 0.07, 0, Math.PI * 2); ctx.fill()
  // ghostly mouth
  ctx.fillStyle = 'rgba(88,28,135,0.6)'
  ctx.beginPath(); ctx.arc(cx, cy + s * 0.12, s * 0.06, 0, Math.PI * 2); ctx.fill()
}

const META: Record<CitationType, CardMeta> = {
  trusted:      { label: 'VERIFIED',  citation: 'Chen et al., 2024',         authorline: 'Nature · peer-reviewed',          drawIcon: iconCheck },
  preprint:     { label: 'PREPRINT',  citation: 'Smith, 2025',               authorline: 'arXiv · not peer-reviewed',       drawIcon: iconDocClock },
  paywalled:    { label: 'PAYWALL',   citation: 'Tanaka, 2023',              authorline: 'Elsevier · access restricted',    drawIcon: iconLock },
  predatory:    { label: 'PREDATORY', citation: 'Kumar, 2024',               authorline: "Int'l J. Adv. Studies",           drawIcon: iconWarning },
  hallucinated: { label: 'NOT FOUND', citation: 'Garcia, 2031',              authorline: 'Journal of [glitch]',             drawIcon: iconGhost },
}

// ─── Color math ─────────────────────────────────────────────────────────────

function shade(n: number, delta: number): string {
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + delta))
  const g = Math.max(0, Math.min(255, ((n >> 8)  & 0xff) + delta))
  const b = Math.max(0, Math.min(255, (n & 0xff) + delta))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function rgba(n: number, alpha: number): string {
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  return `rgba(${r},${g},${b},${alpha})`
}

// ─── Per-type texture overlays — drawn ONCE at startup, no per-frame cost ──

function overlayPredatoryStripes(ctx: CanvasRenderingContext2D) {
  // Subtle diagonal warning-stripe cross-hatching, very low contrast.
  ctx.save()
  ctx.globalAlpha = 0.08
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 24
  ctx.translate(W / 2, H / 2)
  ctx.rotate(-Math.PI / 4)
  for (let x = -W; x < W; x += 56) {
    ctx.beginPath(); ctx.moveTo(x, -H); ctx.lineTo(x, H); ctx.stroke()
  }
  ctx.restore()
  // Vignette darken at edges
  const g = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.6)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,0.28)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

function overlayPreprintPaper(ctx: CanvasRenderingContext2D) {
  // Faint horizontal lines suggesting a manuscript.
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 1.2
  for (let y = 56; y < H - 40; y += 22) {
    ctx.beginPath(); ctx.moveTo(36, y); ctx.lineTo(W - 36, y); ctx.stroke()
  }
  ctx.restore()
}

function overlayPaywallShimmer(ctx: CanvasRenderingContext2D, baseColor: number) {
  // Diagonal metallic sheen — a wide brightened band across the card.
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0,    rgba(baseColor, 0))
  g.addColorStop(0.42, rgba(baseColor, 0))
  g.addColorStop(0.50, 'rgba(255,255,255,0.32)')
  g.addColorStop(0.58, rgba(baseColor, 0))
  g.addColorStop(1,    rgba(baseColor, 0))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // Inset shadow to feel "sealed".
  ctx.save()
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.roundRect(12, 12, W - 24, H - 24, 28)
  ctx.stroke()
  ctx.restore()
}

function overlayHallucinatedScanlines(ctx: CanvasRenderingContext2D) {
  // Horizontal scanlines + faint chromatic ghost.
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.32)'
  for (let y = 8; y < H; y += 4) {
    ctx.fillRect(0, y, W, 1.5)
  }
  ctx.restore()
  // CRT-style edge falloff
  const g = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.7)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,0.4)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

function overlayTrustedSheen(ctx: CanvasRenderingContext2D) {
  // Diagonal gold sheen band — pre-baked "desirability".
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0,    'rgba(255,255,255,0)')
  g.addColorStop(0.40, 'rgba(255,255,255,0)')
  g.addColorStop(0.50, 'rgba(250,204,21,0.28)')
  g.addColorStop(0.60, 'rgba(255,255,255,0)')
  g.addColorStop(1,    'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

// ─── Text fitting ───────────────────────────────────────────────────────────

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  basePx: number,
  weight: number,
  minPx = 48,
): number {
  let size = basePx
  ctx.font = `${weight} ${size}px ${FONT_STACK}`
  while (ctx.measureText(text).width > maxWidth && size > minPx) {
    size -= 2
    ctx.font = `${weight} ${size}px ${FONT_STACK}`
  }
  return size
}

// ─── Card draw — one canvas per type ────────────────────────────────────────

function drawCard(ctx: CanvasRenderingContext2D, type: CitationType) {
  const spec = CITATION_SPECS[type]
  const meta = META[type]
  const c = spec.color

  ctx.clearRect(0, 0, W, H)

  // Soft drop shadow under the card body.
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 8

  // Background — vertical gradient in the type color.
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, shade(c, 38))
  bg.addColorStop(1, shade(c, -58))
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.roundRect(14, 14, W - 28, H - 28, 32)
  ctx.fill()

  // Inner edge border for definition.
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  ctx.strokeStyle = shade(c, -90)
  ctx.lineWidth = 5
  ctx.stroke()
  ctx.restore()

  // Per-type texture overlays (baked once).
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(14, 14, W - 28, H - 28, 32)
  ctx.clip()

  switch (type) {
    case 'trusted':      overlayTrustedSheen(ctx);            break
    case 'preprint':     overlayPreprintPaper(ctx);           break
    case 'paywalled':    overlayPaywallShimmer(ctx, c);       break
    case 'predatory':    overlayPredatoryStripes(ctx);        break
    case 'hallucinated': overlayHallucinatedScanlines(ctx);   break
  }
  ctx.restore()

  // Icon badge — circular, top-left, dark translucent backplate.
  const iconCx = 86, iconCy = 86, iconR = 56
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.26)'
  ctx.beginPath()
  ctx.arc(iconCx, iconCy, iconR, 0, Math.PI * 2)
  ctx.fill()
  // glossy highlight on top of the badge
  const gh = ctx.createLinearGradient(iconCx, iconCy - iconR, iconCx, iconCy)
  gh.addColorStop(0, 'rgba(255,255,255,0.25)')
  gh.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gh
  ctx.beginPath()
  ctx.arc(iconCx, iconCy, iconR, 0, Math.PI * 2)
  ctx.fill()
  meta.drawIcon(ctx, iconCx, iconCy, iconR * 1.45)
  ctx.restore()

  // LABEL — dominant, auto-fit, vertically centered with bias slightly up.
  const labelSize = fitFontSize(ctx, meta.label, LABEL_MAX_WIDTH, LABEL_BASE_PX, 900, 56)
  ctx.font = `900 ${labelSize}px ${FONT_STACK}`
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // Hallucinated gets a chromatic-aberration ghost — cyan + red offsets behind white.
  if (type === 'hallucinated') {
    ctx.save()
    ctx.globalAlpha = 0.55
    ctx.fillStyle = '#22d3ee'
    ctx.fillText(meta.label, W / 2 - 4, H / 2 - 6)
    ctx.fillStyle = '#f43f5e'
    ctx.fillText(meta.label, W / 2 + 4, H / 2 - 6)
    ctx.restore()
  }
  ctx.shadowColor = 'rgba(0,0,0,0.55)'
  ctx.shadowBlur = 14
  ctx.shadowOffsetY = 4
  ctx.fillText(meta.label, W / 2, H / 2 - 6)
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // Citation lines at bottom — two-line hierarchy.
  ctx.textBaseline = 'alphabetic'
  ctx.font = `800 30px ${FONT_STACK}`
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.fillText(meta.citation, W / 2, H - 60)

  ctx.font = `400 22px ${FONT_STACK}`
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.fillText(meta.authorline, W / 2, H - 30)
}

// ─── Public API ─────────────────────────────────────────────────────────────

function generateOnce(): Record<CitationType, THREE.CanvasTexture> {
  const out = {} as Record<CitationType, THREE.CanvasTexture>
  for (const type of Object.keys(CITATION_SPECS) as CitationType[]) {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!
    drawCard(ctx, type)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    out[type] = tex
  }
  return out
}

// Generates textures synchronously with whatever font is currently loaded
// (usually system-ui on first paint), then — if Inter is still resolving —
// regenerates them in place once `document.fonts.ready` fires so the booth
// settles into Inter within ~1 frame of load. Sprites keep their material
// reference; only the underlying canvas pixels change.
export function createCardTextures(): Record<CitationType, THREE.CanvasTexture> {
  const textures = generateOnce()

  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      for (const type of Object.keys(CITATION_SPECS) as CitationType[]) {
        const tex = textures[type]
        const canvas = tex.image as HTMLCanvasElement
        const ctx = canvas.getContext('2d')!
        drawCard(ctx, type)
        tex.needsUpdate = true
      }
    }).catch(() => { /* offline kiosk first paint — system-ui is fine */ })
  }

  return textures
}

export const CARD_ASPECT = W / H
