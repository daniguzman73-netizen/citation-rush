import * as THREE from 'three'
import { CITATION_SPECS, type CitationType } from './constants'

// Card layout — drawn at high res so it stays crisp when scaled in 3D.
const W = 512
const H = 320

interface CardMeta {
  label: string
  citation: string
  drawIcon: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void
}

const META: Record<CitationType, CardMeta> = {
  trusted: {
    label: 'VERIFIED',
    citation: 'Chen et al., 2024 — Nature',
    drawIcon: (ctx, x, y, s) => {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = s * 0.18
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(x - s * 0.35, y + s * 0.05)
      ctx.lineTo(x - s * 0.05, y + s * 0.35)
      ctx.lineTo(x + s * 0.4, y - s * 0.3)
      ctx.stroke()
    },
  },
  preprint: {
    label: 'PREPRINT',
    citation: 'Smith, 2025 — arXiv',
    drawIcon: (ctx, x, y, s) => {
      // clock face
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = s * 0.13
      ctx.beginPath()
      ctx.arc(x, y, s * 0.42, 0, Math.PI * 2)
      ctx.stroke()
      // hands
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x, y); ctx.lineTo(x, y - s * 0.28)
      ctx.moveTo(x, y); ctx.lineTo(x + s * 0.22, y + s * 0.05)
      ctx.stroke()
    },
  },
  paywalled: {
    label: 'PAYWALL',
    citation: 'Tanaka, 2023 — Elsevier',
    drawIcon: (ctx, x, y, s) => {
      // shackle
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = s * 0.13
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.arc(x, y - s * 0.05, s * 0.25, Math.PI, 0)
      ctx.stroke()
      // body
      ctx.fillStyle = '#ffffff'
      const bw = s * 0.7, bh = s * 0.45
      ctx.beginPath()
      ctx.roundRect(x - bw / 2, y + s * 0.1, bw, bh, s * 0.08)
      ctx.fill()
    },
  },
  predatory: {
    label: 'PREDATORY',
    citation: "Kumar, 2024 — Int'l J. Adv. Studies",
    drawIcon: (ctx, x, y, s) => {
      // warning triangle
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.moveTo(x, y - s * 0.42)
      ctx.lineTo(x + s * 0.46, y + s * 0.32)
      ctx.lineTo(x - s * 0.46, y + s * 0.32)
      ctx.closePath()
      ctx.fill()
      // bang
      ctx.fillStyle = CITATION_SPECS.predatory.color === 0xdc2626 ? '#7f1d1d' : '#000'
      ctx.beginPath()
      ctx.rect(x - s * 0.06, y - s * 0.18, s * 0.12, s * 0.28)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x, y + s * 0.2, s * 0.07, 0, Math.PI * 2)
      ctx.fill()
    },
  },
  hallucinated: {
    label: 'NOT FOUND',
    citation: 'Garcia, 2031 — Journal of [glitch]',
    drawIcon: (ctx, x, y, s) => {
      // ghost
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      const r = s * 0.4
      ctx.moveTo(x - r, y + s * 0.35)
      ctx.lineTo(x - r, y)
      ctx.arc(x, y, r, Math.PI, 0)
      ctx.lineTo(x + r, y + s * 0.35)
      // wavy bottom
      for (let i = 0; i < 4; i++) {
        const sx = x + r - (i * r) / 2 - r / 4
        ctx.quadraticCurveTo(sx, y + s * 0.5, sx - r / 4, y + s * 0.35)
      }
      ctx.closePath()
      ctx.fill()
      // eyes
      ctx.fillStyle = '#7e22ce'
      ctx.beginPath(); ctx.arc(x - s * 0.13, y - s * 0.03, s * 0.06, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(x + s * 0.13, y - s * 0.03, s * 0.06, 0, Math.PI * 2); ctx.fill()
    },
  },
}

function hex(n: number): string {
  return '#' + n.toString(16).padStart(6, '0')
}

// Returns a tuple [shade darker, shade lighter] for a hex color.
function shade(n: number, delta: number): string {
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + delta))
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + delta))
  const b = Math.max(0, Math.min(255, (n & 0xff) + delta))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function drawCard(ctx: CanvasRenderingContext2D, type: CitationType) {
  const spec = CITATION_SPECS[type]
  const meta = META[type]
  const c = spec.color

  // background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, shade(c, 30))
  grad.addColorStop(1, shade(c, -40))
  ctx.fillStyle = grad
  // rounded card body
  ctx.beginPath()
  ctx.roundRect(8, 8, W - 16, H - 16, 28)
  ctx.fill()

  // inner border
  ctx.strokeStyle = shade(c, -80)
  ctx.lineWidth = 4
  ctx.stroke()

  // icon panel (left)
  const iconCx = 100
  const iconCy = H / 2
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.beginPath(); ctx.roundRect(28, 28, 144, H - 56, 20); ctx.fill()
  meta.drawIcon(ctx, iconCx, iconCy, 100)

  // label (right column, top)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 72px system-ui, sans-serif'
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetY = 2
  ctx.fillText(meta.label, 200, 56)
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // small "citation" line
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = 'italic 30px system-ui, sans-serif'
  ctx.fillText(meta.citation, 200, 156)

  // hint stripe
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.fillRect(200, 220, W - 240, 6)
  ctx.fillStyle = 'rgba(255,255,255,0.10)'
  ctx.fillRect(200, 240, (W - 240) * 0.6, 6)

  // suppress unused (kept for future variation)
  void hex
}

export function createCardTextures(): Record<CitationType, THREE.Texture> {
  const result = {} as Record<CitationType, THREE.Texture>
  for (const type of Object.keys(CITATION_SPECS) as CitationType[]) {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!
    drawCard(ctx, type)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    result[type] = tex
  }
  return result
}

export const CARD_ASPECT = W / H
