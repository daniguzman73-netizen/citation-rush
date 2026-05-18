import { useEffect, useRef, useState } from 'react'
import { GameEngine, type GameState } from '../game/GameEngine'
import HUD from './HUD'
import TouchControls from './TouchControls'

interface Props {
  // fires once when phase transitions to 'over'
  onRunEnd: (final: GameState) => void
  // fires synchronously after mount with the engine handle, so the parent can call start()
  onReady?: (engine: GameEngine) => void
}

// Minimum displacement in CSS pixels for a touchend to count as a swipe.
// Anything shorter is treated as a stationary tap (which the on-screen
// TouchControls buttons will handle if it lands on one).
const SWIPE_THRESHOLD_PX = 40

export default function GameCanvas({ onRunEnd, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const [state, setState] = useState<GameState | null>(null)
  const endedReportedRef = useRef(false)

  useEffect(() => {
    if (!canvasRef.current) return
    const engine = new GameEngine(canvasRef.current)
    engineRef.current = engine
    const unsubscribe = engine.subscribe((s) => {
      setState(s)
      if (s.phase === 'over' && !endedReportedRef.current) {
        endedReportedRef.current = true
        // freeze-frame for ~800ms before bubbling up (spec §4 Screen 5)
        setTimeout(() => onRunEnd(s), 800)
      }
    })
    onReady?.(engine)
    return () => {
      unsubscribe()
      engine.dispose()
      engineRef.current = null
    }
  }, [onRunEnd, onReady])

  // Swipe gesture handler on the canvas. Wired with native
  // addEventListener so we can use { passive: false } and preventDefault()
  // on touchmove — that suppresses iOS scroll / pull-to-refresh while the
  // visitor swipes across the gameplay area. React's synthetic touch events
  // default to passive listeners so they can't preventDefault.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let startX = 0
    let startY = 0
    let tracking = false

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      startX = t.clientX
      startY = t.clientY
      tracking = true
    }

    const onTouchMove = (e: TouchEvent) => {
      // Prevent the browser from scrolling / pull-to-refreshing under the
      // finger while it's in the gameplay area.
      if (tracking) e.preventDefault()
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return
      tracking = false
      const t = e.changedTouches[0]
      if (!t) return
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)
      if (Math.max(absX, absY) < SWIPE_THRESHOLD_PX) return  // tap, not swipe

      const engine = engineRef.current
      if (!engine) return
      if (absX > absY) {
        // horizontal swipe
        if (dx > 0) engine.moveRight()
        else        engine.moveLeft()
      } else {
        // vertical swipe — only "up" triggers jump (down is intentionally
        // unmapped, matching SPEC §4 Screen 5: "Down/duck is intentionally
        // omitted to keep controls minimal").
        if (dy < 0) engine.jump()
      }
    }

    const onTouchCancel = () => { tracking = false }

    // passive: false is required for preventDefault() to take effect on touchmove.
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false })
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: false })
    canvas.addEventListener('touchcancel', onTouchCancel, { passive: false })

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove',  onTouchMove)
      canvas.removeEventListener('touchend',   onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [])

  const running = state?.phase === 'running'

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />
      {state && running && <HUD state={state} />}
      {running && (
        <TouchControls
          onLeft={() => engineRef.current?.moveLeft()}
          onRight={() => engineRef.current?.moveRight()}
          onJump={() => engineRef.current?.jump()}
        />
      )}
    </div>
  )
}
