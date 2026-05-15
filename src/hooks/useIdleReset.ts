import { useEffect, useRef } from 'react'

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'pointerdown'] as const

interface Options {
  /** When true, the idle timer runs. When false (e.g. during gameplay or admin), it's paused. */
  enabled: boolean
  /** Milliseconds of inactivity before `onIdle` fires. */
  timeoutMs: number
  /** Called once per idle event (timer restarts on next activity). */
  onIdle: () => void
}

// Watches the window for user activity and fires `onIdle` after `timeoutMs` of silence,
// but only while `enabled`. Used for the attract-mode reset (SPEC §4 Screen 9 — 30s).
export function useIdleReset({ enabled, timeoutMs, onIdle }: Options) {
  const onIdleRef = useRef(onIdle)
  useEffect(() => { onIdleRef.current = onIdle }, [onIdle])

  useEffect(() => {
    if (!enabled) return

    let timer: ReturnType<typeof setTimeout> | null = null
    const reset = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => onIdleRef.current(), timeoutMs)
    }
    reset()

    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, reset, { passive: true })
    }
    return () => {
      if (timer) clearTimeout(timer)
      for (const ev of ACTIVITY_EVENTS) window.removeEventListener(ev, reset)
    }
  }, [enabled, timeoutMs])
}
