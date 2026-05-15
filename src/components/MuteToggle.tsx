import { useEffect, useState } from 'react'
import { Audio } from '../audio/Audio'

interface Props { className?: string }

export default function MuteToggle({ className = '' }: Props) {
  const [muted, setMuted] = useState(Audio.isMuted())

  useEffect(() => Audio.subscribe(setMuted), [])

  return (
    <button
      type="button"
      aria-label={muted ? 'Unmute' : 'Mute'}
      aria-pressed={muted}
      onClick={() => Audio.toggle()}
      className={
        'rounded-full bg-black/40 hover:bg-black/60 backdrop-blur ' +
        'text-white text-lg w-10 h-10 flex items-center justify-center ' +
        'border border-white/15 transition-colors ' +
        className
      }
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
