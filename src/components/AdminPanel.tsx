import { useEffect, useState } from 'react'
import { storage, type Run, type AggregateStats } from '../storage'
import { Audio } from '../audio/Audio'

interface Props { onClose: () => void }

// Admin entry is gated by the 5-tap gesture on the Welcome screen's wordmark.
// There is intentionally no password gate beyond that — booth staff prefer
// fast access on the show floor, and the gesture is already obscure enough
// that visitors won't stumble into it.

// CSV columns for the "all runs" export — matches the SPEC §8 Data model order.
const RUN_COLUMNS = [
  'id', 'name', 'institution', 'email', 'optedIn',
  'startedAt', 'endedAt',
  'score', 'survivedSeconds', 'endedBy',
  'trusted_collected',
  'preprint_dodged', 'preprint_hit',
  'paywalled_dodged', 'paywalled_hit',
  'predatory_dodged', 'predatory_hit',
  'hallucinated_dodged', 'hallucinated_hit',
  'retracted_dodged', 'retracted_hit',
] as const

function quoteCsv(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function runToRow(r: Run): string[] {
  return [
    r.id, r.name, r.institution, r.email, r.optedIn ? '1' : '0',
    new Date(r.startedAt).toISOString(),
    new Date(r.endedAt).toISOString(),
    String(r.score), String(r.survivedSeconds), r.endedBy,
    String(r.stats.trusted_collected),
    String(r.stats.preprint_dodged), String(r.stats.preprint_hit),
    String(r.stats.paywalled_dodged), String(r.stats.paywalled_hit),
    String(r.stats.predatory_dodged), String(r.stats.predatory_hit),
    String(r.stats.hallucinated_dodged), String(r.stats.hallucinated_hit),
    String(r.stats.retracted_dodged), String(r.stats.retracted_hit),
  ]
}

function download(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5_000)
}

function fmtTimestamp(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

export default function AdminPanel({ onClose }: Props) {
  const [stats, setStats] = useState<AggregateStats | null>(null)
  const [topRuns, setTopRuns] = useState<Run[] | null>(null)
  const [muted, setMuted] = useState(Audio.isMuted())
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => Audio.subscribe(setMuted), [])

  const refresh = () => {
    Promise.all([storage.getAggregateStats(), storage.getTopRuns(10)])
      .then(([s, r]) => { setStats(s); setTopRuns(r) })
  }

  // Load stats + top runs immediately on mount — the 5-tap gesture is the
  // only gate, so opening this panel implies the operator wants the data.
  useEffect(() => { refresh() }, [])

  const exportAllRuns = async () => {
    const runs = await storage.getAllRuns()
    const header = RUN_COLUMNS.map(quoteCsv).join(',')
    const rows = runs.map(r => runToRow(r).map(quoteCsv).join(','))
    download(`citation-rush-runs-${fmtTimestamp()}.csv`, [header, ...rows].join('\n'))
  }

  const exportOptIns = async () => {
    const runs = await storage.getEmailOptIns()
    const header = ['name', 'institution', 'email', 'endedAt'].join(',')
    const rows = runs.map(r => [r.name, r.institution, r.email, new Date(r.endedAt).toISOString()].map(quoteCsv).join(','))
    download(`citation-rush-optins-${fmtTimestamp()}.csv`, [header, ...rows].join('\n'))
  }

  const handleReset = async () => {
    await storage.resetRuns()
    setConfirmReset(false)
    refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
      <div className="w-full max-w-2xl bg-neutral-900 rounded-2xl border border-white/10 shadow-2xl text-white overflow-hidden">
        <div className="flex items-baseline justify-between px-6 py-4 border-b border-white/10">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-purple-300/80">Admin</div>
            <h3 className="text-lg font-semibold">Citation Rush</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-2xl leading-none"
            aria-label="Close admin panel"
          >×</button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Stats */}
            <section>
              <h4 className="text-xs uppercase tracking-widest text-neutral-400 mb-2">Stats</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <StatTile label="Total runs"     value={stats ? String(stats.totalRuns)     : '…'} />
                <StatTile label="Today"          value={stats ? String(stats.runsToday)     : '…'} />
                <StatTile label="Avg score"      value={stats ? String(stats.averageScore)  : '…'} />
                <StatTile label="Completion %"   value={stats ? `${Math.round(stats.completionRate * 100)}%` : '…'} />
              </div>
            </section>

            {/* Audio */}
            <section>
              <h4 className="text-xs uppercase tracking-widest text-neutral-400 mb-2">Audio</h4>
              <button
                type="button"
                onClick={() => Audio.toggle()}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-sm transition-colors"
              >
                {muted ? '🔇 Audio muted — click to unmute' : '🔊 Audio on — click to mute'}
              </button>
            </section>

            {/* Top runs */}
            <section>
              <h4 className="text-xs uppercase tracking-widest text-neutral-400 mb-2">Top runs</h4>
              {topRuns === null && <div className="text-sm text-neutral-500 italic">Loading…</div>}
              {topRuns && topRuns.length === 0 && <div className="text-sm text-neutral-500 italic">No runs yet.</div>}
              {topRuns && topRuns.length > 0 && (
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 text-xs uppercase tracking-widest text-neutral-400">
                      <tr>
                        <th className="text-left px-3 py-2">#</th>
                        <th className="text-left px-3 py-2">Name</th>
                        <th className="text-left px-3 py-2">Institution</th>
                        <th className="text-right px-3 py-2">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {topRuns.map((r, i) => (
                        <tr key={r.id}>
                          <td className="px-3 py-2 tabular-nums text-neutral-400">{i + 1}</td>
                          <td className="px-3 py-2 truncate max-w-[10rem]">{r.name}</td>
                          <td className="px-3 py-2 truncate text-neutral-400 max-w-[14rem]">{r.institution}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-medium">{r.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Exports */}
            <section>
              <h4 className="text-xs uppercase tracking-widest text-neutral-400 mb-2">Export</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={exportAllRuns}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-sm transition-colors"
                >
                  Download all runs (CSV)
                </button>
                <button
                  type="button"
                  onClick={exportOptIns}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-sm transition-colors"
                >
                  Download email opt-ins (CSV)
                </button>
              </div>
            </section>

            {/* Reset */}
            <section>
              <h4 className="text-xs uppercase tracking-widest text-neutral-400 mb-2">Danger zone</h4>
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="px-4 py-2 rounded-full bg-red-900/40 hover:bg-red-900/60 text-red-200 text-sm transition-colors border border-red-700/40"
                >
                  Reset leaderboard
                </button>
              ) : (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-red-300">Are you sure? This wipes all runs.</span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
                  >
                    Yes, reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </section>
        </div>
      </div>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-neutral-800 border border-white/5 p-3">
      <div className="text-xs uppercase tracking-widest text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  )
}
