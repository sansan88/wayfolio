import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

/**
 * Service-Worker-Updates (vite-plugin-pwa, Modus «prompt»): Eine neue Version wird im Hintergrund
 * geladen; dann erscheint «Neue Version verfügbar – Aktualisieren». Geprüft wird beim Start,
 * beim Zurückkehren in die App, stündlich und auf Knopfdruck.
 */
let needRefresh = false
let registration: ServiceWorkerRegistration | undefined
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

let updateSW: (reload?: boolean) => Promise<void> = async () => undefined

export const initPwaUpdates = () => {
  if (!('serviceWorker' in navigator)) return
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      needRefresh = true
      notify()
    },
    onRegisteredSW(_url, reg) {
      registration = reg
      if (!reg) return
      const check = () => void reg.update().catch(() => undefined)
      setInterval(check, 60 * 60 * 1000)
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check())
    },
  })
}

/** Neue Version aktivieren und die Seite neu laden. */
export const applyUpdate = async () => {
  let reloaded = false
  const reload = () => {
    if (reloaded) return
    reloaded = true
    window.location.reload()
  }
  navigator.serviceWorker?.addEventListener('controllerchange', reload, { once: true })
  await updateSW(true)
  // falls der neue Service Worker die Seite nicht sofort übernimmt
  setTimeout(reload, 1500)
}

/** Sofort nach einer neuen Version suchen. true = Update bereit. */
export const checkForUpdate = async (): Promise<boolean> => {
  if (!registration) return false
  await registration.update().catch(() => undefined)
  // kurz warten, bis eine gefundene Version installiert ist
  for (let i = 0; i < 20 && !needRefresh && registration.installing; i++) await new Promise((r) => setTimeout(r, 300))
  if (registration.waiting) needRefresh = true
  notify()
  return needRefresh
}

export const usePwaUpdate = () => {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((n) => n + 1)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  return { needRefresh, applyUpdate, checkForUpdate }
}

/** Build-Zeitpunkt dieser Version (zur Kontrolle in den Einstellungen). */
export const APP_BUILD = __APP_BUILD__
