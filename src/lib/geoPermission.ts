import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { useCallback, useEffect, useState } from 'react'

import { getPosition } from './location'

export type GeoPermission = 'granted' | 'denied' | 'prompt' | 'unknown'

const STORAGE_KEY = 'wayfolio-geo-granted'

const remember = (ok: boolean) => {
  try {
    if (ok) localStorage.setItem(STORAGE_KEY, '1')
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* privater Modus */
  }
}

const remembered = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** Aktueller Stand der Standort-Berechtigung (Capacitor: nativ bzw. Permissions-API im Browser). */
export const checkGeoPermission = async (): Promise<GeoPermission> => {
  try {
    const { location } = await Geolocation.checkPermissions()
    if (location === 'granted') {
      remember(true)
      return 'granted'
    }
    if (location === 'denied') {
      remember(false)
      return 'denied'
    }
    // Safari meldet nach einer Freigabe teils wieder «prompt»: unsere letzte erfolgreiche Freigabe zählt
    return remembered() ? 'granted' : 'prompt'
  } catch {
    // ältere Browser ohne Permissions-API
    return remembered() ? 'granted' : 'unknown'
  }
}

/**
 * Berechtigung anfragen – muss aus einem Tipp heraus aufgerufen werden.
 * Nativ über requestPermissions(); im Browser gibt es dafür keine eigene API (siehe Capacitor-Doku),
 * dort löst die erste Standortabfrage den Dialog aus. Der Browser speichert die Freigabe für die Seite.
 */
export const requestGeoPermission = async (): Promise<GeoPermission> => {
  if (Capacitor.isNativePlatform()) {
    const { location } = await Geolocation.requestPermissions()
    const ok = location === 'granted'
    remember(ok)
    return ok ? 'granted' : 'denied'
  }
  try {
    await getPosition()
    remember(true)
    return 'granted'
  } catch (e) {
    const state = await checkGeoPermission()
    if (state === 'denied' || (e as Error).message.startsWith('Standortzugriff')) {
      remember(false)
      return 'denied'
    }
    // Zugriff erlaubt, aber gerade kein Signal
    return state === 'prompt' ? 'granted' : state
  }
}

/** Hook: Status + Anfrage; reagiert auf Änderungen in den Browser-Einstellungen. */
export const useGeoPermission = () => {
  const [state, setState] = useState<GeoPermission>('unknown')

  useEffect(() => {
    let alive = true
    let status: PermissionStatus | null = null
    const update = () => void checkGeoPermission().then((s) => alive && setState(s))
    update()
    if (!Capacitor.isNativePlatform() && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((s) => {
          status = s
          s.addEventListener('change', update)
        })
        .catch(() => undefined)
    }
    return () => {
      alive = false
      status?.removeEventListener('change', update)
    }
  }, [])

  const request = useCallback(async () => {
    const s = await requestGeoPermission()
    setState(s)
    return s
  }, [])

  return { state, request }
}

/** Anleitung, wenn der Zugriff gesperrt ist. */
export const geoDeniedHelp = () => {
  if (Capacitor.isNativePlatform()) return 'Einstellungen › Wayfolio › Standort › «Beim Verwenden der App».'
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (ios)
    return 'iPhone: Einstellungen › Datenschutz & Sicherheit › Ortungsdienste › Safari-Websites › «Beim Verwenden der App». Dann in Safari «aA» › Website-Einstellungen › Standort › «Erlauben» – so fragt Safari nicht jedes Mal.'
  return 'Im Browser auf das Schloss neben der Adresse tippen › Standort › «Erlauben».'
}
