// Shared cross-screen types.
import type { GameState } from './game/GameEngine'

export type Screen =
  | 'welcome'
  | 'intake'
  | 'tutorial'
  | 'countdown'
  | 'game'
  | 'results'
  | 'demo'    // Phase 4: Nexus Extend reveal. Placeholder for now.

export interface PlayerInfo {
  name: string
  institution: string
  email: string
  optedIn: boolean
}

export type FinalResult = GameState
