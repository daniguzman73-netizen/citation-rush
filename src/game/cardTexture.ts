import * as THREE from 'three'
import { CITATION_SPECS, type CitationType } from './constants'

// Card layout — drawn at high res so it stays crisp when scaled in 3D.
// New layout (Phase 2 feedback): icon as a small top-left accent, label as the
// dominant centered element, citation text small at the bottom. The label
// auto-shrinks to fit, so 9-character types like "PREDATORY" / "NOT FOUND"
// don't overflow.
const W = 512
const H = 320

const LABEL_MAX_WIDTH = W - 64   // 32px margin each side
const LABEL_BASE_PX = 110

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
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = s * 0.13
      ctx.beginPath()
      ctx.arc(x, y, s * 0.42, 0, Math.PI * 2)
      ctx.stroke()
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
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = s * 0.13
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.arc(x, y - s * 0.05, s * 0.25, Math.PI, 0)
      ctx.stroke()
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
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.moveTo(x, y - s * 0.42)
      ctx.lineTo(x + s * 0.46, y + s * 0.32)
      ctx.lineTo(x - s * 0.46, y + s * 0.32)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#7f1d1d'
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
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      const r = s * 0.4
      ctx.moveTo(x - r, y + s * 0.35)
      ctx.lineTo(x - r, y)
      ctx.arc(x, y, r, Math.PI, 0)
      ctx.lineTo(x + r, y + s * 0.35)
      for (let i = 0; i < 4; i++) {
        const sx = x + r - (i * r) / 2 - r / 4
        ctx.quadraticCurveTo(sx, y + s * 0.5, sx - r / 4, y + s * 0.35)
      }
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#7e22ce'
      ctx.beginPath(); ctx.arc(x - s * 0.13, y - s * 0.03, s * 0.06, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(x + s * 0.13, y - s * 0.03, s * 0.06, 0, Math.PI * 2); ctx.fill()
    },
  },
}

function shade(n: number, delta: number): string {
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + delta))
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + delta))
  const b = Math.max(0, Math.min(255, (n & 0xff) + delta))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// Pick the largest font size at which `text` fits in `maxWidth`.
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  basePx: number,
  minPx = 40,
): number {
  let size = basePx
  ctx.font = `900 ${size}px system-ui, sans-serif`
  while (ctx.measureText(text).width > maxWidth && size > minPx) {
    size -= 2
    ctx.font = `900 ${size}px system-ui, sans-serif`
  }
  return size
}

function drawCard(ctx: CanvasRenderingContext2D, type: CitationType) {
  const spec = CITATION_SPECS[type]
  const meta = META[type]
  const c = spec.color

  // background — gradient in the type color
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, shade(c, 36))
  grad.addColorStop(1, shade(c, -50))
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.roundRect(8, 8, W - 16, H - 16, 28)
  ctx.fill()

  // inner border for definition
  ctx.strokeStyle = shade(c, -90)
  ctx.lineWidth = 4
  ctx.stroke()

  // icon — small top-left accent on a translucent dark badge
  const iconBoxX = 32, iconBoxY = 28, iconBoxSize = 80
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  ctx.beginPath()
  ctx.roundRect(iconBoxX, iconBoxY, iconBoxSize, iconBoxSize, 16)
  ctx.fill()
  meta.drawIcon(ctx, iconBoxX + iconBoxSize / 2, iconBoxY + iconBoxSize / 2, iconBoxSize * 0.7)

  // LABEL — dominant, auto-fit to card width, vertically centered-ish
  const labelSize = fitFontSize(ctx, meta.label, LABEL_MAX_WIDTH, LABEL_BASE_PX, 56)
  ctx.font = `900 ${labelSize}px system-ui, sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,0.55)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetY = 4
  ctx.fillText(meta.label, W / 2, H / 2 + 12)
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // citation line at the bottom, small + italic
  ctx.font = 'italic 24px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(meta.citation, W / 2, H - 32)
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
