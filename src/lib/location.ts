import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

export interface Position {
  lat: number
  lon: number
  accuracy: number
}

export interface Place {
  name: string
  countryCode: string | null
}

const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** Verständliche Meldung je nach Fehler und Plattform. */
const locationError = (err: unknown): Error => {
  const code = (err as { code?: number | string })?.code
  const message = String((err as { message?: string })?.message ?? '')
  const denied = code === 1 || code === 'OS-PLUG-GLOC-0003' || /denied|permission/i.test(message)
  if (denied) {
    if (Capacitor.isNativePlatform())
      return new Error('Standortzugriff ist nicht erlaubt. Bitte in den Einstellungen › Wayfolio › Standort «Beim Verwenden der App» wählen.')
    if (isIos())
      return new Error(
        'Standortzugriff ist nicht erlaubt. iPhone: Einstellungen › Datenschutz & Sicherheit › Ortungsdienste › Safari-Websites › «Beim Verwenden der App», danach in Safari über «aA» › Website-Einstellungen › Standort «Erlauben». Oder den Ort manuell setzen.',
      )
    return new Error('Standortzugriff ist nicht erlaubt. Bitte im Browser für diese Seite erlauben oder den Ort manuell setzen.')
  }
  if (code === 3 || /timeout/i.test(message)) return new Error('Kein GPS-Signal (Zeitüberschreitung). Bitte draussen erneut versuchen oder den Ort manuell setzen.')
  return new Error('Standort konnte nicht ermittelt werden. Bitte Ortungsdienste prüfen oder den Ort manuell setzen.')
}

const toPosition = (p: { coords: { latitude: number; longitude: number; accuracy: number } }): Position => ({
  lat: p.coords.latitude,
  lon: p.coords.longitude,
  accuracy: p.coords.accuracy,
})

/**
 * Aktuelle Position über das Capacitor-Geolocation-Plugin: nativ in der iOS-App (CoreLocation),
 * im Browser über navigator.geolocation. Erst genau (GPS), bei Zeitüberschreitung ungenauer
 * (WLAN/Mobilfunk, auch eine bis 5 Minuten alte Position) – drinnen hat iOS oft lange keinen GPS-Fix.
 */
export const getPosition = async (): Promise<Position> => {
  if (!Capacitor.isNativePlatform()) {
    if (!('geolocation' in navigator)) throw new Error('Dieses Gerät oder dieser Browser kann keinen Standort ermitteln.')
    if (!window.isSecureContext) throw new Error('Standort geht nur über https.')
  } else {
    let status = await Geolocation.checkPermissions()
    if (status.location === 'prompt' || status.location === 'prompt-with-rationale') status = await Geolocation.requestPermissions()
    if (status.location === 'denied') throw locationError({ code: 1 })
  }
  try {
    return toPosition(await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }))
  } catch (err) {
    const e = locationError(err)
    if (e.message.startsWith('Standortzugriff')) throw e
    try {
      return toPosition(await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }))
    } catch (err2) {
      throw locationError(err2)
    }
  }
}

/** Nominatim erlaubt ca. 1 Anfrage/Sekunde: bei 429 einmal kurz warten und erneut versuchen. */
const nominatim = async (url: string): Promise<Response> => {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (res.status !== 429) return res
  await new Promise((r) => setTimeout(r, 1200))
  return fetch(url, { headers: { Accept: 'application/json' } })
}

const placeCache = new Map<string, Place>()

/**
 * Ortsname per OpenStreetMap Nominatim (Reverse Geocoding).
 * Nutzungsregeln: max. 1 Anfrage/Sekunde; für grösseres Volumen später eigener Dienst (z.B. MapTiler Geocoding).
 */
export const reverseGeocode = async ({ lat, lon }: Position): Promise<Place> => {
  const fallback: Place = { name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, countryCode: null }
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`
  if (placeCache.has(key)) return placeCache.get(key)!
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=de,en&lat=${lat}&lon=${lon}`
    const res = await nominatim(url)
    if (!res.ok) return fallback
    const data = (await res.json()) as {
      address?: Record<string, string>
    }
    const a = data.address ?? {}
    // Ort vor Grossraum: Dorf/Stadt zuerst, Verwaltungs-Präfixe wie «Thành phố» (Stadt) entfernen
    const locality = (a.town ?? a.village ?? a.city ?? a.municipality ?? a.suburb ?? a.county)?.replace(
      /^(Thành phố|Tỉnh|City of)\s+/i,
      '',
    )
    const name = [locality, a.country].filter(Boolean).join(', ')
    const place = { name: name || fallback.name, countryCode: a.country_code?.toUpperCase() ?? null }
    placeCache.set(key, place)
    return place
  } catch {
    return fallback
  }
}

/** WKT für die geography-Spalten in Supabase (Reihenfolge: Länge, Breite). */
export const toWkt = ({ lat, lon }: Position) => `SRID=4326;POINT(${lon} ${lat})`

export interface SearchResult {
  name: string
  detail: string
  lat: number
  lon: number
}

/** Ortssuche per OpenStreetMap Nominatim (für das manuelle Setzen des Pins). */
/** Grobe Distanz in km (für die Sortierung der Suchtreffer). */
const roughKm = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const r = Math.PI / 180
  const x = (b.lon - a.lon) * r * Math.cos(((a.lat + b.lat) / 2) * r)
  const y = (b.lat - a.lat) * r
  return Math.sqrt(x * x + y * y) * 6371
}

/**
 * Ortssuche; Treffer in der Nähe der aktuellen Karte (z.B. dem Reiseland) zuerst –
 * sonst landet «Tekapo» schnell in den USA statt in Neuseeland.
 */
export const searchPlaces = async (query: string, near?: { lat: number; lon: number }): Promise<SearchResult[]> => {
  try {
    const bias = near
      ? `&viewbox=${near.lon - 8},${near.lat + 8},${near.lon + 8},${near.lat - 8}`
      : ''
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&accept-language=de,en${bias}&q=${encodeURIComponent(query)}`
    const res = await nominatim(url)
    if (!res.ok) return []
    const data = (await res.json()) as { name?: string; display_name: string; lat: string; lon: string }[]
    const results = data.map((d) => ({
      name: d.name || d.display_name.split(',')[0],
      detail: d.display_name,
      lat: Number(d.lat),
      lon: Number(d.lon),
    }))
    if (!near) return results
    // Treffer im Umkreis von 2000 km nach vorne, Reihenfolge sonst beibehalten
    const close = results.filter((r) => roughKm(near, r) < 2000)
    return [...close, ...results.filter((r) => !close.includes(r))]
  } catch {
    return []
  }
}
