import { useEffect, useState } from 'react'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: InstallPromptEvent | null = null
const listeners = new Set<() => void>()

/** Früh in main.tsx aufrufen: Chrome/Android meldet die Installierbarkeit nur einmal. */
export const captureInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as InstallPromptEvent
    listeners.forEach((l) => l())
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    listeners.forEach((l) => l())
  })
}

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

export const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** Ob/wie die App auf den Home-Bildschirm kann: 'installed' | 'prompt' (Button) | 'ios' (Anleitung) | 'other' */
export const useInstall = () => {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((n) => n + 1)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  const mode: 'installed' | 'prompt' | 'ios' | 'other' = isStandalone() ? 'installed' : deferred ? 'prompt' : isIos() ? 'ios' : 'other'
  const install = async () => {
    if (!deferred) return false
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    deferred = null
    force((n) => n + 1)
    return outcome === 'accepted'
  }
  return { mode, install }
}

export const installHelp = () =>
  isIos()
    ? 'In Safari unten auf das Teilen-Symbol tippen und «Zum Home-Bildschirm» wählen. Little Footnotes startet dann wie eine App – auch offline.'
    : 'Im Browser-Menü «App installieren» bzw. «Zum Startbildschirm hinzufügen» wählen.'
