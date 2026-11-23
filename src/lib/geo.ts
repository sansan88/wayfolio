/** Luftlinie in km (Haversine) – ohne MapLibre, damit das Hauptpaket klein bleibt. */
export const distanceKm = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const r = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(h))
}

/** Alte automatische Distanzzeile («12 km seit X · 80 km gesamt») – wird nicht mehr angezeigt. */
export const isDistanceLine = (text: string | null | undefined) => !!text && /^\d+ km seit .+ · \d+ km gesamt$/.test(text.trim())

/** Version der Routenbilder – ist variants.v kleiner, wird das Bild neu erzeugt (2 = Ausschnitt nah am aktuellen Ort). */
export const ROUTE_IMAGE_VERSION = 3
