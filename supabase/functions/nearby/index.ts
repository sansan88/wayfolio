// Little Footnotes – «In der Nähe entdecken»: externe Quellen über den Server abfragen.
// POST {source: "wikipedia", lat, lon, radiusKm} mit Anmeldung (JWT). Der Standort wird auf ~1 km
// gerundet weitergegeben; Wikipedia sieht weder die IP-Adresse noch den genauen Ort der Reisenden.
// OpenStreetMap (Overpass) fragt die App direkt ab: overpass-api.de lehnt Anfragen aus Rechenzentren ab.
const UA = 'LittleFootnotes/1.0 (https://littlefootnotes.app; team@littlefootnotes.app)'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=600' },
  })

interface Item {
  key: string
  title: string
  detail: string | null
  url: string
  lat: number
  lon: number
}

const coarse = (n: number) => Math.round(n * 100) / 100

// ---------------------------------------------------------------------------
// Wikipedia: Artikel mit Koordinaten (deutsch zuerst, dann englisch ohne Doppelte)
// ---------------------------------------------------------------------------
const wiki = async (lang: string, lat: number, lon: number, radiusKm: number) => {
  const params = new URLSearchParams({
    action: 'query',
    list: 'geosearch',
    gscoord: `${lat}|${lon}`,
    gsradius: String(Math.min(10_000, Math.round(radiusKm * 1000))),
    gslimit: '30',
    format: 'json',
  })
  const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params}`, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`Wikipedia ${res.status}`)
  const data = (await res.json()) as { query?: { geosearch?: { pageid: number; title: string; lat: number; lon: number }[] } }
  return (data.query?.geosearch ?? []).map((h) => ({ ...h, lang }))
}

const loadWikipedia = async (lat: number, lon: number, radiusKm: number): Promise<Item[]> => {
  const [de, en] = await Promise.allSettled([wiki('de', lat, lon, radiusKm), wiki('en', lat, lon, radiusKm)])
  if (de.status === 'rejected' && en.status === 'rejected') throw new Error('Wikipedia ist gerade nicht erreichbar.')
  const seen = new Set<string>()
  const out: Item[] = []
  for (const h of [...(de.status === 'fulfilled' ? de.value : []), ...(en.status === 'fulfilled' ? en.value : [])]) {
    // gleicher Ort oder gleicher Titel (Deutsch/Englisch) nur einmal
    const spot = `${h.lat.toFixed(3)},${h.lon.toFixed(3)}`
    const name = h.title.toLowerCase().replace(/\s*\(.*\)$/, '')
    if (seen.has(spot) || seen.has(name)) continue
    seen.add(spot)
    seen.add(name)
    out.push({
      key: `${h.lang}:${h.pageid}`,
      title: h.title,
      detail: h.lang === 'de' ? 'Wikipedia' : 'Wikipedia (englisch)',
      url: `https://${h.lang}.wikipedia.org/?curid=${h.pageid}`,
      lat: h.lat,
      lon: h.lon,
    })
  }
  return out
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Nur POST' }, 405)
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Ungültige Anfrage' }, 400)
  }
  const lat = Number(body.lat)
  const lon = Number(body.lon)
  const radiusKm = Math.min(50, Math.max(1, Number(body.radiusKm) || 10))
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return json({ error: 'Ort fehlt' }, 400)
  try {
    if (body.source === 'wikipedia') return json({ items: await loadWikipedia(coarse(lat), coarse(lon), radiusKm) })
    return json({ error: 'Unbekannte Quelle' }, 400)
  } catch (e) {
    console.error('nearby', body.source, e)
    return json({ error: (e as Error).message }, 502)
  }
})
