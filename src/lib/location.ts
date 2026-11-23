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
      return new Error('Standortzugriff ist nicht erlaubt. Bitte in den Einstellungen › Little Footnotes › Standort «Beim Verwenden der App» wählen.')
    if (isIos())
      return new Error(
        'Standortzugriff ist nicht erlaubt. iPhone: Einstellungen › Datenschutz & Sicherheit › Ortungsdienste › Safari-Websites › «Beim Verwenden der App», danach in Safari über «aA» › Website-Einstellungen › Standort «Erlauben». Oder den Ort manuell setzen.',
      )
    return new Error('Standortzugriff ist nicht erlaubt. Bitte im Browser für diese Seite erlauben oder den Ort manuell setzen.')
  }
  if (code === 3 || /timeout/i.test(message)) return new Error('Kein GPS-Signal (Zeitüberschreitung). Bitte draussen erneut versuchen oder den Ort manuell setzen.')
  return new Error(
    `Standort konnte nicht ermittelt werden${code ? ` (Code ${code})` : ''}. Bitte Ortungsdienste und «Genauer Standort» prüfen oder den Ort manuell setzen.`,
  )
}

const toPosition = (p: { coords: { latitude: number; longitude: number; accuracy: number } }): Position => ({
  lat: p.coords.latitude,
  lon: p.coords.longitude,
  accuracy: p.coords.accuracy,
})

/**
 * Aktuelle Position über das Capacitor-Geolocation-Plugin (nativ CoreLocation, im Web navigator.geolocation).
 * iOS liefert bei Einzelabfragen oft vorübergehend «Position unbekannt» (Code 2) – deshalb beobachten wir
 * die Position kurz (watchPosition), nehmen den ersten genauen Fix bzw. nach 8 s den besten bisherigen
 * und brechen erst nach 25 s ohne jeden Fix ab. Gleichzeitige Abfragen teilen sich eine Messung.
 */
let pending: Promise<Position> | null = null

export const getPosition = (): Promise<Position> => {
  pending ??= locate().finally(() => {
    pending = null
  })
  return pending
}

const locate = async (): Promise<Position> => {
  if (!Capacitor.isNativePlatform()) {
    if (!('geolocation' in navigator)) throw new Error('Dieses Gerät oder dieser Browser kann keinen Standort ermitteln.')
    if (!window.isSecureContext) throw new Error('Standort geht nur über https.')
  } else {
    let status = await Geolocation.checkPermissions()
    if (status.location === 'prompt' || status.location === 'prompt-with-rationale') status = await Geolocation.requestPermissions()
    if (status.location === 'denied') throw locationError({ code: 1 })
  }

  return new Promise<Position>((resolve, reject) => {
    let best: Position | null = null
    let lastError: unknown = null
    let watchId: string | null = null
    let done = false

    const finish = (result: () => void) => {
      if (done) return
      done = true
      clearTimeout(soft)
      clearTimeout(hard)
      if (watchId) void Geolocation.clearWatch({ id: watchId })
      result()
    }
    const soft = setTimeout(() => best && finish(() => resolve(best!)), 8000)
    const hard = setTimeout(
      () => finish(() => (best ? resolve(best) : reject(locationError(lastError ?? { code: 3 })))),
      25000,
    )

    Geolocation.watchPosition({ enableHighAccuracy: true, timeout: 25000, maximumAge: 60000 }, (pos, err) => {
      if (err || !pos) {
        lastError = err
        const e = locationError(err)
        if (e.message.startsWith('Standortzugriff')) finish(() => reject(e))
        return // Code 2/3: weiter warten, iOS liefert oft kurz danach einen Fix
      }
      const p = toPosition(pos)
      if (!best || p.accuracy < best.accuracy) best = p
      if (p.accuracy <= 150) finish(() => resolve(p))
    })
      .then((id) => {
        watchId = id
        if (done) void Geolocation.clearWatch({ id })
      })
      .catch((err) => finish(() => reject(locationError(err))))
  })
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
