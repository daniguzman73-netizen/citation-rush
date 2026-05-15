import { useEffect, useState } from 'react'
import { Audio } from '../audio/Audio'

interface Props { onDone: () => void }

const STEPS = ['3', '2', '1', 'GO'] as const
const TICK_MS = 700

export default function CountdownScreen({ onDone }: Props) {
  const [i, setI] = useState(0)

  useEffect(() => {
    // play SFX for the *current* step on mount/change
    if (i < STEPS.length) {
      if (STEPS[i] === 'GO') Audio.go()
      else Audio.tick()
    }
    if (i >= STEPS.length) { onDone(); return }
    const t = setTimeout(() => setI(i + 1), TICK_MS)
    return () => clearTimeout(t)
  }, [i, onDone])

  const label = STEPS[Math.min(i, STEPS.length - 1)]
  const isGo = label === 'GO'

  return (
    <div className="absolute inset-0 flex items-center justify-center text-white bg-black/70 backdrop-blur-sm">
      <div
        key={label}
        className="font-bold tracking-tight animate-countdown-pulse"
        style={{
          fontSize: 'clamp(8rem, 22vw, 18rem)',
          color: isGo ? '#a855f7' : '#ffffff',
          textShadow: isGo ? '0 0 60px rgba(168,85,247,0.6)' : '0 0 40px rgba(255,255,255,0.25)',
          lineHeight: 1,
        }}
      >
        {label}
      </div>
      <style>{`
        @keyframes countdown-pulse {
          from { transform: scale(0.6); opacity: 0; }
          40%  { transform: scale(1.05); opacity: 1; }
          to   { transform: scale(1); opacity: 1; }
        }
        .animate-countdown-pulse { animation: countdown-pulse ${TICK_MS}ms ease-out both; }
      `}</style>
    </div>
  )
}
