import * as THREE from 'three'
import {
  LANE_COUNT,
  LANE_X,
  TRACK_LENGTH,
  SPAWN_Z,
  DESPAWN_Z,
  PLAYER_Z,
  PLAYER_LANE_START,
  PLAYER_LATERAL_SPEED,
  PLAYER_SIZE,
  PLAYER_Y_GROUND,
  JUMP_DURATION,
  JUMP_PEAK,
  TRACK_SPEED_START,
  TRACK_SPEED_END,
  GAME_DURATION_S,
  MAX_HITS,
  FULL_RUN_BONUS,
  CITATION_SPECS,
  SPAWN_PHASES,
  OBJECT_POOL_SIZE,
  OBJECT_SIZE,
  AIRBORNE_Y,
  GROUND_Y,
  MIN_SPAWN_GAP_Z,
  type CitationType,
} from './constants'
import { createCardTextures, CARD_ASPECT } from './cardTexture'
import {
  createPaperFloorTexture,
  createPageEdgeShadowTexture,
  createPageNumberCanvas,
  drawPageNumberTexture,
  PAPER_REPEAT_V,
} from './paperTexture'
import { createOwl, OWL_ANIM, type OwlRefs } from './playerOwl'
import { Audio } from '../audio/Audio'

// Scene environment — warm cream paper world, matching the Nexus Booth aesthetic.
const SCENE_BG_COLOR = 0xF5EFE0   // warm cream
const SCENE_FOG_COLOR = 0xEBE4D2  // slightly darker cream — distant pages fade into haze

// ─────────────────────────────────────────────────────────────────────────────
// Public state shape
// ─────────────────────────────────────────────────────────────────────────────

export type EndedBy = 'time' | 'hits'

export interface RunStats {
  trusted_collected: number
  preprint_dodged: number
  preprint_hit: number
  paywalled_dodged: number
  paywalled_hit: number
  predatory_dodged: number
  predatory_hit: number
  hallucinated_dodged: number
  hallucinated_hit: number
  retracted_dodged: number
  retracted_hit: number
}

export type GamePhase = 'idle' | 'running' | 'over'

export interface PopupEvent {
  id: number
  kind: 'collect' | 'hit'
  value: number
  ttl: number // seconds remaining before HUD prunes it
}

export interface GameState {
  phase: GamePhase
  paused: boolean
  timeRemaining: number  // seconds, clamped to [0, GAME_DURATION_S]
  score: number
  hits: number
  endedBy: EndedBy | null
  stats: RunStats
  hitFlash: number       // 0..1 fade amount; HUD renders an overlay when > 0
  popups: PopupEvent[]
}

const emptyStats = (): RunStats => ({
  trusted_collected: 0,
  preprint_dodged: 0,
  preprint_hit: 0,
  paywalled_dodged: 0,
  paywalled_hit: 0,
  predatory_dodged: 0,
  predatory_hit: 0,
  hallucinated_dodged: 0,
  hallucinated_hit: 0,
  retracted_dodged: 0,
  retracted_hit: 0,
})

const initialState = (): GameState => ({
  phase: 'idle',
  paused: false,
  timeRemaining: GAME_DURATION_S,
  score: 0,
  hits: 0,
  endedBy: null,
  stats: emptyStats(),
  hitFlash: 0,
  popups: [],
})

// ─────────────────────────────────────────────────────────────────────────────
// Pool entry
// ─────────────────────────────────────────────────────────────────────────────

interface PoolEntry {
  sprite: THREE.Sprite
  type: CitationType
  lane: number
  airborne: boolean
  active: boolean
  // Per-card animation phase. Random per spawn so cards bob/pulse out of sync.
  bobPhase: number
  // Cached "rest" Y so bob can oscillate around it without drifting.
  restY: number
  // Cached base sprite scale before per-frame pulse modulation.
  baseScaleW: number
  baseScaleH: number
}

interface Particle {
  sprite: THREE.Sprite
  vx: number
  vy: number
  vz: number
  life: number     // seconds remaining
  maxLife: number
  active: boolean
}

const PARTICLE_POOL_SIZE = 24
const SHAKE_DURATION = 0.18
const HIT_FLASH_DURATION = 0.35

// Scrolling "p. 247", "p. 248"… decals in the periphery. Pure decoration —
// no collision, no scoring, no effect on gameplay. Pool of 4 planes that
// recycle to far-Z with the next page number whenever they pass the player.
interface PageNumberDecal {
  mesh: THREE.Mesh
  canvas: HTMLCanvasElement
  texture: THREE.CanvasTexture
  currentNumber: number
}
const PAGE_NUMBER_POOL_SIZE = 4
const PAGE_NUMBER_START = 247    // arbitrary "book" starting page
const PAGE_NUMBER_X = 3.6        // outside the lane area (lanes end at ±3.3)

// ─────────────────────────────────────────────────────────────────────────────
// Engine
// ─────────────────────────────────────────────────────────────────────────────

type Subscriber = (state: GameState) => void

export class GameEngine {
  private canvas: HTMLCanvasElement
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera

  private player!: THREE.Group
  private playerTargetLane = PLAYER_LANE_START
  private playerX = LANE_X[PLAYER_LANE_START]
  private playerY = PLAYER_Y_GROUND
  private jumpT = -1 // -1 = not jumping; else seconds since jump start

  private pool: PoolEntry[] = []
  private spriteMaterials!: Record<CitationType, THREE.SpriteMaterial>
  private cardTextures!: Record<CitationType, THREE.Texture>
  private trackGroup!: THREE.Group

  private particles: Particle[] = []
  private particleTexture!: THREE.Texture
  private particleGoldMat!: THREE.SpriteMaterial
  private particleRedMat!: THREE.SpriteMaterial

  // Decorative scrolling page-number decals (Phase 6 polish — pure visual).
  private pageNumberDecals: PageNumberDecal[] = []
  private nextPageNumber = PAGE_NUMBER_START

  private cameraBasePos = new THREE.Vector3(0, 4.5, 7)
  private shakeT = 0       // seconds remaining on screen shake
  private time = 0         // monotonic accumulator for card bob / pulse / flicker
  // Brief scale-up bounce on the player on collect — seconds remaining.
  private playerBounceT = 0

  // Owl visual rig — set in buildPlayer().
  private owl!: OwlRefs
  // Body-roll for lane switches (lerped toward target each frame).
  private playerRoll = 0
  // Hit-shake remaining (180ms wobble + pupil scale-up).
  private playerShakeT = 0

  private state: GameState = initialState()
  private subs = new Set<Subscriber>()
  private nextPopupId = 1

  private spawnAccumulator = 0
  private lastFrameTime = 0
  private rafId: number | null = null
  private paused = false
  private resizeObserver: ResizeObserver | null = null
  private boundKeyDown: (e: KeyboardEvent) => void

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(SCENE_BG_COLOR, 1)

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(SCENE_BG_COLOR)
    this.scene.fog = new THREE.Fog(SCENE_FOG_COLOR, 25, TRACK_LENGTH * 0.9)

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200)
    this.camera.position.set(0, 4.5, 7)
    this.camera.lookAt(0, 1.0, -10)

    this.buildLights()
    this.buildTrack()
    this.buildPlayer()
    this.buildPool()
    this.buildParticles()

    this.boundKeyDown = (e) => this.onKeyDown(e)
    window.addEventListener('keydown', this.boundKeyDown)

    this.handleResize()
    this.resizeObserver = new ResizeObserver(() => this.handleResize())
    this.resizeObserver.observe(this.canvas)

    // initial paint so the player is visible while idle
    this.renderer.render(this.scene, this.camera)
  }

  // ── Public API ────────────────────────────────────────────────────────────

  subscribe(fn: Subscriber): () => void {
    this.subs.add(fn)
    fn(this.state)
    return () => { this.subs.delete(fn) }
  }

  getState(): GameState {
    return this.state
  }

  start(): void {
    // Cancel any in-flight RAF before starting a fresh loop. Otherwise a rapid
    // "Play again → Play again" double-tap would race two loops and double-tick.
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.state = initialState()
    this.state.phase = 'running'
    this.playerTargetLane = PLAYER_LANE_START
    this.playerX = LANE_X[PLAYER_LANE_START]
    this.playerY = PLAYER_Y_GROUND
    this.jumpT = -1
    this.spawnAccumulator = 0
    this.shakeT = 0
    this.time = 0
    this.playerBounceT = 0
    this.playerShakeT = 0
    this.playerRoll = 0
    this.paused = false
    this.player.scale.set(1, 1, 1)
    this.player.rotation.set(0, 0, 0)
    this.camera.position.copy(this.cameraBasePos)
    this.deactivateAll()
    for (const p of this.particles) { p.active = false; p.sprite.visible = false }
    this.emit()

    this.lastFrameTime = performance.now()
    this.tickLoop()
  }

  // Pause / resume for tab-visibility. While paused, the render loop still runs
  // (so the scene stays painted), but timer / spawning / movement / collisions
  // do not advance. Resume reseeds lastFrameTime so dt doesn't jump.
  pause(): void {
    if (this.state.phase !== 'running' || this.paused) return
    this.paused = true
    this.emit()
  }

  resume(): void {
    if (!this.paused) return
    this.paused = false
    this.lastFrameTime = performance.now()
    this.emit()
  }

  isPaused(): boolean { return this.paused }

  dispose(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId)
    window.removeEventListener('keydown', this.boundKeyDown)
    this.resizeObserver?.disconnect()
    // Three.js cleanup
    for (const t of Object.keys(this.spriteMaterials) as CitationType[]) {
      this.spriteMaterials[t].dispose()
      this.cardTextures[t].dispose()
    }
    this.particleGoldMat?.dispose()
    this.particleRedMat?.dispose()
    this.particleTexture?.dispose()
    // Owl rig — disposes shared sphere/cone/cyl/box geometries and all materials.
    for (const d of this.owl?.disposables ?? []) d.dispose()
    this.renderer.dispose()
  }

  // Touch / external input
  moveLeft(): void  { if (this.state.phase === 'running' && this.playerTargetLane > 0)             this.playerTargetLane -= 1 }
  moveRight(): void { if (this.state.phase === 'running' && this.playerTargetLane < LANE_COUNT - 1) this.playerTargetLane += 1 }
  jump(): void {
    if (this.state.phase === 'running' && this.jumpT < 0) {
      this.jumpT = 0
      Audio.jump()
    }
  }

  // ── Scene construction ────────────────────────────────────────────────────

  private buildLights() {
    // Ambient + two directionals. The owl is the only thing in the scene that
    // responds to lighting (floor + cards + decals are all unlit Basic/Sprite
    // materials), so this is effectively the owl's key + fill rig.
    const ambient = new THREE.AmbientLight(0xffffff, 0.55)
    // Original directional — keep, lights the right side from above-back.
    const keyDir = new THREE.DirectionalLight(0xffffff, 0.85)
    keyDir.position.set(5, 10, 5)
    // New soft key from upper-back-center — catches the camera-facing side of
    // the owl (back of head, top of wings, back of body) so it has visible
    // light/shadow separation instead of reading as a flat blob.
    const cameraKey = new THREE.DirectionalLight(0xffffff, 0.45)
    cameraKey.position.set(0, 8, 4)
    this.scene.add(ambient, keyDir, cameraKey)
  }

  private buildTrack() {
    this.trackGroup = new THREE.Group()

    // Floor — one big manuscript page running into the distance. The texture
    // bakes in: cream paper grain, alternating-tone lane shading, serif
    // Lorem-Ipsum body text in the margins, faint horizontal rule lines,
    // sparse red margin scribbles, warm-brown ink dividers with perspective
    // ticks, and a baked "p. 247" page number per tile. Tiled along Z so it
    // covers the full track length without stretching the paper artifacts.
    const floorWidth = LANE_X[LANE_COUNT - 1] - LANE_X[0] + 3
    const paper = createPaperFloorTexture()
    paper.repeat.set(1, PAPER_REPEAT_V)

    const floorGeo = new THREE.PlaneGeometry(floorWidth, TRACK_LENGTH)
    // MeshBasicMaterial — texture already has all the value baked in, we don't
    // want directional lighting to darken the cream paper.
    const floorMat = new THREE.MeshBasicMaterial({ map: paper })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.z = SPAWN_Z / 2 + DESPAWN_Z / 2
    this.trackGroup.add(floor)

    // Page-edge shadow — a thin band right at the player's feet, painted
    // with a vertical gradient so it reads as the paper having physical
    // thickness as the camera looks down on it.
    const edgeTex = createPageEdgeShadowTexture()
    const edgeGeo = new THREE.PlaneGeometry(floorWidth, 3.2)
    const edgeMat = new THREE.MeshBasicMaterial({ map: edgeTex, transparent: true, depthWrite: false })
    const edge = new THREE.Mesh(edgeGeo, edgeMat)
    edge.rotation.x = -Math.PI / 2
    // Position so the "near" (dark) edge of the gradient lands right at the
    // front of the visible floor, just behind the player. Texture's V=1 is
    // bottom; with rotation.x = -π/2 the plane is laid flat with V=1 facing
    // the camera. Center the plane at z = 4 so it covers ~z=2.4 to z=5.6.
    edge.position.set(0, 0.015, 4.0)
    this.trackGroup.add(edge)

    // Page-number decal pool — small flat planes scrolling at track speed,
    // recycled with the next page number when they pass the player.
    this.buildPageNumberDecals()

    this.scene.add(this.trackGroup)
  }

  private buildPageNumberDecals() {
    // Stagger initial Z positions so the decals are spread along the track.
    const initialZs = [-20, -45, -70, -85]
    const xSides = [-PAGE_NUMBER_X, PAGE_NUMBER_X, -PAGE_NUMBER_X, PAGE_NUMBER_X]

    for (let i = 0; i < PAGE_NUMBER_POOL_SIZE; i++) {
      const canvas = createPageNumberCanvas()
      drawPageNumberTexture(canvas, this.nextPageNumber++)
      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace

      const geo = new THREE.PlaneGeometry(1.4, 0.55)
      const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.rotation.x = -Math.PI / 2
      mesh.position.set(xSides[i], 0.02, initialZs[i])
      this.trackGroup.add(mesh)
      this.pageNumberDecals.push({
        mesh,
        canvas,
        texture,
        currentNumber: this.nextPageNumber - 1,
      })
    }
  }

  // Per-frame scroll: page-number decals move with the track speed and
  // recycle to far-Z with the next page number when they pass the player.
  private updatePageNumberDecals(dt: number) {
    const speed = this.currentTrackSpeed()
    for (const d of this.pageNumberDecals) {
      d.mesh.position.z += speed * dt
      if (d.mesh.position.z > DESPAWN_Z + 2) {
        d.currentNumber = this.nextPageNumber++
        drawPageNumberTexture(d.canvas, d.currentNumber)
        d.texture.needsUpdate = true
        d.mesh.position.z = SPAWN_Z - 4 + Math.random() * 6
      }
    }
  }

  private buildPlayer() {
    // Stylized geometric owl scholar — replaces the placeholder cube. Built
    // entirely from primitives in playerOwl.ts. `root` is the engine-facing
    // group (= this.player), `visual` is the bob-carrying child.
    this.owl = createOwl()
    this.player = this.owl.root
    this.player.position.set(this.playerX, this.playerY, PLAYER_Z)
    this.scene.add(this.player)
  }

  private buildParticles() {
    // Soft circular glow texture, drawn once
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.4, 'rgba(255,255,255,0.6)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    this.particleTexture = new THREE.CanvasTexture(canvas)

    this.particleGoldMat = new THREE.SpriteMaterial({
      map: this.particleTexture,
      color: 0xfbbf24,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.particleRedMat = new THREE.SpriteMaterial({
      map: this.particleTexture,
      color: 0xef4444,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      const sprite = new THREE.Sprite(this.particleGoldMat)
      sprite.scale.set(0.4, 0.4, 1)
      sprite.visible = false
      this.scene.add(sprite)
      this.particles.push({ sprite, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0.5, active: false })
    }
  }

  private emitParticles(at: THREE.Vector3, kind: 'collect' | 'hit', count = 8) {
    const mat = kind === 'collect' ? this.particleGoldMat : this.particleRedMat
    let emitted = 0
    for (const p of this.particles) {
      if (p.active || emitted >= count) continue
      p.active = true
      p.sprite.visible = true
      p.sprite.material = mat
      p.sprite.position.copy(at)
      // random outward velocity
      const theta = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 3
      p.vx = Math.cos(theta) * speed
      p.vy = 1.5 + Math.random() * 2.5
      p.vz = Math.sin(theta) * speed * 0.5
      p.maxLife = 0.55
      p.life = p.maxLife
      emitted++
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      if (!p.active) continue
      p.life -= dt
      if (p.life <= 0) {
        p.active = false
        p.sprite.visible = false
        continue
      }
      // gravity & integration
      p.vy -= 6 * dt
      p.sprite.position.x += p.vx * dt
      p.sprite.position.y += p.vy * dt
      p.sprite.position.z += p.vz * dt
      const fade = Math.max(0, p.life / p.maxLife)
      p.sprite.material.opacity = fade
      const s = 0.4 * (0.5 + 0.5 * fade)
      p.sprite.scale.set(s, s, 1)
    }
  }

  private buildPool() {
    this.cardTextures = createCardTextures() as Record<CitationType, THREE.Texture>
    this.spriteMaterials = {} as Record<CitationType, THREE.SpriteMaterial>
    for (const t of Object.keys(CITATION_SPECS) as CitationType[]) {
      this.spriteMaterials[t] = new THREE.SpriteMaterial({
        map: this.cardTextures[t],
        transparent: true,
        depthWrite: false,
      })
    }
    // visual scale (world units) — keep aspect; height ≈ OBJECT_SIZE.h * 1.6 so cards read big
    const scaleH = OBJECT_SIZE.h * 1.7
    const scaleW = scaleH * CARD_ASPECT
    for (let i = 0; i < OBJECT_POOL_SIZE; i++) {
      const sprite = new THREE.Sprite(this.spriteMaterials.trusted)
      sprite.scale.set(scaleW, scaleH, 1)
      sprite.visible = false
      this.scene.add(sprite)
      this.pool.push({
        sprite, type: 'trusted', lane: 0, airborne: false, active: false,
        bobPhase: 0, restY: 0, baseScaleW: scaleW, baseScaleH: scaleH,
      })
    }
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  private onKeyDown(e: KeyboardEvent) {
    // Ignore game keys while a form field has focus — otherwise typing a space
    // in the intake form fires preventDefault() and the user can't type spaces.
    const t = e.target as HTMLElement | null
    if (t) {
      const tag = t.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable) return
    }
    // Only react to game controls while the run is active. Pre-run / post-run
    // navigation is handled at the App-level screen router, not here.
    if (this.state.phase !== 'running') return
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        e.preventDefault(); this.moveLeft(); break
      case 'ArrowRight':
      case 'KeyD':
        e.preventDefault(); this.moveRight(); break
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        e.preventDefault(); this.jump(); break
    }
  }

  // ── Spawning ──────────────────────────────────────────────────────────────

  private currentPhase() {
    const elapsed = GAME_DURATION_S - this.state.timeRemaining
    for (const p of SPAWN_PHASES) {
      if (elapsed < p.untilSeconds) return p
    }
    return SPAWN_PHASES[SPAWN_PHASES.length - 1]
  }

  private currentTrackSpeed() {
    const t = (GAME_DURATION_S - this.state.timeRemaining) / GAME_DURATION_S
    return TRACK_SPEED_START + (TRACK_SPEED_END - TRACK_SPEED_START) * Math.min(1, Math.max(0, t))
  }

  private laneIsClear(lane: number): boolean {
    // True if no active object in this lane is within MIN_SPAWN_GAP_Z of the spawn line.
    for (const p of this.pool) {
      if (!p.active) continue
      if (p.lane !== lane) continue
      if (p.sprite.position.z < SPAWN_Z + MIN_SPAWN_GAP_Z) return false
    }
    return true
  }

  private spawnCitation(forceLane?: number): PoolEntry | null {
    const slot = this.pool.find(p => !p.active)
    if (!slot) return null

    const phase = this.currentPhase()
    const isTrusted = Math.random() < phase.trustedShare
    let type: CitationType
    if (isTrusted) {
      type = 'trusted'
    } else {
      const totalWeight = phase.badTypes.reduce((s, t) => s + CITATION_SPECS[t].badPoolWeight, 0)
      let r = Math.random() * totalWeight
      type = phase.badTypes[0]
      for (const t of phase.badTypes) {
        r -= CITATION_SPECS[t].badPoolWeight
        if (r <= 0) { type = t; break }
      }
    }

    let lane: number
    if (forceLane !== undefined) {
      if (!this.laneIsClear(forceLane)) return null
      lane = forceLane
    } else {
      // pick the first clear lane in a random order; bail if all three are too crowded
      const candidates = [0, 1, 2].sort(() => Math.random() - 0.5)
      const choice = candidates.find(l => this.laneIsClear(l))
      if (choice === undefined) return null
      lane = choice
    }

    const airborne =
      !isTrusted &&
      CITATION_SPECS[type].airborneEligible &&
      Math.random() < phase.airborneChance

    const restY = airborne ? AIRBORNE_Y : GROUND_Y
    slot.active = true
    slot.type = type
    slot.lane = lane
    slot.airborne = airborne
    slot.sprite.material = this.spriteMaterials[type]
    slot.sprite.visible = true
    slot.sprite.position.set(LANE_X[lane], restY, SPAWN_Z)
    slot.sprite.scale.set(slot.baseScaleW, slot.baseScaleH, 1)
    slot.restY = restY
    slot.bobPhase = Math.random() * Math.PI * 2  // random per spawn so cards don't bob in lockstep
    return slot
  }

  private maybeSpawn(dt: number) {
    const phase = this.currentPhase()
    this.spawnAccumulator += dt
    while (this.spawnAccumulator >= phase.spawnEverySeconds) {
      this.spawnAccumulator -= phase.spawnEverySeconds
      const first = this.spawnCitation()
      if (first && Math.random() < phase.multiLaneChance) {
        // pick a different lane for the second object
        const otherLanes = [0, 1, 2].filter(l => l !== first.lane)
        const lane2 = otherLanes[Math.floor(Math.random() * otherLanes.length)]
        this.spawnCitation(lane2)
      }
    }
  }

  // ── Per-frame updates ─────────────────────────────────────────────────────

  private updatePlayer(dt: number) {
    // lane lerp
    const targetX = LANE_X[this.playerTargetLane]
    const dx = targetX - this.playerX
    const step = Math.sign(dx) * Math.min(Math.abs(dx), PLAYER_LATERAL_SPEED * dt)
    this.playerX += step
    if (Math.abs(targetX - this.playerX) < 0.01) {
      this.playerX = targetX
    }

    // jump arc
    if (this.jumpT >= 0) {
      this.jumpT += dt
      const t = this.jumpT / JUMP_DURATION
      if (t >= 1) {
        this.jumpT = -1
        this.playerY = PLAYER_Y_GROUND
      } else {
        // sine arc for smooth up/down
        this.playerY = PLAYER_Y_GROUND + Math.sin(Math.PI * t) * JUMP_PEAK
      }
    }

    this.player.position.set(this.playerX, this.playerY, PLAYER_Z)

    // Owl rig: running bob + wing flap + foot alternation + head tilt, plus
    // jump pose, lane roll, and hit shake. All purely visual — does not
    // affect collision (which uses playerX/playerY/PLAYER_Z directly).
    this.updateOwlAnimation(dt)
  }

  private updateOwlAnimation(dt: number) {
    const owl = this.owl
    const t = this.time
    const jumping = this.jumpT >= 0
    const jumpProgress = jumping ? Math.min(1, this.jumpT / JUMP_DURATION) : 0
    // sine envelope peaks at apex (progress = 0.5) → 1, eases to 0 at takeoff/landing
    const jumpEnvelope = jumping ? Math.sin(Math.PI * jumpProgress) : 0

    // Running cycle phase (radians) — drives bob, flap, foot swing, head tilt.
    const cycleOmega = (2 * Math.PI) / OWL_ANIM.runCycleSeconds
    const phase = t * cycleOmega
    const sinPhase = Math.sin(phase)

    // ── Running bob on the visual sub-group ────────────────────────────────
    // Only when grounded; in the air, the body holds a forward-tilt pose.
    owl.visual.position.y = jumping ? 0 : sinPhase * OWL_ANIM.runBobAmplitude

    // ── Wings: alternating flap when running, both extend out when jumping ─
    if (jumping) {
      const extend = jumpEnvelope * OWL_ANIM.jumpWingExtendRad
      owl.leftWing.rotation.z  = -extend
      owl.rightWing.rotation.z = +extend
    } else {
      // Same-sign rotation on both wings = ALTERNATING flap (left up while
      // right down, by pivot symmetry — see the owl rig file for the geometry
      // reasoning).
      const flap = sinPhase * OWL_ANIM.runFlapAmplitudeRad
      owl.leftWing.rotation.z  = flap
      owl.rightWing.rotation.z = flap
    }

    // ── Feet: forward/back alternation when running, tucked when jumping ───
    if (jumping) {
      const tuck = jumpEnvelope * OWL_ANIM.jumpFootTuckY
      owl.leftFoot.position.y  = -0.62 + tuck
      owl.rightFoot.position.y = -0.62 + tuck
      owl.leftFoot.position.z  = 0
      owl.rightFoot.position.z = 0
    } else {
      owl.leftFoot.position.y  = -0.62
      owl.rightFoot.position.y = -0.62
      owl.leftFoot.position.z  =  sinPhase * OWL_ANIM.runFootSwingZ
      owl.rightFoot.position.z = -sinPhase * OWL_ANIM.runFootSwingZ
    }

    // ── Head: subtle bob-coupled tilt; stays mostly steady ─────────────────
    owl.head.rotation.x = sinPhase * OWL_ANIM.runHeadTiltRad

    // ── Tail: tiny wag in sync with bob — adds to the resting droop angle ──
    // Tail's rest rotation.x = -0.32 (drooping down). Wag adds a small swing.
    owl.tail.rotation.x = -0.32 + sinPhase * OWL_ANIM.runTailWagRad
    owl.tail.rotation.y = sinPhase * OWL_ANIM.runTailWagRad * 0.6

    // ── Body roll: lane-switch tilt (target lerped, smooth) ────────────────
    // Roll proportional to "how far we still are from the target lane",
    // clamped, then eased toward that target so the roll feels weighted.
    const laneDelta = LANE_X[this.playerTargetLane] - this.playerX
    const targetRoll = jumping
      ? 0
      : THREE.MathUtils.clamp(
          laneDelta * OWL_ANIM.laneTiltScale,
          -OWL_ANIM.laneTiltMaxRad,
          +OWL_ANIM.laneTiltMaxRad,
        )
    this.playerRoll = THREE.MathUtils.lerp(this.playerRoll, targetRoll, OWL_ANIM.laneTiltLerp)

    // ── Hit shake: ±10° body wobble + pupil scale-up (180ms total) ─────────
    let shakeRoll = 0
    let pupilMul = 1
    if (this.playerShakeT > 0) {
      this.playerShakeT = Math.max(0, this.playerShakeT - dt)
      const remaining = this.playerShakeT / OWL_ANIM.hitShakeDuration
      // High-frequency wobble that decays with the timer.
      shakeRoll = Math.sin(this.time * 80) * OWL_ANIM.hitShakeAmpRad * remaining
      // Pupils scale up while shaking, return to baseline as it fades.
      pupilMul = 1 + (OWL_ANIM.hitPupilScaleMul - 1) * remaining
    }
    // Pupil scale (mesh.scale, applied to a unit-sphere geometry → base * mul)
    owl.leftPupil.scale.setScalar(0.08 * pupilMul)
    owl.rightPupil.scale.setScalar(0.08 * pupilMul)

    // ── Compose final rotations on the root ────────────────────────────────
    // X: forward tilt during jump (negative X tilts top toward -Z = forward).
    this.player.rotation.x = -jumpEnvelope * OWL_ANIM.jumpForwardTiltRad
    // Z: lane roll + hit shake.
    this.player.rotation.z = this.playerRoll + shakeRoll
  }

  private updateCitations(dt: number) {
    const speed = this.currentTrackSpeed()
    const t = this.time
    for (const p of this.pool) {
      if (!p.active) continue

      // Scroll toward the player.
      p.sprite.position.z += speed * dt

      // ── Per-card visual animation (cheap: 1–2 sin calls per card) ─────────
      //
      // Bob: a small vertical oscillation. ~2s cycle, ~0.08 world units of
      //  amplitude. bobPhase is randomized per spawn so the field never
      //  pulses in lockstep.
      const bobOmega = Math.PI       // 2π/2s
      const bobY = Math.sin(t * bobOmega + p.bobPhase) * 0.08
      p.sprite.position.y = p.restY + bobY

      // Type-specific overlay animations:
      switch (p.type) {
        case 'trusted': {
          // Soft pulse — ~1.5s cycle, ±4% scale. Reads as "breathing glow".
          const pulse = 1 + Math.sin(t * (2 * Math.PI / 1.5) + p.bobPhase) * 0.04
          p.sprite.scale.set(p.baseScaleW * pulse, p.baseScaleH * pulse, 1)
          break
        }
        case 'predatory': {
          // Slow ominous pulse — ~3.5s cycle, ±5% scale.
          const pulse = 1 + Math.sin(t * (2 * Math.PI / 3.5) + p.bobPhase) * 0.05
          p.sprite.scale.set(p.baseScaleW * pulse, p.baseScaleH * pulse, 1)
          break
        }
        case 'hallucinated': {
          // Occasional brief displacement on X. Derived deterministically from
          //  (time + phase) so each card "glitches" at different moments without
          //  per-frame Math.random allocations.
          const wave = Math.sin(t * 1.7 + p.bobPhase * 3.1)
          const glitchActive = wave > 0.96
          const offset = glitchActive ? (Math.sin(t * 53 + p.bobPhase * 17) * 0.18) : 0
          p.sprite.position.x = LANE_X[p.lane] + offset
          break
        }
        default:
          // preprint, paywalled — static textures, only bob. No scale anim.
          p.sprite.scale.set(p.baseScaleW, p.baseScaleH, 1)
          break
      }

      // Despawn if it slipped past the player.
      if (p.sprite.position.z > DESPAWN_Z) {
        if (p.type !== 'trusted') {
          const key = `${p.type}_dodged` as keyof RunStats
          this.state.stats[key] += 1
          this.state.score += CITATION_SPECS[p.type].scoreDodge
        }
        this.deactivate(p)
      }
    }
  }

  private checkCollisions() {
    const px = this.playerX
    const py = this.playerY
    const pHalfW = PLAYER_SIZE.w / 2
    const pHalfH = PLAYER_SIZE.h / 2
    const pHalfD = PLAYER_SIZE.d / 2
    const oHalfW = OBJECT_SIZE.w / 2
    const oHalfH = OBJECT_SIZE.h / 2
    const oHalfD = OBJECT_SIZE.d / 2

    for (const p of this.pool) {
      if (!p.active) continue
      const ox = p.sprite.position.x
      const oy = p.sprite.position.y
      const oz = p.sprite.position.z

      // AABB
      const overlapX = Math.abs(px - ox) < pHalfW + oHalfW
      const overlapY = Math.abs(py - oy) < pHalfH + oHalfH
      const overlapZ = Math.abs(PLAYER_Z - oz) < pHalfD + oHalfD
      if (!(overlapX && overlapY && overlapZ)) continue

      // Collision!
      const collisionPoint = new THREE.Vector3(ox, oy, oz)
      if (p.type === 'trusted') {
        const value = CITATION_SPECS.trusted.scoreCollect
        this.state.stats.trusted_collected += 1
        this.state.score += value
        this.pushPopup('collect', value)
        this.emitParticles(collisionPoint, 'collect', 14)
        this.playerBounceT = 0.22  // brief scale-up bounce on the player
        Audio.coin()
      } else {
        const hitKey = `${p.type}_hit` as keyof RunStats
        const value = CITATION_SPECS[p.type].scoreHit
        this.state.stats[hitKey] += 1
        this.state.score += value
        this.state.hits += 1
        this.pushPopup('hit', value)
        this.emitParticles(collisionPoint, 'hit', 6)
        this.shakeT = SHAKE_DURATION
        this.playerShakeT = OWL_ANIM.hitShakeDuration
        this.state.hitFlash = 1
        Audio.hit()
        if (this.state.hits >= MAX_HITS) {
          this.deactivate(p)
          this.endRun('hits')
          return
        }
      }
      this.deactivate(p)
    }
  }

  private pushPopup(kind: 'collect' | 'hit', value: number) {
    this.state.popups.push({ id: this.nextPopupId++, kind, value, ttl: 0.9 })
    // hard cap to avoid runaway
    if (this.state.popups.length > 6) this.state.popups.shift()
  }

  private updatePopups(dt: number) {
    if (this.state.popups.length === 0) return
    for (const e of this.state.popups) e.ttl -= dt
    this.state.popups = this.state.popups.filter(e => e.ttl > 0)
  }

  private updateShakeAndFlash(dt: number) {
    if (this.shakeT > 0) {
      this.shakeT = Math.max(0, this.shakeT - dt)
      const amp = (this.shakeT / SHAKE_DURATION) * 0.18
      this.camera.position.set(
        this.cameraBasePos.x + (Math.random() - 0.5) * amp * 2,
        this.cameraBasePos.y + (Math.random() - 0.5) * amp * 2,
        this.cameraBasePos.z,
      )
    } else {
      this.camera.position.copy(this.cameraBasePos)
    }
    if (this.state.hitFlash > 0) {
      this.state.hitFlash = Math.max(0, this.state.hitFlash - dt / HIT_FLASH_DURATION)
    }
  }

  // Brief scale-up bounce on the player when collecting a trusted citation —
  // 220ms total, peaks at +15% scale halfway through. Cheap (one sin call/frame).
  private updatePlayerBounce(dt: number) {
    if (this.playerBounceT > 0) {
      this.playerBounceT = Math.max(0, this.playerBounceT - dt)
      const t = 1 - this.playerBounceT / 0.22
      const bump = Math.sin(t * Math.PI) * 0.15
      const s = 1 + bump
      this.player.scale.set(s, s, s)
    } else {
      this.player.scale.set(1, 1, 1)
    }
  }

  private deactivate(p: PoolEntry) {
    p.active = false
    p.sprite.visible = false
  }

  private deactivateAll() {
    for (const p of this.pool) this.deactivate(p)
  }

  // ── Loop ──────────────────────────────────────────────────────────────────

  private tickLoop = () => {
    this.rafId = requestAnimationFrame(this.tickLoop)
    const now = performance.now()
    const dt = Math.min(0.05, (now - this.lastFrameTime) / 1000) // clamp huge gaps (tab switch)
    this.lastFrameTime = now

    if (this.state.phase === 'running' && !this.paused) {
      this.time += dt
      this.state.timeRemaining = Math.max(0, this.state.timeRemaining - dt)
      this.maybeSpawn(dt)
      this.updatePlayer(dt)
      this.updateCitations(dt)
      this.updatePageNumberDecals(dt)
      this.checkCollisions()
      if (this.state.phase === 'running' && this.state.timeRemaining <= 0) {
        this.endRun('time')
      }
    }

    // Particle/shake/popup updates: continue during the game-over freeze-frame so the
    // collision burst finishes, but freeze entirely while paused (mid-game tab away).
    if (!this.paused) {
      this.updateParticles(dt)
      this.updateShakeAndFlash(dt)
      this.updatePopups(dt)
      this.updatePlayerBounce(dt)
    }
    if (this.state.phase !== 'idle') this.emit()

    this.renderer.render(this.scene, this.camera)
  }

  private endRun(reason: EndedBy) {
    this.state.phase = 'over'
    this.state.endedBy = reason
    if (reason === 'time' && this.state.hits < MAX_HITS) {
      this.state.score += FULL_RUN_BONUS
    }
    this.emit()
  }

  private emit() {
    // shallow copy so React subscribers see a new reference
    const snapshot: GameState = {
      phase: this.state.phase,
      paused: this.paused,
      timeRemaining: this.state.timeRemaining,
      score: this.state.score,
      hits: this.state.hits,
      endedBy: this.state.endedBy,
      stats: { ...this.state.stats },
      hitFlash: this.state.hitFlash,
      popups: this.state.popups.slice(),
    }
    this.subs.forEach(fn => fn(snapshot))
  }

  // ── Resize ────────────────────────────────────────────────────────────────

  private handleResize() {
    const w = this.canvas.clientWidth || this.canvas.parentElement?.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || this.canvas.parentElement?.clientHeight || window.innerHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }
}

