import * as THREE from 'three'

// Stylized geometric owl scholar — rebuilt for rear-three-quarter camera read.
//
// The previous pass landed as a featureless dark blob: equal-sized head and
// body, dark saturated brown, no visible ear tufts/wings/tail/feet from the
// camera. This pass fixes the silhouette so all four bird identifiers (ear
// tufts, wings, tail, feet) read from behind, body is pear-shaped, and the
// palette is light enough to pop against the cream paper world.
//
// Hierarchy:
//   root (= this.player) — engine drives position / scale / rotation
//   └── visual            — child group; carries the running bob
//       ├── body          — sandy tan sphere, taller than wide (pear body)
//       ├── belly         — pale cream patch on front
//       ├── tail          — darker-brown wedge sticking BACK (+Z, toward camera)
//       ├── leftWing      — pivoted group, hangs outward-down on -X
//       ├── rightWing     — pivoted group, hangs outward-down on +X
//       ├── leftFoot      — pivoted group, alternates forward/back
//       ├── rightFoot     — pivoted group, alternates forward/back
//       ├── book          — accessory under LEFT wing (-X)
//       └── head          — own group for tilt
//           ├── headSphere
//           ├── faceDisc  — pale cream disc on front
//           ├── leftEar   — body-color cone, outward + back-tilted
//           ├── rightEar
//           ├── leftEye / leftPupil
//           ├── rightEye / rightPupil
//           ├── beak      — orange cone
//           └── cap       — graduation cap accessory

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
  tail: THREE.Mesh
  cap: THREE.Group
  book: THREE.Group
  disposables: { dispose: () => void }[]
}

// Warm, light palette — should pop against the cream paper background.
const COLORS = {
  body:       0xC8A878,   // sandy tan
  belly:      0xE8D5B7,   // pale buff cream
  head:       0xD4B896,   // slightly lighter tan than body
  faceDisc:   0xF0E2C4,   // pale cream — barn-owl style facial disc
  wing:       0x8B6F47,   // darker brown for contrast
  tail:       0x6B5535,   // darkest brown
  eyeWhite:   0xF5F1E8,   // warm white
  pupil:      0x1F1A14,   // near-black
  beak:       0xE8A03A,   // orange
  feet:       0xE8A03A,   // orange
  capDark:    0x1A2B45,   // deep navy (not pure black, reads warmer)
  tassel:     0xE0B83B,   // gold
  bookCover:  0x8B2730,   // deep red
  bookSpine:  0xD4AF37,   // gold spine
}

export function createOwl(): OwlRefs {
  const disposables: { dispose: () => void }[] = []

  // ── Shared primitive geometries ───────────────────────────────────────────
  const sphere   = new THREE.SphereGeometry(1, 18, 14)
  const cone     = new THREE.ConeGeometry(1, 1, 12)
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 12)
  const box      = new THREE.BoxGeometry(1, 1, 1)
  disposables.push(sphere, cone, cylinder, box)

  // ── Materials — Phong for crisp lit-side / shadow-side without textures ───
  const matBody     = new THREE.MeshPhongMaterial({ color: COLORS.body,     shininess: 4 })
  const matBelly    = new THREE.MeshPhongMaterial({ color: COLORS.belly,    shininess: 6 })
  const matHead     = new THREE.MeshPhongMaterial({ color: COLORS.head,     shininess: 4 })
  const matFaceDisc = new THREE.MeshPhongMaterial({ color: COLORS.faceDisc, shininess: 6 })
  const matWing     = new THREE.MeshPhongMaterial({ color: COLORS.wing,     shininess: 2 })
  const matTail     = new THREE.MeshPhongMaterial({ color: COLORS.tail,     shininess: 2 })
  const matEye      = new THREE.MeshPhongMaterial({ color: COLORS.eyeWhite, shininess: 60 })
  const matPupil    = new THREE.MeshPhongMaterial({ color: COLORS.pupil,    shininess: 80 })
  const matBeak     = new THREE.MeshPhongMaterial({ color: COLORS.beak,     shininess: 30 })
  const matFeet     = new THREE.MeshPhongMaterial({ color: COLORS.feet,     shininess: 20 })
  const matCap      = new THREE.MeshPhongMaterial({ color: COLORS.capDark,  shininess: 30 })
  const matTassel   = new THREE.MeshPhongMaterial({ color: COLORS.tassel,   shininess: 50 })
  const matBookCv   = new THREE.MeshPhongMaterial({ color: COLORS.bookCover,shininess: 12 })
  const matBookSp   = new THREE.MeshPhongMaterial({ color: COLORS.bookSpine,shininess: 40 })
  disposables.push(
    matBody, matBelly, matHead, matFaceDisc, matWing, matTail,
    matEye, matPupil, matBeak, matFeet, matCap, matTassel, matBookCv, matBookSp,
  )

  // ── Root + visual sub-group ───────────────────────────────────────────────
  // root.position is the engine-driven center (PLAYER_Y_GROUND world). visual
  // carries the running bob so it doesn't leak into collision math. All owl
  // children are local to visual.
  const root = new THREE.Group()
  const visual = new THREE.Group()
  root.add(visual)

  // ── Body — sandy tan sphere, taller than wide; widest mid-low for pear ────
  // Body sits SLIGHTLY LOW so the head visually covers the top portion of the
  // body sphere, producing a tapered "narrower at top, wider at middle"
  // silhouette without needing a custom geometry.
  const body = new THREE.Mesh(sphere, matBody)
  body.scale.set(0.55, 0.62, 0.36)   // width 1.10, height 1.24, depth 0.72
  body.position.y = 0.02
  visual.add(body)

  // ── Belly — cream patch on the FRONT of the body (visible during forward tilt) ─
  const belly = new THREE.Mesh(sphere, matBelly)
  belly.scale.set(0.42, 0.50, 0.12)
  belly.position.set(0, -0.04, -0.30)
  visual.add(belly)

  // ── Tail — darker wedge sticking BACK toward the camera, slightly down ────
  // From the rear three-quarter camera the tail is one of the strongest
  // identifying silhouettes (it actually points toward the viewer).
  const tail = new THREE.Mesh(sphere, matTail)
  tail.scale.set(0.20, 0.10, 0.32)
  tail.position.set(0, -0.34, 0.46)
  tail.rotation.x = -0.32   // tip droops down a bit
  visual.add(tail)

  // ── Head group ────────────────────────────────────────────────────────────
  // Head smaller than body width (~80%). Positioned to overlap the top of the
  // body sphere, hiding it and creating the pear taper.
  const head = new THREE.Group()
  head.position.set(0, 0.66, -0.04)
  visual.add(head)

  const headSphere = new THREE.Mesh(sphere, matHead)
  headSphere.scale.set(0.44, 0.44, 0.44)
  head.add(headSphere)

  // Face disc — pale cream nearly-flat disc on the head's front. Strong owl
  // identifier from any angle that catches a sliver of the face.
  const faceDisc = new THREE.Mesh(sphere, matFaceDisc)
  faceDisc.scale.set(0.38, 0.40, 0.06)
  faceDisc.position.set(0, 0.02, -0.40)
  head.add(faceDisc)

  // ── Ear tufts — BIG cones on top of head, outward + back tilt ─────────────
  // Sized assertively so they're unambiguously visible from the rear camera —
  // these are the single strongest "this is an owl" cue from behind.
  const earL = new THREE.Mesh(cone, matBody)
  earL.scale.set(0.085, 0.32, 0.085)
  earL.position.set(-0.20, 0.36, 0.04)
  earL.rotation.set(-0.18, 0, -0.40)   // back + outward
  head.add(earL)

  const earR = new THREE.Mesh(cone, matBody)
  earR.scale.set(0.085, 0.32, 0.085)
  earR.position.set(0.20, 0.36, 0.04)
  earR.rotation.set(-0.18, 0, 0.40)
  head.add(earR)

  // ── Eyes — large white spheres, set slightly to the sides ────────────────
  const eyeR = 0.16
  const leftEye = new THREE.Mesh(sphere, matEye)
  leftEye.scale.setScalar(eyeR)
  leftEye.position.set(-0.20, 0.04, -0.42)
  head.add(leftEye)

  const rightEye = new THREE.Mesh(sphere, matEye)
  rightEye.scale.setScalar(eyeR)
  rightEye.position.set(0.20, 0.04, -0.42)
  head.add(rightEye)

  const pupilBase = 0.08
  const leftPupil = new THREE.Mesh(sphere, matPupil)
  leftPupil.scale.setScalar(pupilBase)
  leftPupil.position.set(-0.20, 0.04, -0.52)
  head.add(leftPupil)

  const rightPupil = new THREE.Mesh(sphere, matPupil)
  rightPupil.scale.setScalar(pupilBase)
  rightPupil.position.set(0.20, 0.04, -0.52)
  head.add(rightPupil)

  // ── Beak — small orange cone, apex forward (-Z) ──────────────────────────
  const beak = new THREE.Mesh(cone, matBeak)
  beak.scale.set(0.09, 0.18, 0.09)
  beak.position.set(0, -0.10, -0.46)
  beak.rotation.x = -Math.PI / 2
  head.add(beak)

  // ── Wings — pivoted groups on each side. Outward angle baked into the wing
  // mesh inside the pivot, so pivot.rotation remains "pure animation". ───────
  const makeWing = (side: 1 | -1): THREE.Group => {
    const pivot = new THREE.Group()
    pivot.position.set(side * 0.34, 0.20, 0)
    const wing = new THREE.Mesh(sphere, matWing)
    wing.scale.set(0.14, 0.50, 0.22)
    wing.position.set(0, -0.42, 0.02)
    // Resting outward tilt — wing tips angle away from the body so the
    // silhouette clearly shows wing on each side, even before flapping.
    wing.rotation.z = side * 0.22
    pivot.add(wing)
    visual.add(pivot)
    return pivot
  }
  const leftWing  = makeWing(-1)
  const rightWing = makeWing(+1)

  // ── Feet — orange pivoted groups, positioned to peek out behind body ──────
  // Feet pivot center sits slightly behind body center (Z+0.06) so when the
  // run cycle swings the back foot, it visibly extends past the body's rear
  // silhouette.
  const makeFoot = (side: 1 | -1): THREE.Group => {
    const pivot = new THREE.Group()
    pivot.position.set(side * 0.16, -0.66, 0.06)
    const foot = new THREE.Mesh(sphere, matFeet)
    foot.scale.set(0.13, 0.07, 0.22)
    pivot.add(foot)
    visual.add(pivot)
    return pivot
  }
  const leftFoot  = makeFoot(-1)
  const rightFoot = makeFoot(+1)

  // ── Graduation cap (accessory, child of head so it tilts with head) ───────
  const cap = new THREE.Group()
  cap.position.set(0, 0.46, 0.02)
  const capBase = new THREE.Mesh(cylinder, matCap)
  capBase.scale.set(0.30, 0.11, 0.30)
  cap.add(capBase)
  const mortarboard = new THREE.Mesh(box, matCap)
  mortarboard.scale.set(0.68, 0.04, 0.68)
  mortarboard.position.y = 0.08
  cap.add(mortarboard)
  // Gold tassel — cord + ball — hanging off one corner of the mortarboard.
  const tasselCord = new THREE.Mesh(cylinder, matTassel)
  tasselCord.scale.set(0.014, 0.18, 0.014)
  tasselCord.position.set(0.28, -0.02, -0.04)
  cap.add(tasselCord)
  const tasselBall = new THREE.Mesh(sphere, matTassel)
  tasselBall.scale.setScalar(0.055)
  tasselBall.position.set(0.28, -0.17, -0.04)
  cap.add(tasselBall)
  head.add(cap)

  // ── Book tucked under LEFT wing (-X side). Positioned so the wing partly
  // covers it from above but it peeks out at the rear. ─────────────────────
  const book = new THREE.Group()
  book.position.set(-0.30, -0.12, 0.20)
  book.rotation.set(0, -0.10, -0.18)
  const bookCover = new THREE.Mesh(box, matBookCv)
  bookCover.scale.set(0.09, 0.22, 0.26)
  book.add(bookCover)
  const bookSpine = new THREE.Mesh(box, matBookSp)
  bookSpine.scale.set(0.094, 0.024, 0.21)
  bookSpine.position.y = 0.11
  book.add(bookSpine)
  visual.add(book)

  return {
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
    tail,
    cap,
    book,
    disposables,
  }
}

// Animation tuning — pulled out for easy iteration without grep.
export const OWL_ANIM = {
  runCycleSeconds:     0.30,      // body bob period
  runBobAmplitude:     0.06,      // ~5% of owl height (~1.2 units)
  runFlapAmplitudeRad: 0.35,      // ~20° wing flap (brief said 20°)
  runFootSwingZ:       0.16,      // forward/back foot swing — exaggerated for rear visibility
  runHeadTiltRad:      0.05,
  runTailWagRad:       0.09,      // ~5° tail wag in sync with bob (per brief)
  jumpWingExtendRad:   0.55,
  jumpForwardTiltRad:  0.30,
  jumpFootTuckY:       0.18,
  hitShakeDuration:    0.18,
  hitShakeAmpRad:      0.18,
  hitPupilScaleMul:    1.7,
  laneTiltScale:       0.50,
  laneTiltMaxRad:      0.20,
  laneTiltLerp:        0.22,
}
