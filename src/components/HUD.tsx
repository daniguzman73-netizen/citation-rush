import { MAX_HITS } from '../game/constants'
import type { GameState } from '../game/GameEngine'

interface Props { state: GameState }

export default function HUD({ state }: Props) {
  const secondsLeft = Math.ceil(state.timeRemaining)
  const lowTime = secondsLeft <= 10

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Top-left: time */}
      <div className="absolute top-4 left-4 bg-black/55 backdrop-blur rounded-lg px-4 py-2 text-white">
        <div className="text-[11px] uppercase tracking-widest text-neutral-400">Time</div>
        <div className={`text-3xl font-bold tabular-nums ${lowTime ? 'text-red-400' : ''}`}>{secondsLeft}</div>
      </div>

      {/* Top-center: hearts */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/55 backdrop-blur rounded-lg px-4 py-2 text-white">
        <div className="flex gap-2 text-2xl leading-none">
          {Array.from({ length: MAX_HITS }, (_, i) => {
            const lost = i < state.hits
            return (
              <span
                key={i}
                className={lost ? 'text-neutral-600' : 'text-red-400'}
                aria-label={lost ? 'lost life' : 'remaining life'}
              >
                {lost ? '♡' : '♥'}
              </span>
            )
          })}
        </div>
      </div>

      {/* Top-right: score */}
      <div className="absolute top-4 right-4 bg-black/55 backdrop-blur rounded-lg px-4 py-2 text-white text-right">
        <div className="text-[11px] uppercase tracking-widest text-neutral-400">Score</div>
        <div className="text-3xl font-bold tabular-nums">{state.score}</div>
      </div>
    </div>
  )
}
