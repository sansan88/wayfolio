import { useEffect, useState } from 'react'

const PREFIX = 'wayfolio-cache:'

/**
 * Daten laden und die letzte erfolgreiche Antwort lokal speichern. Ohne Verbindung
 * (oder bei einem Netzwerkfehler) wird die gespeicherte Antwort zurückgegeben.
 * Bilder kommen offline aus dem Service-Worker-Cache.
 */
export const cachedLoad = async <T>(key: string, load: () => Promise<T>): Promise<T> => {
  const read = (): T | undefined => {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw ? (JSON.parse(raw) as T) : undefined
    } catch {
      return undefined
    }
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const cached = read()
    if (cached !== undefined) return cached
  }
  try {
    const fresh = await load()
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(fresh))
    } catch {
      /* Speicher voll: dann eben ohne Offline-Kopie */
    }
    return fresh
  } catch (e) {
    // nur bei fehlender Verbindung auf die gespeicherte Kopie ausweichen (nicht z.B. bei gesperrtem Link)
    const cached = isNetworkError(e) ? read() : undefined
    if (cached !== undefined) return cached
    throw e
  }
}

const isNetworkError = (e: unknown) =>
  (typeof navigator !== 'undefined' && !navigator.onLine) ||
  e instanceof TypeError ||
  /fetch|network|load failed|keine verbindung|timed? ?out/i.test(String((e as Error)?.message ?? e))

/** Online-Status des Geräts (für den Offline-Hinweis). */
export const useOnline = () => {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

/** Gespeicherte Kopie sofort lesen (für die erste Anzeige, bevor das Netz antwortet). */
export const peekCache = <T>(key: string): T | undefined => {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch {
    return undefined
  }
}
