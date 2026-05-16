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
        'rounded-full bg-white/80 hover:bg-white backdrop-blur ' +
        'text-gray-700 text-lg w-10 h-10 flex items-center justify-center ' +
        'border border-gray-200 shadow-sm transition-colors ' +
        className
      }
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
