import { useCallback, useRef, useState } from 'react'
import GameCanvas from './components/GameCanvas'
import MuteToggle from './components/MuteToggle'
import WelcomeScreen from './screens/WelcomeScreen'
import IntakeScreen from './screens/IntakeScreen'
import TutorialScreen from './screens/TutorialScreen'
import CountdownScreen from './screens/CountdownScreen'
import ResultsScreen from './screens/ResultsScreen'
import DemoPlaceholder from './screens/DemoPlaceholder'
import type { Screen, PlayerInfo, FinalResult } from './types'
import type { GameEngine } from './game/GameEngine'

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [player, setPlayer] = useState<PlayerInfo | null>(null)
  const [result, setResult] = useState<FinalResult | null>(null)
  const engineRef = useRef<GameEngine | null>(null)

  const handleStart = useCallback(() => setScreen('intake'), [])
  const handleSkipToDemo = useCallback(() => setScreen('demo'), [])

  const handleIntakeSubmit = useCallback((info: PlayerInfo) => {
    setPlayer(info)
    setScreen('tutorial')
  }, [])

  const handleTutorialDone = useCallback(() => setScreen('countdown'), [])

  const handleCountdownDone = useCallback(() => {
    setScreen('game')
    // start the engine on the next frame so the canvas is mounted
    requestAnimationFrame(() => engineRef.current?.start())
  }, [])

  const handleRunEnd = useCallback((final: FinalResult) => {
    setResult(final)
    setScreen('results')
  }, [])

  const handleSeeNexus = useCallback(() => setScreen('demo'), [])
  const handlePlayAgain = useCallback(() => {
    setResult(null)
    // keep player info so they don't re-enter it on a back-to-back run
    setScreen('countdown')
  }, [])
  const handleResetToWelcome = useCallback(() => {
    setResult(null)
    setPlayer(null)
    setScreen('welcome')
  }, [])

  // The canvas needs to be mounted during countdown + game (so the engine is ready to start).
  // Keep it mounted across the whole session for simpler lifecycle, hidden when not in use.
  const canvasVisible = screen === 'game' || screen === 'countdown'

  return (
    <div className="w-screen h-screen overflow-hidden bg-neutral-950 relative">
      <div className={canvasVisible ? 'absolute inset-0' : 'absolute inset-0 invisible'}>
        <GameCanvas
          onRunEnd={handleRunEnd}
          onReady={(engine) => { engineRef.current = engine }}
        />
      </div>

      {screen === 'welcome' && (
        <WelcomeScreen onStart={handleStart} onSkipToDemo={handleSkipToDemo} />
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
        />
      )}
      {screen === 'demo' && <DemoPlaceholder onBack={handleResetToWelcome} />}

      {screen !== 'game' && screen !== 'countdown' && (
        <div className="absolute bottom-4 left-4 z-10">
          <MuteToggle />
        </div>
      )}
    </div>
  )
}
