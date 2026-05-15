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
