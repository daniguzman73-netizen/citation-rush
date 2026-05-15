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
  type CitationType,
} from './constants'
import { createCardTextures, CARD_ASPECT } from './cardTexture'

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
}

export type GamePhase = 'idle' | 'running' | 'over'

export interface GameState {
  phase: GamePhase
  timeRemaining: number  // seconds, clamped to [0, GAME_DURATION_S]
  score: number
  hits: number
  endedBy: EndedBy | null
  stats: RunStats
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
})

const initialState = (): GameState => ({
  phase: 'idle',
  timeRemaining: GAME_DURATION_S,
  score: 0,
  hits: 0,
  endedBy: null,
  stats: emptyStats(),
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
}

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

  private state: GameState = initialState()
  private subs = new Set<Subscriber>()

  private spawnAccumulator = 0
  private lastFrameTime = 0
  private rafId: number | null = null
  private resizeObserver: ResizeObserver | null = null
  private boundKeyDown: (e: KeyboardEvent) => void

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x0b0b14, 1)

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog(0x0b0b14, 25, TRACK_LENGTH * 0.9)

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200)
    this.camera.position.set(0, 4.5, 7)
    this.camera.lookAt(0, 1.0, -10)

    this.buildLights()
    this.buildTrack()
    this.buildPlayer()
    this.buildPool()

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
    this.state = initialState()
    this.state.phase = 'running'
    this.playerTargetLane = PLAYER_LANE_START
    this.playerX = LANE_X[PLAYER_LANE_START]
    this.playerY = PLAYER_Y_GROUND
    this.jumpT = -1
    this.spawnAccumulator = 0
    this.deactivateAll()
    this.emit()

    this.lastFrameTime = performance.now()
    this.tickLoop()
  }

  dispose(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId)
    window.removeEventListener('keydown', this.boundKeyDown)
    this.resizeObserver?.disconnect()
    // Three.js cleanup
    for (const t of Object.keys(this.spriteMaterials) as CitationType[]) {
      this.spriteMaterials[t].dispose()
      this.cardTextures[t].dispose()
    }
    this.renderer.dispose()
  }

  // Touch / external input
  moveLeft(): void  { if (this.state.phase === 'running' && this.playerTargetLane > 0)             this.playerTargetLane -= 1 }
  moveRight(): void { if (this.state.phase === 'running' && this.playerTargetLane < LANE_COUNT - 1) this.playerTargetLane += 1 }
  jump(): void {
    if (this.state.phase === 'running' && this.jumpT < 0) this.jumpT = 0
  }

  // ── Scene construction ────────────────────────────────────────────────────

  private buildLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.55)
    const dir = new THREE.DirectionalLight(0xffffff, 0.9)
    dir.position.set(5, 10, 5)
    this.scene.add(ambient, dir)
  }

  private buildTrack() {
    this.trackGroup = new THREE.Group()

    // Floor — a long plane under the lanes
    const floorWidth = LANE_X[LANE_COUNT - 1] - LANE_X[0] + 3
    const floorGeo = new THREE.PlaneGeometry(floorWidth, TRACK_LENGTH)
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1d1d2b, roughness: 0.9 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.z = SPAWN_Z / 2 + DESPAWN_Z / 2
    this.trackGroup.add(floor)

    // Lane dividers
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x4a4a6a })
    for (let i = 0; i <= LANE_COUNT; i++) {
      const x = LANE_X[0] - LANE_WIDTH_HALF() + i * LANE_WIDTH_FULL()
      const lineGeo = new THREE.PlaneGeometry(0.05, TRACK_LENGTH)
      const line = new THREE.Mesh(lineGeo, lineMat)
      line.rotation.x = -Math.PI / 2
      line.position.set(x, 0.01, SPAWN_Z / 2 + DESPAWN_Z / 2)
      this.trackGroup.add(line)
    }

    this.scene.add(this.trackGroup)
  }

  private buildPlayer() {
    this.player = new THREE.Group()
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(PLAYER_SIZE.w, PLAYER_SIZE.h, PLAYER_SIZE.d),
      new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.5 }),
    )
    body.position.y = 0
    this.player.add(body)

    // small "head" cube so orientation reads
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.5 }),
    )
    head.position.y = PLAYER_SIZE.h / 2 + 0.3
    this.player.add(head)

    this.player.position.set(this.playerX, this.playerY, PLAYER_Z)
    this.scene.add(this.player)
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
    // visual scale (world units) — keep aspect; height ≈ OBJECT_SIZE.h * 1.4 so cards read big
    const scaleH = OBJECT_SIZE.h * 1.6
    const scaleW = scaleH * CARD_ASPECT
    for (let i = 0; i < OBJECT_POOL_SIZE; i++) {
      const sprite = new THREE.Sprite(this.spriteMaterials.trusted)
      sprite.scale.set(scaleW, scaleH, 1)
      sprite.visible = false
      this.scene.add(sprite)
      this.pool.push({ sprite, type: 'trusted', lane: 0, airborne: false, active: false })
    }
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  private onKeyDown(e: KeyboardEvent) {
    if (this.state.phase === 'idle' || this.state.phase === 'over') {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        this.start()
      }
      return
    }
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

    const lane = forceLane ?? Math.floor(Math.random() * LANE_COUNT)
    const airborne =
      !isTrusted &&
      CITATION_SPECS[type].airborneEligible &&
      Math.random() < phase.airborneChance

    slot.active = true
    slot.type = type
    slot.lane = lane
    slot.airborne = airborne
    slot.sprite.material = this.spriteMaterials[type]
    slot.sprite.visible = true
    slot.sprite.position.set(LANE_X[lane], airborne ? AIRBORNE_Y : GROUND_Y, SPAWN_Z)
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
  }

  private updateCitations(dt: number) {
    const speed = this.currentTrackSpeed()
    for (const p of this.pool) {
      if (!p.active) continue
      p.sprite.position.z += speed * dt
      if (p.sprite.position.z > DESPAWN_Z) {
        // passed the player without collision
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
      if (p.type === 'trusted') {
        this.state.stats.trusted_collected += 1
        this.state.score += CITATION_SPECS.trusted.scoreCollect
      } else {
        const hitKey = `${p.type}_hit` as keyof RunStats
        this.state.stats[hitKey] += 1
        this.state.score += CITATION_SPECS[p.type].scoreHit
        this.state.hits += 1
        if (this.state.hits >= MAX_HITS) {
          this.deactivate(p)
          this.endRun('hits')
          return
        }
      }
      this.deactivate(p)
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

    if (this.state.phase === 'running') {
      this.state.timeRemaining = Math.max(0, this.state.timeRemaining - dt)
      this.maybeSpawn(dt)
      this.updatePlayer(dt)
      this.updateCitations(dt)
      this.checkCollisions()
      if (this.state.phase === 'running' && this.state.timeRemaining <= 0) {
        this.endRun('time')
      }
      this.emit()
    }

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
      timeRemaining: this.state.timeRemaining,
      score: this.state.score,
      hits: this.state.hits,
      endedBy: this.state.endedBy,
      stats: { ...this.state.stats },
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

// LANE_WIDTH math helpers (kept inline to avoid an import cycle for two numbers)
function LANE_WIDTH_FULL() { return LANE_X[1] - LANE_X[0] }
function LANE_WIDTH_HALF() { return LANE_WIDTH_FULL() / 2 }
