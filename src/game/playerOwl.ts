import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Player character — pre-made low-poly owl model loaded from /models/owl.glb.
//
// We keep the same two-group hierarchy the engine has always driven:
//   root   = this.player — engine sets position / rotation / scale (lane lerp,
//            jump arc, lane roll, jump forward-tilt, hit shake, collect bounce)
//   visual = child of root, carries the running bob so the bob doesn't pollute
//            collision math
//
// The GLTF scene attaches as a single child of `visual`. There are NO sub-part
// refs (wings, feet, head, etc.) — the model is animated procedurally as a
// rigid body. A simple placeholder cube renders until the GLB finishes loading
// (kiosk flow gives ~10+s of welcome→intake→tutorial→countdown before any
// gameplay, so in practice this is invisible).
//
// Model attribution lives in src/data/credits.ts.

export interface OwlRefs {
  root: THREE.Group
  visual: THREE.Group
  isReady: () => boolean
  disposables: { dispose: () => void }[]
}

const MODEL_URL = '/models/owl.glb'

// Target visual height in world units (similar to the previous geometric owl).
const TARGET_HEIGHT = 1.5

// The lane surface that the owl's feet should sit flush with. Group origin in
// world is at PLAYER_Y_GROUND = 0.7; floor is at world y=0. In group-local
// coords, "feet on the floor" means model's bounding-box bottom at y = -0.7.
const FLOOR_LOCAL_Y = -0.7

// Loader instance — share across sessions if the engine is ever recreated.
const loader = new GLTFLoader()

export function createOwlScene(): OwlRefs {
  const disposables: { dispose: () => void }[] = []

  const root   = new THREE.Group()
  const visual = new THREE.Group()
  root.add(visual)

  // Placeholder while the GLB loads — kept intentionally tiny / unobtrusive
  // since it'll vanish before the visitor sees gameplay in any realistic kiosk
  // flow. If load fails entirely, this is what they'll see.
  const placeholderGeo = new THREE.BoxGeometry(0.6, 1.2, 0.5)
  const placeholderMat = new THREE.MeshPhongMaterial({ color: 0xDFC295 })
  const placeholder = new THREE.Mesh(placeholderGeo, placeholderMat)
  placeholder.position.y = 0
  visual.add(placeholder)
  disposables.push(placeholderGeo, placeholderMat)

  let ready = false

  loader.load(
    MODEL_URL,
    (gltf) => {
      const model = gltf.scene

      // Brighten the artist's materials by ~15% without replacing them —
      // preserves color choices but lifts the owl out of silhouette-dark
      // territory against the cream paper. Clones each material first so
      // the loader's cache stays untouched.
      const tint = 1.15
      const cloneAndTint = (m: THREE.Material): THREE.Material => {
        const cloned = m.clone()
        const colored = cloned as THREE.Material & { color?: THREE.Color }
        if (colored.color) colored.color.multiplyScalar(tint)
        disposables.push(cloned)
        return cloned
      }
      model.traverse((node) => {
        const mesh = node as THREE.Mesh
        if (!mesh.isMesh) return
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(cloneAndTint)
        } else {
          mesh.material = cloneAndTint(mesh.material)
        }
      })

      // Measure → scale to target height → translate so feet land on floor.
      const preBox = new THREE.Box3().setFromObject(model)
      const preSize = new THREE.Vector3()
      preBox.getSize(preSize)
      const scale = preSize.y > 0 ? TARGET_HEIGHT / preSize.y : 1
      model.scale.setScalar(scale)

      // Recompute after scaling.
      const postBox = new THREE.Box3().setFromObject(model)
      // We want the model's lowest point at group-local y = FLOOR_LOCAL_Y so
      // feet land flush on world y = 0.
      model.position.y = FLOOR_LOCAL_Y - postBox.min.y

      // Most GLBs ship with the model facing +Z. The engine treats -Z as
      // "forward" (the direction of travel, away from the camera). Rotate 180°
      // so the owl looks where it's running.
      model.rotation.y = Math.PI

      // Swap in: remove placeholder, attach model.
      visual.remove(placeholder)
      placeholderGeo.dispose()
      placeholderMat.dispose()
      visual.add(model)

      ready = true
    },
    undefined,
    (err) => {
      // Loader uses console.error already; surface a clear booth-runtime warning.
      console.error('[CitationRush] Failed to load /models/owl.glb — falling back to placeholder.', err)
      // ready stays false; placeholder keeps rendering. Gameplay still works.
    },
  )

  return {
    root,
    visual,
    isReady: () => ready,
    disposables,
  }
}

// Animation tuning — values per the brief for the GLB-driven owl.
// Procedural animation only (the model is static; no skeleton).
export const OWL_ANIM = {
  // Run cycle: translate ±5% on Y at ~0.3s cycle.
  runCycleSeconds:     0.30,
  runBobAmplitude:     0.075,    // ≈5% of TARGET_HEIGHT (1.5)
  // Lane-switch tilt: ~10° on Z toward direction of motion.
  laneTiltScale:       0.50,
  laneTiltMaxRad:      0.175,    // ~10°
  laneTiltLerp:        0.22,
  // Jump: tilt ~10° forward at apex.
  jumpForwardTiltRad:  0.175,    // ~10°
  // Hit: ±10° shake on Z for ~180ms.
  hitShakeDuration:    0.18,
  hitShakeAmpRad:      0.175,    // ~10°
  // Collect: scale bounce 1.0 → 1.1 → 1.0 over ~100ms.
  collectBounceDuration: 0.10,
  collectBouncePeak:     0.10,   // +10% peak scale
}
