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
            const justLost = lost && i === state.hits - 1
            return (
              <span
                key={i}
                className={lost ? 'text-neutral-600 inline-block' : 'text-red-400 inline-block'}
                aria-label={lost ? 'lost life' : 'remaining life'}
                // Animate the most-recently-lost heart with a brief scale pulse.
                style={justLost ? { animation: 'heartLost 0.4s ease-out' } : undefined}
              >
                {lost ? '♡' : '♥'}
              </span>
            )
          })}
        </div>
      </div>

      {/* Heart-lost keyframe injected once; rendered at the top of the HUD only when in use. */}
      <style>{`
        @keyframes heartLost {
          0%   { transform: scale(1);    color: #f87171; }
          40%  { transform: scale(1.6);  color: #ef4444; }
          100% { transform: scale(1);    color: #525252; }
        }
      `}</style>

      {/* Top-right: score + popups */}
      <div className="absolute top-4 right-4 text-right">
        <div className="bg-black/55 backdrop-blur rounded-lg px-4 py-2 text-white inline-block">
          <div className="text-[11px] uppercase tracking-widest text-neutral-400">Score</div>
          <div className="text-3xl font-bold tabular-nums">{state.score}</div>
        </div>

        <div className="relative h-0">
          {state.popups.map((p, i) => {
            const fade = Math.min(1, p.ttl / 0.9)
            const rise = (1 - fade) * 48
            const color = p.kind === 'collect' ? 'text-emerald-300' : 'text-red-300'
            return (
              <div
                key={p.id}
                className={`absolute right-0 mt-1 font-bold tabular-nums ${color}`}
                style={{
                  transform: `translateY(${-rise + i * 28}px)`,
                  opacity: fade,
                  textShadow: '0 0 12px rgba(0,0,0,0.6)',
                  fontSize: '22px',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.value > 0 ? `+${p.value}` : `${p.value}`}
              </div>
            )
          })}
        </div>
      </div>

      {/* Hit flash overlay */}
      {state.hitFlash > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 ${120 * state.hitFlash}px ${40 * state.hitFlash}px rgba(239, 68, 68, ${0.65 * state.hitFlash})`,
            border: `3px solid rgba(239, 68, 68, ${state.hitFlash})`,
          }}
        />
      )}
    </div>
  )
}
