import type { GameState } from '../game/GameEngine'

interface Props {
  state: GameState
  onStart: () => void
}

// Minimal pre/post-run overlay so the loop can be playtested end-to-end.
// Phase 2 replaces this with the proper Welcome / Intake / Tutorial / Countdown / Results screens.
export default function StartOverlay({ state, onStart }: Props) {
  const isOver = state.phase === 'over'

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 backdrop-blur-sm text-white text-center px-6">
      {!isOver ? (
        <>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">CITATION RUSH</h1>
          <p className="mt-3 text-neutral-300 italic max-w-xl">
            Grab the good. Dodge the bad. See if you can outrun AI's worst citations.
          </p>
          <p className="mt-8 text-sm text-neutral-400 max-w-md">
            ← → switch lanes &nbsp;·&nbsp; ↑ / Space jump &nbsp;·&nbsp; 3 hits = game over
          </p>
          <button
            type="button"
            onClick={onStart}
            className="mt-8 px-8 py-3 rounded-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-lg font-semibold transition-colors"
          >
            Press start →
          </button>
          <p className="mt-3 text-xs text-neutral-500">(or hit Space)</p>
        </>
      ) : (
        <>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            {state.endedBy === 'time' ? 'Time!' : 'Out!'}
          </h2>
          <p className="mt-2 text-neutral-300">
            {state.endedBy === 'time'
              ? state.hits < 3
                ? 'Full run — +200 bonus.'
                : 'Time ran out.'
              : 'Three bad citations got through.'}
          </p>
          <div className="mt-6 text-6xl font-bold tabular-nums">{state.score}</div>
          <div className="mt-1 text-sm uppercase tracking-widest text-neutral-400">final score</div>

          <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-neutral-300 max-w-md">
            <div>Trusted collected</div><div className="text-right tabular-nums">{state.stats.trusted_collected}</div>
            <div>Preprint dodged / hit</div><div className="text-right tabular-nums">{state.stats.preprint_dodged} / {state.stats.preprint_hit}</div>
            <div>Paywalled dodged / hit</div><div className="text-right tabular-nums">{state.stats.paywalled_dodged} / {state.stats.paywalled_hit}</div>
            <div>Predatory dodged / hit</div><div className="text-right tabular-nums">{state.stats.predatory_dodged} / {state.stats.predatory_hit}</div>
            <div>Hallucinated dodged / hit</div><div className="text-right tabular-nums">{state.stats.hallucinated_dodged} / {state.stats.hallucinated_hit}</div>
          </div>

          <button
            type="button"
            onClick={onStart}
            className="mt-8 px-8 py-3 rounded-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-lg font-semibold transition-colors"
          >
            Play again →
          </button>
          <p className="mt-3 text-xs text-neutral-500">(or hit Space)</p>
        </>
      )}
    </div>
  )
}
