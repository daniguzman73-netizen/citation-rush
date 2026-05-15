// Single entry point for run persistence. Gameplay code imports `storage` from here.
//
// Backend selection:
//   - Browser bundle (Vercel previews + kiosk-until-Phase-5 + local dev): localStorage.
//   - Future kiosk build (Phase 5 — Electron host): swap in a better-sqlite3 backend that
//     satisfies the StorageBackend interface, writing to ./data/citation-rush.db.
//
// The swap is intentionally a one-line change here so nothing in gameplay code needs to
// move. Until that swap happens, the kiosk leaderboard lives in browser localStorage and
// will reset on cache wipe — call this out at booth setup.

import { localStorageBackend } from './storage/localStorageBackend'
import type { StorageBackend } from './storage/types'

export const storage: StorageBackend = localStorageBackend

export type { Run, NewRun, AggregateStats, StorageBackend, EndedBy } from './storage/types'
