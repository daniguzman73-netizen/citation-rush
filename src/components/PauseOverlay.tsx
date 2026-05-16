interface Props { onResume: () => void }

// Shown over the canvas when the game is paused (currently: tab hidden mid-run).
// Resume happens automatically when the tab is visible again — the button is a
// fallback for kiosk hardware where visibility events behave oddly.
export default function PauseOverlay({ onResume }: Props) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm text-white text-center px-6">
      <div className="text-5xl md:text-6xl font-bold tracking-tight">Paused</div>
      <p className="mt-3 text-neutral-300">Your run is on hold — return to play.</p>
      <button
        type="button"
        onClick={onResume}
        className="mt-8 px-8 py-3 rounded-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-lg font-semibold transition-colors"
      >
        Resume →
      </button>
    </div>
  )
}
