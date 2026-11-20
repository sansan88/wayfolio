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

/**
 * Ortsname per OpenStreetMap Nominatim (Reverse Geocoding).
 * Nutzungsregeln: max. 1 Anfrage/Sekunde; für grösseres Volumen später eigener Dienst (z.B. MapTiler Geocoding).
 */
export const reverseGeocode = async ({ lat, lon }: Position): Promise<Place> => {
  const fallback: Place = { name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, countryCode: null }
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=de,en&lat=${lat}&lon=${lon}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
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
    return { name: name || fallback.name, countryCode: a.country_code?.toUpperCase() ?? null }
  } catch {
    return fallback
  }
}

/** WKT für die geography-Spalten in Supabase (Reihenfolge: Länge, Breite). */
export const toWkt = ({ lat, lon }: Position) => `SRID=4326;POINT(${lon} ${lat})`
