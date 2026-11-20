export interface Position {
  lat: number
  lon: number
  accuracy: number
}

export interface Place {
  name: string
  countryCode: string | null
}

/** Aktuelle Position aus dem Browser (später Capacitor Geolocation in der iOS-App). */
export const getPosition = (): Promise<Position> =>
  new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Dieses Gerät kann keinen Standort ermitteln.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? 'Standortzugriff wurde nicht erlaubt.'
              : 'Standort konnte nicht ermittelt werden.',
          ),
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    )
  })

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
export const searchPlaces = async (query: string): Promise<SearchResult[]> => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=de,en&q=${encodeURIComponent(query)}`
    const res = await nominatim(url)
    if (!res.ok) return []
    const data = (await res.json()) as { name?: string; display_name: string; lat: string; lon: string }[]
    return data.map((d) => ({
      name: d.name || d.display_name.split(',')[0],
      detail: d.display_name,
      lat: Number(d.lat),
      lon: Number(d.lon),
    }))
  } catch {
    return []
  }
}
