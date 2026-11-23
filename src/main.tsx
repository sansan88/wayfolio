import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setupIonicReact } from '@ionic/react'
import App from './App'

/* Ionic Basis-Styles */
import '@ionic/react/css/core.css'
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/typography.css'
import '@ionic/react/css/padding.css'
import '@ionic/react/css/flex-utils.css'
import '@ionic/react/css/display.css'
import '@ionic/react/css/palettes/dark.system.css'

import './theme/variables.css'
import { captureInstallPrompt } from './lib/pwa'
import { registerSW } from 'virtual:pwa-register'

// iOS-Stil auf allen Plattformen (Zielgruppe: iPhone; PWA und spätere iOS-App sehen gleich aus)
setupIonicReact({ mode: 'ios' })
captureInstallPrompt()

// Neue Version automatisch laden: beim Start, wenn die App wieder in den Vordergrund kommt und stündlich
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return
    const check = () => void reg.update().catch(() => undefined)
    setInterval(check, 60 * 60 * 1000)
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check())
  },
})
void updateSW

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
