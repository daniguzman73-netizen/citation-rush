import { useEffect, useState } from 'react'
import { storage, type Run } from '../storage'

interface Props {
  highlightRunId: string | null
  onPlayAgain: () => void
  onDone: () => void
}

// Very forgiving email validation — we don't want to reject odd-but-valid
// academic addresses (foo+bar@dept.uni.edu, dotted locals, etc.). Just
// "non-empty, has an @, has a dot after the @".
function looksLikeEmail(v: string): boolean {
  const trimmed = v.trim()
  const at = trimmed.indexOf('@')
  if (at <= 0) return false
  const dot = trimmed.indexOf('.', at + 1)
  return dot > at + 1 && dot < trimmed.length - 1
}

export default function LeaderboardScreen({ highlightRunId, onPlayAgain, onDone }: Props) {
  const [runs, setRuns] = useState<Run[] | null>(null)

  // Email-capture local state. The run is ALREADY saved by this point —
  // submitting this form only attaches the email/opt-in to the existing
  // record via storage.updateRunEmail. Nothing here gates the leaderboard,
  // the "Play again" / "Done" buttons, or the visitor's score.
  const [email, setEmail] = useState('')
  const [optIn, setOptIn] = useState(false)   // MUST default to false — privacy
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    storage.getTopRuns(10).then(r => { if (!cancelled) setRuns(r) })
    return () => { cancelled = true }
  }, [])

  const canSubmitEmail = !submitted && !submitting && looksLikeEmail(email)

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmitEmail || !highlightRunId) return
    setSubmitting(true)
    try {
      await storage.updateRunEmail(highlightRunId, email.trim(), optIn)
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  // Only offer email capture when there's a run to attach it to. Anonymous
  // (skipped-intake) visitors have no run record, so no email box.
  const showEmailCapture = highlightRunId !== null

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 overflow-y-auto py-10">
      <div className="w-full max-w-2xl">
        <div className="text-xs uppercase tracking-[0.3em] text-purple-300/80">Leaderboard</div>
        <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">Top runs</h2>

        {/* ── Email capture (optional, never blocks) ──────────────────────────── */}
        {showEmailCapture && (
          <div className="mt-6 rounded-2xl border border-purple-500/30 bg-purple-600/10 backdrop-blur p-5">
            {!submitted ? (
              <form onSubmit={handleSubmitEmail}>
                <div className="text-sm md:text-base font-semibold text-white">
                  Get the latest on Nexus
                </div>
                <p className="mt-1 text-xs text-purple-200/80">
                  Optional — your score is already on the leaderboard.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="off"
                    placeholder="you@library.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={submitting}
                    className="flex-1 rounded-lg bg-neutral-900 border border-white/15 px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!canSubmitEmail}
                    className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-sm font-semibold disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    Sign me up
                  </button>
                </div>

                <label className="mt-3 flex items-start gap-3 text-xs text-purple-100/90 cursor-pointer select-none">
                  {/* MUST default to unticked — privacy compliance.
                      If left unticked, we still store the email but flag the
                      consent as false in the CSV export. */}
                  <input
                    type="checkbox"
                    checked={optIn}
                    onChange={e => setOptIn(e.target.checked)}
                    disabled={submitting}
                    className="mt-0.5 h-4 w-4 rounded border-white/20 bg-neutral-900 text-purple-500 focus:ring-purple-500"
                  />
                  <span>Send me updates about Nexus</span>
                </label>
              </form>
            ) : (
              <div className="text-sm text-purple-100">
                <span className="font-semibold text-white">Thanks!</span> We'll be in touch.
              </div>
            )}
          </div>
        )}

        {/* ── Top-10 list ─────────────────────────────────────────────────────── */}
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
