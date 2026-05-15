import { useEffect, useState } from 'react'
import { storage, type Run } from '../storage'

interface Props {
  highlightRunId: string | null
  onPlayAgain: () => void
  onDone: () => void
}

export default function LeaderboardScreen({ highlightRunId, onPlayAgain, onDone }: Props) {
  const [runs, setRuns] = useState<Run[] | null>(null)

  useEffect(() => {
    let cancelled = false
    storage.getTopRuns(10).then(r => { if (!cancelled) setRuns(r) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="w-full max-w-2xl">
        <div className="text-xs uppercase tracking-[0.3em] text-purple-300/80">Leaderboard</div>
        <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">Top runs</h2>

        <div className="mt-6 rounded-2xl border border-white/10 bg-neutral-900/70 backdrop-blur overflow-hidden">
          {runs === null && (
            <div className="px-6 py-12 text-center text-neutral-500 italic">Loading…</div>
          )}
          {runs !== null && runs.length === 0 && (
            <div className="px-6 py-12 text-center text-neutral-500 italic">
              No runs yet — be the first.
            </div>
          )}
          {runs !== null && runs.length > 0 && (
            <ol className="divide-y divide-white/5">
              {runs.map((r, i) => {
                const me = r.id === highlightRunId
                return (
                  <li
                    key={r.id}
                    className={
                      'flex items-baseline gap-4 px-6 py-3 ' +
                      (me ? 'bg-purple-600/20 ring-1 ring-inset ring-purple-500/40' : '')
                    }
                  >
                    <div className={`text-xl font-bold tabular-nums w-10 shrink-0 ${i < 3 ? 'text-yellow-300' : 'text-neutral-500'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">
                        {r.name}{me && <span className="ml-2 text-xs uppercase tracking-wider text-purple-300">you</span>}
                      </div>
                      <div className="truncate text-xs text-neutral-400">{r.institution}</div>
                    </div>
                    <div className="text-2xl font-bold tabular-nums">{r.score}</div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onDone}
            className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
          >
            Done
          </button>
          <button
            type="button"
            onClick={onPlayAgain}
            className="px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-base font-semibold transition-colors"
          >
            Play again →
          </button>
        </div>
      </div>
    </div>
  )
}
