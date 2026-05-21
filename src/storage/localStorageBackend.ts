import type { StorageBackend, Run, NewRun, AggregateStats, RunSource } from './types'

const KEY = 'citation-rush:runs'

// Normalize a raw localStorage record on read. Records written before the
// `source` field existed default to 'game'.
function normalize(raw: Run): Run {
  if (!raw.source) {
    return { ...raw, source: 'game' as RunSource }
  }
  return raw
}

function readAll(): Run[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return (parsed as Run[]).map(normalize)
  } catch {
    return []
  }
}

function writeAll(runs: Run[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(runs))
  } catch {
    // localStorage quota exceeded etc. — swallow; booth doesn't need to recover gracefully.
  }
}

function freshId(): string {
  // crypto.randomUUID is available in all evergreen browsers; fall back to a timestamp-random hybrid.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function startOfToday(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const emptyStats: Run['stats'] = {
  trusted_collected: 0,
  preprint_dodged: 0,    preprint_hit: 0,
  paywalled_dodged: 0,   paywalled_hit: 0,
  predatory_dodged: 0,   predatory_hit: 0,
  hallucinated_dodged: 0, hallucinated_hit: 0,
  retracted_dodged: 0,   retracted_hit: 0,
}

export const localStorageBackend: StorageBackend = {
  async saveRun(input: NewRun): Promise<Run> {
    const run: Run = { ...input, id: freshId() }
    const all = readAll()
    all.push(run)
    writeAll(all)
    return run
  },

  async getTopRuns(limit: number): Promise<Run[]> {
    // Guest runs (skipped-intake) AND demo-direct leads are stored with
    // blank name so we can still attach email + opt-in, but they're
    // filtered out of the visible top-10 — a nameless / score-0 row
    // doesn't render meaningfully on the leaderboard. They still count
    // in getAllRuns / getAggregateStats / CSV.
    return readAll()
      .slice()
      .filter(r => r.name.trim().length > 0)
      .sort((a, b) => b.score - a.score || b.endedAt - a.endedAt)
      .slice(0, limit)
  },

  async getAllRuns(): Promise<Run[]> {
    return readAll()
      .slice()
      .sort((a, b) => b.endedAt - a.endedAt)
  },

  async getEmailOptIns(): Promise<Run[]> {
    return readAll().filter(r => r.optedIn && r.email.trim().length > 0)
  },

  async resetRuns(): Promise<void> {
    writeAll([])
  },

  async updateRunEmail(id: string, email: string, optedIn: boolean): Promise<void> {
    const all = readAll()
    const idx = all.findIndex(r => r.id === id)
    if (idx < 0) return  // run not found — silent no-op (caller already saved)
    all[idx] = { ...all[idx], email, optedIn }
    writeAll(all)
  },

  async saveLead(email: string, optedIn: boolean): Promise<Run> {
    // Demo-direct opt-in: no game data. Stamp source='demo' so the CSV
    // distinguishes it from real game runs. Blank name + score=0 keep it
    // out of the visible top-10 via getTopRuns's name filter.
    const now = Date.now()
    const run: Run = {
      id: freshId(),
      source: 'demo',
      name: '',
      institution: '',
      email,
      optedIn,
      startedAt: now,
      endedAt: now,
      score: 0,
      survivedSeconds: 0,
      endedBy: 'time',
      stats: emptyStats,
    }
    const all = readAll()
    all.push(run)
    writeAll(all)
    return run
  },

  async getAggregateStats(): Promise<AggregateStats> {
    // Only count REAL game plays in the aggregate stats — demo-direct
    // leads aren't gameplay events, so they'd skew "Avg score" and
    // "Completion %" downward if included.
    const all = readAll().filter(r => r.source === 'game')
    if (all.length === 0) {
      return { totalRuns: 0, runsToday: 0, averageScore: 0, completionRate: 0 }
    }
    const today = startOfToday()
    const totalScore = all.reduce((s, r) => s + r.score, 0)
    const completed = all.filter(r => r.endedBy === 'time').length
    return {
      totalRuns: all.length,
      runsToday: all.filter(r => r.endedAt >= today).length,
      averageScore: Math.round(totalScore / all.length),
      completionRate: completed / all.length,
    }
  },
}
