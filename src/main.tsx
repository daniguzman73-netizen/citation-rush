import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Kiosk hardening — block the right-click context menu so visitors can't
// "View image / Save as / Inspect element" their way out of the experience.
// Chrome --kiosk already disables most chrome UI; this catches what it doesn't.
window.addEventListener('contextmenu', (e) => e.preventDefault())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
