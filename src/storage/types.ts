// Storage interface for Citation Rush runs. Implemented by per-backend modules.
// Phase 3 ships the localStorage backend (browser-safe, used by Vercel + kiosk-until-Phase-5).
// Phase 5 will add a better-sqlite3 backend behind the same interface, swapped in from
// the Electron main process. Gameplay code must only depend on this interface.

import type { RunStats } from '../game/GameEngine'

export type EndedBy = 'time' | 'hits'

// How the record entered storage. Used to distinguish demo-direct visitors
// (no game played, just an email opt-in) from real game runs in the CSV
// export. Legacy records written before this field existed are normalized
// to 'game' on read.
export type RunSource = 'game' | 'demo'

// Persisted shape of a completed run. Matches SPEC.md §8 Data model.
//
// `source: 'demo'` records are demo-direct leads — they have no real game
// data (score 0, blank name/institution, zeroed stats, startedAt === endedAt).
// They exist solely to carry an email + optedIn flag captured on the final
// screen after the demo-direct path.
export interface Run {
  id: string
  source: RunSource
  name: string
  institution: string
  email: string
  optedIn: boolean
  startedAt: number      // epoch ms
  endedAt: number        // epoch ms
  score: number
  survivedSeconds: number
  endedBy: EndedBy
  stats: RunStats
}

export type NewRun = Omit<Run, 'id'>

export interface AggregateStats {
  totalRuns: number
  runsToday: number       // since local midnight
  averageScore: number    // mean across all runs (0 if none)
  completionRate: number  // share of runs ended by 'time' (0..1)
}

export interface StorageBackend {
  saveRun(run: NewRun): Promise<Run>
  getTopRuns(limit: number): Promise<Run[]>     // sorted desc by score
  getAllRuns(): Promise<Run[]>                  // sorted desc by endedAt (newest first)
  getEmailOptIns(): Promise<Run[]>              // subset with optedIn && email
  resetRuns(): Promise<void>
  getAggregateStats(): Promise<AggregateStats>
  // Attach an email + opt-in flag to a previously-saved run. Used by the
  // final-screen email capture, which runs AFTER the run is already on the
  // leaderboard. No-op if the id isn't found. The email is stored even when
  // optedIn=false (player gave it but didn't consent to updates — respect
  // the distinction in the CSV export).
  updateRunEmail(id: string, email: string, optedIn: boolean): Promise<void>

  // Save a standalone demo-direct opt-in (visitor reached the final screen
  // via "Show me Nexus in action" without playing the game). Creates a Run
  // record with source='demo', blank player + score + stats, just email and
  // optedIn. Filtered out of the visible top-10 (blank name), included in
  // the admin CSV export with source='demo' so it's distinguishable.
  saveLead(email: string, optedIn: boolean): Promise<Run>
}
