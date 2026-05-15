interface Props {
  onStart: () => void
  onSkipToDemo: () => void
  onSeeLeaderboard: () => void
}

export default function WelcomeScreen({ onStart, onSkipToDemo, onSeeLeaderboard }: Props) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="text-[11px] uppercase tracking-[0.3em] text-purple-300/80">Nexus Extend</div>
      <h1
        className="mt-3 font-bold tracking-tight"
        style={{ fontSize: 'clamp(3rem, 9vw, 7rem)', lineHeight: 1 }}
      >
        CITATION RUSH
      </h1>
      <p className="mt-6 text-neutral-300 italic max-w-2xl text-lg md:text-xl">
        Grab the good. Dodge the bad. See if you can outrun AI's worst citations.
      </p>

      <button
        type="button"
        onClick={onStart}
        className="mt-12 px-10 py-4 rounded-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-xl font-semibold transition-colors shadow-lg shadow-purple-900/40"
      >
        Press start →
      </button>

      <button
        type="button"
        onClick={onSkipToDemo}
        className="mt-6 text-sm text-neutral-400 hover:text-neutral-200 underline underline-offset-4 transition-colors"
      >
        Just show me the demo →
      </button>

      <button
        type="button"
        onClick={onSeeLeaderboard}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-300 transition-colors"
      >
        🏆 Leaderboard
      </button>

      <div className="absolute bottom-6 right-6 text-xs text-neutral-500 tracking-wider">
        Clarivate · Nexus Extend
      </div>
    </div>
  )
}
