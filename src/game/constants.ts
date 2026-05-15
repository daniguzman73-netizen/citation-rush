// Lane geometry
export const LANE_COUNT = 3
export const LANE_WIDTH = 2.2
// x-position per lane index (0 = left, 1 = center, 2 = right)
export const LANE_X: readonly number[] = [-LANE_WIDTH, 0, LANE_WIDTH]

// Track / world
export const TRACK_LENGTH = 90
export const SPAWN_Z = -TRACK_LENGTH        // far end, objects spawn here
export const DESPAWN_Z = 8                  // past the player, recycle here
export const PLAYER_Z = 0

// Player
export const PLAYER_LANE_START = 1
export const PLAYER_LATERAL_SPEED = 14      // units/sec — fast lane snap
export const PLAYER_SIZE = { w: 0.9, h: 1.4, d: 0.6 }
export const PLAYER_Y_GROUND = PLAYER_SIZE.h / 2

// Jump
export const JUMP_DURATION = 0.6            // seconds — spec §5 "~600ms hang time"
export const JUMP_PEAK = 1.6                // peak y above ground

// Track speed (scrolling toward camera)
export const TRACK_SPEED_START = 18
export const TRACK_SPEED_END = 26           // at t=60s — tuned down from 28 once card sprites replaced cubes (larger silhouette)

// Spawn safety: don't spawn into a lane that already has an active object within this Z distance of SPAWN_Z.
// Prevents pile-ups that the player cannot react to.
export const MIN_SPAWN_GAP_Z = 6

// Game rules
export const GAME_DURATION_S = 60
export const MAX_HITS = 3
export const FULL_RUN_BONUS = 200

// Citation types (Phase 1 = placeholder colored cubes)
export type CitationType =
  | 'trusted'
  | 'preprint'
  | 'paywalled'
  | 'predatory'
  | 'hallucinated'

export const ALL_BAD_TYPES: readonly CitationType[] = [
  'preprint',
  'paywalled',
  'predatory',
  'hallucinated',
]

export interface CitationSpec {
  color: number
  scoreCollect: number
  scoreDodge: number
  scoreHit: number
  // Phase 3 spawn weight inside the "bad" pool
  badPoolWeight: number
  // some bad types appear airborne in late-game and require a jump
  airborneEligible: boolean
}

export const CITATION_SPECS: Record<CitationType, CitationSpec> = {
  trusted:      { color: 0x22c55e, scoreCollect: 100, scoreDodge: 0,  scoreHit: 0,    badPoolWeight: 0,    airborneEligible: false },
  preprint:     { color: 0xfacc15, scoreCollect: 0,   scoreDodge: 10, scoreHit: -50,  badPoolWeight: 0.30, airborneEligible: false },
  paywalled:    { color: 0xf97316, scoreCollect: 0,   scoreDodge: 15, scoreHit: -50,  badPoolWeight: 0.30, airborneEligible: true  },
  predatory:    { color: 0xdc2626, scoreCollect: 0,   scoreDodge: 25, scoreHit: -100, badPoolWeight: 0.20, airborneEligible: false },
  hallucinated: { color: 0xa855f7, scoreCollect: 0,   scoreDodge: 25, scoreHit: -100, badPoolWeight: 0.20, airborneEligible: true  },
}

// Spawn pacing (spec §4 Screen 5 "Spawn pacing")
export interface SpawnPhase {
  untilSeconds: number      // active while elapsed < this
  spawnEverySeconds: number // mean cadence
  trustedShare: number      // fraction of spawns that are trusted (collectible)
  badTypes: readonly CitationType[]
  multiLaneChance: number   // probability a spawn includes a second object in another lane
  airborneChance: number    // probability a spawned bad citation is airborne (requires jump)
}

export const SPAWN_PHASES: readonly SpawnPhase[] = [
  // 0–20s: easy — predatory + paywalled only as bad, mostly trusted
  { untilSeconds: 20, spawnEverySeconds: 1.0,  trustedShare: 0.60, badTypes: ['predatory', 'paywalled'],         multiLaneChance: 0.0,  airborneChance: 0.0 },
  // 20–40s: medium — all 4 bad types, occasional 2-lane
  { untilSeconds: 40, spawnEverySeconds: 0.67, trustedShare: 0.50, badTypes: ALL_BAD_TYPES,                       multiLaneChance: 0.25, airborneChance: 0.0 },
  // 40–60s: fast — multi-lane + airborne (loosened slightly from 0.50s after cards-not-cubes increased visual density)
  { untilSeconds: 60, spawnEverySeconds: 0.55, trustedShare: 0.45, badTypes: ALL_BAD_TYPES,                       multiLaneChance: 0.40, airborneChance: 0.35 },
]

// Pool size — one geometry, many instances; sized for worst-case 2/s × ~5s in flight × 2-lane = 20
export const OBJECT_POOL_SIZE = 32

// Collision tuning
export const OBJECT_SIZE = { w: 1.2, h: 0.9, d: 0.6 }
export const AIRBORNE_Y = 1.8 // center y for airborne objects (player must jump to clear them)
export const GROUND_Y = OBJECT_SIZE.h / 2 + 0.05
