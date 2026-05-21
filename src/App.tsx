import { useCallback, useEffect, useRef, useState } from 'react'
import GameCanvas from './components/GameCanvas'
import MuteToggle from './components/MuteToggle'
import PauseOverlay from './components/PauseOverlay'
import WelcomeScreen from './screens/WelcomeScreen'
import IntakeScreen from './screens/IntakeScreen'
import TutorialScreen from './screens/TutorialScreen'
import CountdownScreen from './screens/CountdownScreen'
import ResultsScreen from './screens/ResultsScreen'
import NexusRevealScreen, { DEFAULT_SCENARIO } from './screens/NexusRevealScreen'
import LeaderboardScreen from './screens/LeaderboardScreen'
import AdminPanel from './components/AdminPanel'
import { useIdleReset } from './hooks/useIdleReset'
import { usePageVisibility } from './hooks/usePageVisibility'

const IDLE_RESET_MS = 30_000
import type { Screen, PlayerInfo, FinalResult } from './types'
import type { GameEngine } from './game/GameEngine'
import { storage } from './storage'
import { GAME_DURATION_S } from './game/constants'

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [player, setPlayer] = useState<PlayerInfo | null>(null)
  const [result, setResult] = useState<FinalResult | null>(null)
  const [savedRunId, setSavedRunId] = useState<string | null>(null)
  const [adminOpen, setAdminOpen] = useState(false)
  const [paused, setPaused] = useState(false)
  const engineRef = useRef<GameEngine | null>(null)
  const runStartedAtRef = useRef<number>(0)
  const pageHidden = usePageVisibility()

  const handleStart = useCallback(() => setScreen('intake'), [])
  // Secondary route from the Welcome screen — skips intake / tutorial / game,
  // jumps straight to the Nexus Extend demo. No player data captured.
  const handleSkipToDemo = useCallback(() => setScreen('demo'), [])

  const handleIntakeSubmit = useCallback((info: PlayerInfo) => {
    setPlayer(info)
    setScreen('tutorial')
  }, [])

  const handleTutorialDone = useCallback(() => setScreen('countdown'), [])

  const handleCountdownDone = useCallback(() => {
    setScreen('game')
    runStartedAtRef.current = Date.now()
    // start the engine on the next frame so the canvas is mounted
    requestAnimationFrame(() => engineRef.current?.start())
  }, [])

  const handleRunEnd = useCallback((final: FinalResult) => {
    setResult(final)
    setScreen('results')

    // Persist the run. Fire-and-forget — backend swallows storage errors and the
    // results screen renders from `final` directly, not from storage.
    //
    // ALL runs are saved (including skipped-intake guests) so the
    // leaderboard's email-capture card has a record to attach the email to.
    // Guest runs are persisted with BLANK name + institution so the visible
    // top-10 query can filter them out (see localStorageBackend.getTopRuns).
    // They still count toward aggregate stats and appear in the admin CSV
    // export — which is what gives guests a real opt-in channel.
    if (player && final.endedBy) {
      const endedAt = Date.now()
      const startedAt = runStartedAtRef.current || endedAt - GAME_DURATION_S * 1000
      const survivedSeconds = Math.max(0, Math.min(GAME_DURATION_S, Math.floor(GAME_DURATION_S - final.timeRemaining)))
      storage.saveRun({
        source:      'game',
        name:        player.anonymous ? '' : player.name,
        institution: player.anonymous ? '' : player.institution,
        email:       player.email,
        optedIn:     player.optedIn,
        startedAt,
        endedAt,
        score: Math.max(0, final.score),
        survivedSeconds,
        endedBy: final.endedBy,
        stats: final.stats,
      }).then(saved => setSavedRunId(saved.id))
    }
  }, [player])

  const handleSeeLeaderboard = useCallback(() => setScreen('leaderboard'), [])

  const handleSeeNexus = useCallback(() => setScreen('demo'), [])
  const handlePlayAgain = useCallback(() => {
    setResult(null)
    setSavedRunId(null)
    // Keep player info so they don't re-enter it on a back-to-back run
    // (matches SPEC §4 Screen 8 "skip intake if same session within 5 minutes" —
    // implemented as "same browser session" here, simpler and sufficient for booth).
    setScreen('countdown')
  }, [])
  const handleResetToWelcome = useCallback(() => {
    setResult(null)
    setSavedRunId(null)
    setPlayer(null)
    setScreen('welcome')
  }, [])

  // The canvas needs to be mounted during countdown + game (so the engine is ready to start).
  // Keep it mounted across the whole session for simpler lifecycle, hidden when not in use.
  const canvasVisible = screen === 'game' || screen === 'countdown'

  // SPEC §4 Screen 9 — return to attract mode after 30s of inactivity on a non-gameplay
  // screen. Paused while: (a) actively playing, (b) on the welcome screen already, or
  // (c) the admin panel is open (so booth staff aren't ejected mid-task).
  const idleEnabled = !adminOpen && screen !== 'welcome' && screen !== 'countdown' && screen !== 'game'
  useIdleReset({
    enabled: idleEnabled,
    timeoutMs: IDLE_RESET_MS,
    onIdle: handleResetToWelcome,
  })

  // Pause the running game whenever the tab is hidden, resume when it returns.
  // The engine's timer / spawning / movement freeze; visitor returns to the same scene.
  useEffect(() => {
    const engine = engineRef.current
    if (!engine || screen !== 'game') return
    if (pageHidden) {
      engine.pause()
      setPaused(true)
    } else {
      engine.resume()
      setPaused(false)
    }
  }, [pageHidden, screen])

  const handleResume = useCallback(() => {
    engineRef.current?.resume()
    setPaused(false)
  }, [])

  return (
    <div className="w-screen h-screen overflow-hidden bg-neutral-950 relative">
      <div className={canvasVisible ? 'absolute inset-0' : 'absolute inset-0 invisible'}>
        <GameCanvas
          onRunEnd={handleRunEnd}
          onReady={(engine) => { engineRef.current = engine }}
        />
      </div>

      {screen === 'welcome' && (
        <WelcomeScreen
          onStart={handleStart}
          onSkipToDemo={handleSkipToDemo}
          onAdminOpen={() => setAdminOpen(true)}
        />
      )}
      {screen === 'intake' && (
        <IntakeScreen
          initial={player ?? undefined}
          onSubmit={handleIntakeSubmit}
          onBack={handleResetToWelcome}
        />
      )}
      {screen === 'tutorial' && <TutorialScreen onDone={handleTutorialDone} />}
      {screen === 'countdown' && <CountdownScreen onDone={handleCountdownDone} />}
      {screen === 'results' && player && result && (
        <ResultsScreen
          player={player}
          result={result}
          onSeeNexus={handleSeeNexus}
          onPlayAgain={handlePlayAgain}
          onSeeLeaderboard={handleSeeLeaderboard}
        />
      )}
      {screen === 'demo' && (
        <NexusRevealScreen
          scenario={DEFAULT_SCENARIO}
          institution={player?.institution ?? null}
          onContinue={handleSeeLeaderboard}
        />
      )}
      {screen === 'leaderboard' && (
        <LeaderboardScreen
          highlightRunId={savedRunId}
          onPlayAgain={player ? handlePlayAgain : handleResetToWelcome}
          onDone={handleResetToWelcome}
        />
      )}

      {/* Mute toggle is suppressed on welcome (overlaps the bottom leaderboard ticker)
          and obviously on the countdown/gameplay screens. The admin panel has its
          own audio toggle for booth staff. */}
      {screen !== 'game' && screen !== 'countdown' && screen !== 'welcome' && (
        <div className="absolute bottom-4 left-4 z-10">
          <MuteToggle />
        </div>
      )}

      {screen === 'game' && paused && <PauseOverlay onResume={handleResume} />}

      {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} />}
    </div>
  )
}
