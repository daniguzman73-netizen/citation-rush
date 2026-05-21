import type { StorageBackend, Run, NewRun, AggregateStats } from './types'

const KEY = 'citation-rush:runs'

function readAll(): Run[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as Run[]
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

export const localStorageBackend: StorageBackend = {
  async saveRun(input: NewRun): Promise<Run> {
    const run: Run = { ...input, id: freshId() }
    const all = readAll()
    all.push(run)
    writeAll(all)
    return run
  },

  async getTopRuns(limit: number): Promise<Run[]> {
    // Guest runs (skipped-intake) are stored with blank name + institution so
    // we can still attach an email to them, but they're filtered out of the
    // visible top-10 — a nameless entry doesn't render meaningfully on the
    // leaderboard. They still count in getAllRuns / getAggregateStats / CSV.
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

  async getAggregateStats(): Promise<AggregateStats> {
    const all = readAll()
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
