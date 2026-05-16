import { useRef } from 'react'

interface Props {
  onStart: () => void
  onSkipToDemo: () => void
  onSeeLeaderboard: () => void
  onAdminOpen: () => void
}

export default function WelcomeScreen({ onStart, onSkipToDemo, onSeeLeaderboard, onAdminOpen }: Props) {
  // 5 taps on the logo within 3s opens the admin panel (kiosk back-door per handoff §3).
  const tapsRef = useRef<number[]>([])
  const handleLogoTap = () => {
    const now = Date.now()
    tapsRef.current = tapsRef.current.filter(t => now - t < 3000)
    tapsRef.current.push(now)
    if (tapsRef.current.length >= 5) {
      tapsRef.current = []
      onAdminOpen()
    }
  }
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-[#F3F4F6]">
      <div className="text-[11px] uppercase tracking-[0.3em] text-purple-700/90 font-semibold">Nexus Extend</div>
      <h1
        className="mt-3 font-bold tracking-tight text-gray-900"
        style={{ fontSize: 'clamp(3rem, 9vw, 7rem)', lineHeight: 1 }}
      >
        CITATION RUSH
      </h1>
      <p className="mt-6 text-gray-600 italic max-w-2xl text-lg md:text-xl">
        Grab the good. Dodge the bad. See if you can outrun AI's worst citations.
      </p>

      <button
        type="button"
        onClick={onStart}
        className="mt-12 px-10 py-4 rounded-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xl font-semibold transition-colors shadow-lg shadow-purple-900/20"
      >
        Press start →
      </button>

      <button
        type="button"
        onClick={onSkipToDemo}
        className="mt-6 text-sm text-gray-500 hover:text-gray-800 underline underline-offset-4 transition-colors"
      >
        Just show me the demo →
      </button>

      <button
        type="button"
        onClick={onSeeLeaderboard}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs uppercase tracking-widest text-gray-500 hover:text-gray-800 transition-colors"
      >
        🏆 Leaderboard
      </button>

      <button
        type="button"
        onClick={handleLogoTap}
        aria-label="Logo"
        className="absolute bottom-6 right-6 text-xs text-gray-500 tracking-wider hover:text-gray-700 transition-colors cursor-default"
      >
        Clarivate · Nexus Extend
      </button>
    </div>
  )
}
