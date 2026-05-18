import { useEffect, useRef, useState } from 'react'
import { storage, type Run } from '../storage'
import { Audio } from '../audio/Audio'
import CreditsModal from '../components/CreditsModal'

interface Props {
  onStart: () => void
  onSkipToDemo: () => void
  onAdminOpen: () => void
}

// Strip "Library, City, ST" suffixes so the ticker reads cleanly.
function shortInstitution(s: string): string {
  return s ? s.split(',')[0].trim() : ''
}

export default function WelcomeScreen({ onStart, onSkipToDemo, onAdminOpen }: Props) {
  const [entries, setEntries] = useState<Run[] | null>(null)
  const [tickIdx, setTickIdx] = useState(0)
  const [creditsOpen, setCreditsOpen] = useState(false)

  // Pull today's top 3 on mount.
  useEffect(() => {
    let cancelled = false
    storage.getTopRuns(3).then(r => { if (!cancelled) setEntries(r) })
    return () => { cancelled = true }
  }, [])

  // Rotate through entries every 5 seconds (matches Citation Challenge cadence).
  useEffect(() => {
    if (!entries || entries.length <= 1) return
    const id = setInterval(() => setTickIdx(i => (i + 1) % entries.length), 5000)
    return () => clearInterval(id)
  }, [entries])

  // Hidden admin gesture — 5 rapid taps on the wordmark within 800ms intervals.
  // Citation Challenge taps the logo icon; we don't have one, so the wordmark
  // text itself is the tap target.
  const tapsRef = useRef<number[]>([])
  const handleWordmarkTap = () => {
    const now = Date.now()
    tapsRef.current = tapsRef.current.filter(t => now - t < 800)
    tapsRef.current.push(now)
    if (tapsRef.current.length >= 5) {
      tapsRef.current = []
      onAdminOpen()
    }
  }

  const entry = entries?.[tickIdx]
  const rank  = tickIdx + 1
  const inst  = shortInstitution(entry?.institution ?? '')

  return (
    <div className="relative w-full h-full bg-[#F3F4F6] flex flex-col overflow-x-hidden">

      {/* ── Background orbs — purple top-left, purple bottom-right, green mid-right ───── */}
      <div
        className="absolute pointer-events-none animate-float-a"
        style={{
          width: 760, height: 760,
          top: '-18%', left: '-8%',
          background: 'radial-gradient(circle, rgba(94,51,191,0.10) 0%, transparent 65%)',
          borderRadius: '50%',
        }}
      />
      <div
        className="absolute pointer-events-none animate-float-b"
        style={{
          width: 540, height: 540,
          bottom: '0%', right: '-4%',
          background: 'radial-gradient(circle, rgba(94,51,191,0.08) 0%, transparent 65%)',
          borderRadius: '50%',
          animationDelay: '-2s',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 360, height: 360,
          top: '35%', right: '18%',
          background: 'radial-gradient(circle, rgba(22,171,3,0.06) 0%, transparent 65%)',
          borderRadius: '50%',
        }}
      />

      {/* ── Top bar ─────────────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-12 pt-10 pb-0">
        {/* Wordmark — text only, 5-tap admin gesture lives here */}
        <div
          className="cursor-default select-none"
          onPointerDown={handleWordmarkTap}
        >
          <div className="text-gray-900 font-bold text-xl tracking-tight leading-tight">Nexus Extend</div>
          <div className="text-gray-500 text-sm tracking-wide">by Clarivate</div>
        </div>

        {/* Conference badge */}
        <div className="flex items-center gap-3 border border-[#5E33BF]/30 bg-[#5E33BF]/8 rounded-xl px-5 py-2.5">
          <span className="text-[#5E33BF] text-sm font-semibold tracking-widest uppercase">ALA 2026</span>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-16">

        <h1
          className="font-black text-gray-900 leading-[1.05] tracking-tight mb-8 whitespace-nowrap"
          style={{ fontSize: 'clamp(56px, 5.6vw, 108px)' }}
        >
          CITATION RUSH
        </h1>

        <p
          className="text-gray-500 mb-16 leading-relaxed whitespace-nowrap"
          style={{ fontSize: 'clamp(20px, 1.5vw, 26px)' }}
        >
          Outrun AI's bad citations: Grab the verified, dodge the rest.
        </p>

        <button
          onPointerDown={() => {
            // iOS Safari requires the AudioContext to be resumed inside a
            // user-gesture handler — call this synchronously before any
            // state change or navigation.
            Audio.unlock()
            onStart()
          }}
          className="bg-[#5E33BF] hover:bg-[#4A25A0] active:scale-95 text-white font-black tracking-wide rounded-2xl shadow-2xl transition-all duration-100 select-none whitespace-nowrap"
          style={{
            fontSize: 28,
            paddingLeft: 80,
            paddingRight: 80,
            paddingTop: 28,
            paddingBottom: 28,
            boxShadow: '0 20px 60px rgba(94,51,191,0.45)',
          }}
        >
          Press start →
        </button>

        {/* Secondary route — bypasses the game and jumps straight to the
            Nexus Extend demo (SPEC §4 Screen 1). No data is captured for
            these visitors; they didn't opt into the game. */}
        <button
          type="button"
          onPointerDown={onSkipToDemo}
          className="mt-7 text-base text-gray-500 hover:text-gray-800 underline underline-offset-4 transition-colors"
        >
          Just show me the demo →
        </button>

        {/* Stats row */}
        <div className="mt-8 flex items-center gap-7 text-gray-600 text-lg">
          <span>⏱ 60 seconds</span>
          <span className="w-1 h-1 rounded-full bg-gray-700" />
          <span>🏃 3 hits = game over</span>
          <span className="w-1 h-1 rounded-full bg-gray-700" />
          <span>🏆 Score on the leaderboard</span>
        </div>
      </div>

      {/* ── Bottom ticker ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 bg-white border-t border-gray-200">
        <div className="flex items-center gap-4 px-10 py-4">
          <span className="text-gray-500 text-sm font-semibold uppercase tracking-widest whitespace-nowrap flex-shrink-0">
            🏆 Today's Leaderboard
          </span>
          <span className="w-px h-5 bg-gray-200 flex-shrink-0" />

          <div className="flex-1 overflow-hidden">
            {entries === null && (
              <span className="inline-block text-gray-400 text-base">Loading…</span>
            )}
            {entries !== null && entries.length === 0 && (
              <span className="inline-block text-gray-500 text-base">
                🏆 Be the first on today's leaderboard
              </span>
            )}
            {entries !== null && entries.length > 0 && entry && (
              <span key={tickIdx} className="inline-block text-gray-500 text-base animate-fade-in">
                <span className="text-gray-700 font-bold">🏆 #{rank}</span>
                {' '}
                <span className="text-gray-900 font-semibold">{entry.name}</span>
                {inst && <>{' '}from{' '}<span className="text-gray-700">{inst}</span></>}
                {' — '}
                <span className="text-[#16AB03] font-bold">{entry.score} pts</span>
              </span>
            )}
          </div>

          {entries && entries.length > 1 && (
            <div className="flex-shrink-0 flex items-center gap-1.5">
              {entries.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                    i === tickIdx ? 'bg-[#5E33BF]' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Credits link — visible text stays small for low visual weight, but the
            tappable area is bumped to 44×44 (Apple HIG) so it's hittable by finger. */}
        <div className="flex justify-center">
          <button
            type="button"
            onPointerDown={() => setCreditsOpen(true)}
            className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3"
          >
            Credits
          </button>
        </div>
      </div>

      {creditsOpen && <CreditsModal onClose={() => setCreditsOpen(false)} />}
    </div>
  )
}
