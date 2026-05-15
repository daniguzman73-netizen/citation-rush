import { useEffect, useRef, useState } from 'react'
import { GameEngine, type GameState } from '../game/GameEngine'
import HUD from './HUD'
import TouchControls from './TouchControls'
import StartOverlay from './StartOverlay'

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const [state, setState] = useState<GameState | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const engine = new GameEngine(canvasRef.current)
    engineRef.current = engine
    const unsubscribe = engine.subscribe(setState)
    return () => {
      unsubscribe()
      engine.dispose()
      engineRef.current = null
    }
  }, [])

  const phase = state?.phase ?? 'idle'

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />
      {state && phase === 'running' && <HUD state={state} />}
      {(phase === 'idle' || phase === 'over') && state && (
        <StartOverlay
          state={state}
          onStart={() => engineRef.current?.start()}
        />
      )}
      {phase === 'running' && (
        <TouchControls
          onLeft={() => engineRef.current?.moveLeft()}
          onRight={() => engineRef.current?.moveRight()}
          onJump={() => engineRef.current?.jump()}
        />
      )}
    </div>
  )
}
