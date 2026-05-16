import { useEffect, useState } from 'react'

// Returns true whenever the tab is hidden (Page Visibility API). Used by App to
// pause the running game when a visitor walks away and the tab is backgrounded.
export function usePageVisibility(): boolean {
  const [hidden, setHidden] = useState(() =>
    typeof document !== 'undefined' && document.visibilityState === 'hidden',
  )

  useEffect(() => {
    const onChange = () => setHidden(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  return hidden
}
