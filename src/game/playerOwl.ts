import * as THREE from 'three'

// Stylized geometric owl scholar — built entirely from Three.js primitives, no
// external models. Designed to read at ~60–100 px on screen during gameplay:
// chunky shapes, oversized head, big eyes, simple silhouette. Personality lives
// in proportion, not detail.
//
// Two nested groups:
//   - `root`   — owned by the engine; this is what `this.player` points at.
//                The engine drives position (lane lerp + jump arc), uniform
//                scale (collect-bounce), and rotation (lane-roll, jump-tilt,
//                hit-shake).
//   - `visual` — child of root; carries the running bob so it doesn't pollute
//                the collision-relevant playerY.
//
// All other animated parts (head tilt, wings, feet, pupils) are children of
// `visual` so they bob with the body.

export interface OwlRefs {
  root: THREE.Group
  visual: THREE.Group
  body: THREE.Mesh
  head: THREE.Group
  leftWing: THREE.Group
  rightWing: THREE.Group
  leftFoot: THREE.Group
  rightFoot: THREE.Group
  leftPupil: THREE.Mesh
  rightPupil: THREE.Mesh
  cap: THREE.Group
  book: THREE.Group
  disposables: { dispose: () => void }[]
}

// Warm earthy palette — won't compete with the citation cards.
const COLORS = {
  body:       0x8B6F47,   // warm brown
  bodyLight:  0x9B7F57,   // head, slightly lighter
  wing:       0x6B5535,   // darker brown
  tailTuft:   0x5C4A2D,   // darkest brown
  eyeWhite:   0xF5F1E8,   // cream-tinted white
  pupil:      0x1F1A14,   // near-black
  beak:       0xE8A03A,   // orange
  feet:       0xE8A03A,   // orange
  capDark:    0x1A1F35,   // dark navy
  tassel:     0xE0B83B,   // gold
  bookCover:  0x8B2730,   // deep red
  bookSpine:  0xD4AF37,   // gold spine
}

interface Built {
  refs: OwlRefs
}

export function createOwl(): OwlRefs {
  const disposables: { dispose: () => void }[] = []

  // ── Shared primitive geometries — one each, scaled per-mesh ──────────────
  // Sharing geometry is safe: each mesh has independent transform; we only
  // mutate mesh.scale / position / rotation, never the geometry data.
  const sphere   = new THREE.SphereGeometry(1, 16, 16)
  const cone     = new THREE.ConeGeometry(1, 1, 12)
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 12)
  const box      = new THREE.BoxGeometry(1, 1, 1)
  disposables.push(sphere, cone, cylinder, box)

  // ── Materials — flat-shaded, one subtle directional light gives depth ────
  const matBody       = new THREE.MeshStandardMaterial({ color: COLORS.body,      roughness: 0.85 })
  const matHead       = new THREE.MeshStandardMaterial({ color: COLORS.bodyLight, roughness: 0.85 })
  const matWing       = new THREE.MeshStandardMaterial({ color: COLORS.wing,      roughness: 0.90 })
  const matTail       = new THREE.MeshStandardMaterial({ color: COLORS.tailTuft,  roughness: 0.90 })
  const matEye        = new THREE.MeshStandardMaterial({ color: COLORS.eyeWhite,  roughness: 0.40 })
  const matPupil      = new THREE.MeshStandardMaterial({ color: COLORS.pupil,     roughness: 0.30 })
  const matBeak       = new THREE.MeshStandardMaterial({ color: COLORS.beak,      roughness: 0.50 })
  const matFeet       = new THREE.MeshStandardMaterial({ color: COLORS.feet,      roughness: 0.55 })
  const matCap        = new THREE.MeshStandardMaterial({ color: COLORS.capDark,   roughness: 0.70 })
  const matTassel     = new THREE.MeshStandardMaterial({ color: COLORS.tassel,    roughness: 0.50 })
  const matBookCover  = new THREE.MeshStandardMaterial({ color: COLORS.bookCover, roughness: 0.70 })
  const matBookSpine  = new THREE.MeshStandardMaterial({ color: COLORS.bookSpine, roughness: 0.50 })
  disposables.push(
    matBody, matHead, matWing, matTail, matEye, matPupil, matBeak, matFeet,
    matCap, matTassel, matBookCover, matBookSpine,
  )

  // ── Groups ────────────────────────────────────────────────────────────────
  // Root: positioned/rotated/scaled by the engine. Origin = collision center
  // (matches the old placeholder so PLAYER_SIZE / PLAYER_Y_GROUND unchanged).
  const root = new THREE.Group()
  // Visual: child for running bob — collision logic uses root.position, so
  // the bob is purely cosmetic.
  const visual = new THREE.Group()
  root.add(visual)

  // ── Body (egg-shaped, slightly narrower at top) ──────────────────────────
  // Origin at body center; body extends from y=-0.6 to y=+0.6 in local coords.
  // Owl faces -Z (forward), so wings on ±X and tail tuft on +Z (behind).
  const body = new THREE.Mesh(sphere, matBody)
  body.scale.set(0.55, 0.65, 0.45)   // 1.10 wide × 1.30 tall × 0.90 deep
  body.position.y = -0.10
  visual.add(body)

  // ── Tail tuft (small dark ovoid at back-bottom) ──────────────────────────
  const tail = new THREE.Mesh(sphere, matTail)
  tail.scale.set(0.18, 0.16, 0.14)
  tail.position.set(0, -0.32, 0.42)
  visual.add(tail)

  // ── Head (oversized — ~75% of body width) ────────────────────────────────
  const head = new THREE.Group()
  head.position.y = 0.68
  visual.add(head)

  const headSphere = new THREE.Mesh(sphere, matHead)
  headSphere.scale.set(0.45, 0.45, 0.45)
  head.add(headSphere)

  // Tiny "ear tufts" — two small triangular pokes on top of head for owl read
  const earL = new THREE.Mesh(cone, matHead)
  earL.scale.set(0.07, 0.18, 0.07)
  earL.position.set(-0.22, 0.42, 0.05)
  earL.rotation.z = 0.30
  head.add(earL)
  const earR = new THREE.Mesh(cone, matHead)
  earR.scale.set(0.07, 0.18, 0.07)
  earR.position.set(0.22, 0.42, 0.05)
  earR.rotation.z = -0.30
  head.add(earR)

  // Eyes — large white spheres, slightly forward-tilted so they read even
  // when the camera is mostly behind. ~0.3 each per the brief.
  const eyeRadius = 0.16
  const leftEye = new THREE.Mesh(sphere, matEye)
  leftEye.scale.setScalar(eyeRadius)
  leftEye.position.set(-0.22, 0.06, -0.34)
  head.add(leftEye)

  const rightEye = new THREE.Mesh(sphere, matEye)
  rightEye.scale.setScalar(eyeRadius)
  rightEye.position.set(0.22, 0.06, -0.34)
  head.add(rightEye)

  // Pupils — smaller dark spheres slightly forward of the eye centers.
  // The engine animates these on hit (scale up briefly = "surprised").
  const pupilBaseScale = 0.08
  const leftPupil = new THREE.Mesh(sphere, matPupil)
  leftPupil.scale.setScalar(pupilBaseScale)
  leftPupil.position.set(-0.22, 0.06, -0.46)
  head.add(leftPupil)

  const rightPupil = new THREE.Mesh(sphere, matPupil)
  rightPupil.scale.setScalar(pupilBaseScale)
  rightPupil.position.set(0.22, 0.06, -0.46)
  head.add(rightPupil)

  // Beak — small orange cone pointing forward (-Z).
  const beak = new THREE.Mesh(cone, matBeak)
  beak.scale.set(0.09, 0.18, 0.09)
  beak.position.set(0, -0.08, -0.42)
  beak.rotation.x = -Math.PI / 2  // apex points to -Z
  head.add(beak)

  // ── Wings — pivot at shoulder for clean flap/extend animation ────────────
  const makeWing = (side: 1 | -1): THREE.Group => {
    const pivot = new THREE.Group()
    pivot.position.set(side * 0.30, 0.18, 0)
    const wing = new THREE.Mesh(sphere, matWing)
    wing.scale.set(0.13, 0.38, 0.22)
    // Wing geometry hangs below shoulder, slightly outward.
    wing.position.set(side * 0.08, -0.22, 0.04)
    pivot.add(wing)
    visual.add(pivot)
    return pivot
  }
  const leftWing  = makeWing(-1)
  const rightWing = makeWing(+1)

  // ── Feet — pivots for forward/back alternation and tuck-up on jump ───────
  const makeFoot = (side: 1 | -1): THREE.Group => {
    const pivot = new THREE.Group()
    pivot.position.set(side * 0.16, -0.62, 0)
    const foot = new THREE.Mesh(sphere, matFeet)
    foot.scale.set(0.13, 0.08, 0.20)
    pivot.add(foot)
    visual.add(pivot)
    return pivot
  }
  const leftFoot  = makeFoot(-1)
  const rightFoot = makeFoot(+1)

  // ── Graduation cap (accessory — attached to head so it tilts with it) ────
  const cap = new THREE.Group()
  cap.position.set(0, 0.48, 0)
  // base — short cylinder
  const capBase = new THREE.Mesh(cylinder, matCap)
  capBase.scale.set(0.30, 0.12, 0.30)
  cap.add(capBase)
  // mortarboard — thin flat square
  const mortarboard = new THREE.Mesh(box, matCap)
  mortarboard.scale.set(0.68, 0.04, 0.68)
  mortarboard.position.y = 0.08
  cap.add(mortarboard)
  // tassel cord — thin gold cylinder hanging off one corner
  const tasselCord = new THREE.Mesh(cylinder, matTassel)
  tasselCord.scale.set(0.014, 0.18, 0.014)
  tasselCord.position.set(0.28, -0.02, -0.04)
  cap.add(tasselCord)
  // tassel ball — gold sphere at the end of the cord
  const tasselBall = new THREE.Mesh(sphere, matTassel)
  tasselBall.scale.setScalar(0.055)
  tasselBall.position.set(0.28, -0.17, -0.04)
  cap.add(tasselBall)
  head.add(cap)

  // ── Book under one wing (accessory — reinforces "scholar") ───────────────
  const book = new THREE.Group()
  book.position.set(0.34, -0.10, 0.06)
  book.rotation.z = 0.22
  const bookCover = new THREE.Mesh(box, matBookCover)
  bookCover.scale.set(0.09, 0.20, 0.26)
  book.add(bookCover)
  // Gold spine stripe across the top of the book
  const bookSpine = new THREE.Mesh(box, matBookSpine)
  bookSpine.scale.set(0.094, 0.022, 0.21)
  bookSpine.position.y = 0.10
  book.add(bookSpine)
  visual.add(book)

  const built: Built = {
    refs: {
      root,
      visual,
      body,
      head,
      leftWing,
      rightWing,
      leftFoot,
      rightFoot,
      leftPupil,
      rightPupil,
      cap,
      book,
      disposables,
    },
  }
  return built.refs
}

// Animation tuning — pulled out for easy iteration without grep.
export const OWL_ANIM = {
  runCycleSeconds:     0.30,      // body bob period
  runBobAmplitude:     0.06,      // ~5% of owl height (~1.2 units)
  runFlapAmplitudeRad: 0.18,      // ~10° alternating wing flap
  runFootSwingZ:       0.10,      // forward/back foot swing
  runHeadTiltRad:      0.05,      // subtle head tilt with bob
  jumpWingExtendRad:   0.55,      // ~31° wing extension at jump apex
  jumpForwardTiltRad:  0.30,      // ~17° body forward-tilt at apex
  jumpFootTuckY:       0.18,      // feet lift toward body during jump
  hitShakeDuration:    0.18,      // total hit-shake time
  hitShakeAmpRad:      0.18,      // ~10° body wobble
  hitPupilScaleMul:    1.7,       // pupils briefly enlarge
  laneTiltScale:       0.50,      // how much lateral-delta translates to roll
  laneTiltMaxRad:      0.20,      // ~11.5° max roll during lane switch
  laneTiltLerp:        0.22,      // ease toward target each frame
}
