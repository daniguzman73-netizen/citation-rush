// Lightweight WebAudio synthesizer. No external assets; all SFX are generated.
// Honors a persisted mute flag (localStorage key: "citation-rush:muted").
//
// Phase 2 SFX coverage:
//   - coin (collect)
//   - hit  (bad-citation collision)
//   - jump (player jump)
//   - tick (countdown beat)
//   - go   (countdown final beat)
//
// Phase 5 may replace these with licensed assets + a music loop.

const MUTE_KEY = 'citation-rush:muted'

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let muted: boolean = readMuted()
const listeners = new Set<(m: boolean) => void>()

function readMuted(): boolean {
  try { return localStorage.getItem(MUTE_KEY) === '1' } catch { return false }
}
function writeMuted(v: boolean) {
  try { localStorage.setItem(MUTE_KEY, v ? '1' : '0') } catch { /* ignore */ }
}

function ensureCtx(): AudioContext | null {
  if (muted) return null
  if (ctx) return ctx
  try {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
    ctx = new AC()
    masterGain = ctx.createGain()
    masterGain.gain.value = 0.4
    masterGain.connect(ctx.destination)
    return ctx
  } catch {
    return null
  }
}

function noiseBuffer(c: AudioContext, durationS: number): AudioBuffer {
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * durationS)), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return buf
}

export const Audio = {
  isMuted(): boolean { return muted },

  setMuted(v: boolean) {
    muted = v
    writeMuted(v)
    listeners.forEach(l => l(v))
    if (v && ctx) {
      // graceful suspend so already-scheduled sounds don't tail off
      ctx.suspend?.()
    } else if (!v && ctx) {
      ctx.resume?.()
    }
  },

  toggle() { Audio.setMuted(!muted) },

  subscribe(fn: (m: boolean) => void): () => void {
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  },

  // Bell-like coin chime: two-osc additive + fast exponential decay
  coin() {
    const c = ensureCtx(); if (!c || !masterGain) return
    const now = c.currentTime
    const osc1 = c.createOscillator(); osc1.type = 'sine'; osc1.frequency.value = 1320
    const osc2 = c.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = 1760
    const gain = c.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.6, now + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)
    osc1.connect(gain); osc2.connect(gain); gain.connect(masterGain)
    osc1.start(now); osc2.start(now)
    osc1.stop(now + 0.3); osc2.stop(now + 0.3)
  },

  // Dull thud: low filtered noise burst
  hit() {
    const c = ensureCtx(); if (!c || !masterGain) return
    const now = c.currentTime
    const src = c.createBufferSource(); src.buffer = noiseBuffer(c, 0.25)
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 360; lp.Q.value = 1.4
    const gain = c.createGain()
    gain.gain.setValueAtTime(0.9, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
    src.connect(lp); lp.connect(gain); gain.connect(masterGain)
    src.start(now); src.stop(now + 0.25)
  },

  // Short whoosh sweep on jump
  jump() {
    const c = ensureCtx(); if (!c || !masterGain) return
    const now = c.currentTime
    const src = c.createBufferSource(); src.buffer = noiseBuffer(c, 0.15)
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 4
    bp.frequency.setValueAtTime(700, now)
    bp.frequency.exponentialRampToValueAtTime(2200, now + 0.14)
    const gain = c.createGain()
    gain.gain.setValueAtTime(0.45, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15)
    src.connect(bp); bp.connect(gain); gain.connect(masterGain)
    src.start(now); src.stop(now + 0.16)
  },

  // Countdown drum (3, 2, 1)
  tick() {
    const c = ensureCtx(); if (!c || !masterGain) return
    const now = c.currentTime
    const src = c.createBufferSource(); src.buffer = noiseBuffer(c, 0.18)
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240
    const gain = c.createGain()
    gain.gain.setValueAtTime(0.8, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)
    src.connect(lp); lp.connect(gain); gain.connect(masterGain)
    src.start(now); src.stop(now + 0.18)
  },

  // Final GO — brighter, sustained
  go() {
    const c = ensureCtx(); if (!c || !masterGain) return
    const now = c.currentTime
    const osc = c.createOscillator(); osc.type = 'triangle'
    osc.frequency.setValueAtTime(660, now)
    osc.frequency.exponentialRampToValueAtTime(990, now + 0.12)
    const gain = c.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.7, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)
    osc.connect(gain); gain.connect(masterGain)
    osc.start(now); osc.stop(now + 0.4)
  },
}
