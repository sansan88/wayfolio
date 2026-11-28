import { describeLink } from './links'
import { distanceKm } from './geo'
import { supabase } from './supabase'

/**
 * «In der Nähe entdecken»: Tipps aus mehreren Quellen rund um einen Punkt.
 * Neue Quellen als weiteren Eintrag in NEARBY_SOURCES ergänzen (id, Name, Hinweis, load).
 */
export interface NearbyItem {
  /** stabiler Schlüssel innerhalb der Quelle */
  key: string
  title: string
  /** Zusatz, z. B. Dienst («Google Maps») oder Kategorie («Aussichtspunkt») */
  detail: string | null
  url: string
  distanceKm: number
  /** ionicons-Symbol (nur Reisenden-Tipps), sonst das Symbol der Quelle */
  icon?: string
  /** so oft von Reisenden verlinkt */
  mentions?: number
}

export interface NearbySource {
  id: 'travelers' | 'wikipedia' | 'osm'
  label: string
  /** Fussnote unter der Liste (Herkunft, Datenschutz, Lizenz) */
  note: string
  load: (at: { lat: number; lon: number }, radiusKm: number) => Promise<NearbyItem[]>
}

// ---------------------------------------------------------------------------
// Tipps anderer Reisender (Links aus Beiträgen, Ort gerundet, frühestens 24 h später)
// ---------------------------------------------------------------------------
const loadTravelers: NearbySource['load'] = async (at, radiusKm) => {
  const { data, error } = await supabase.rpc('nearby_tips', { p_lat: at.lat, p_lon: at.lon, p_radius_km: radiusKm })
  if (error) throw new Error(error.message)
  return ((data ?? []) as { url: string; title: string | null; distance_km: number; mentions: number }[]).map((t) => {
    const d = describeLink(t.url, t.title)
    return { key: t.url, title: d.label, detail: d.service, url: t.url, distanceKm: t.distance_km, icon: d.icon, mentions: t.mentions }
  })
}

// ---------------------------------------------------------------------------
// Wikipedia über die Edge Function «nearby»: Die Dienste sehen nur den Server
// (keine IP-Adresse der Reisenden) und einen auf ~1 km gerundeten Ort.
// ---------------------------------------------------------------------------
const viaServer =
  (source: 'wikipedia'): NearbySource['load'] =>
  async (at, radiusKm) => {
    const { data, error } = await supabase.functions.invoke('nearby', { body: { source, lat: at.lat, lon: at.lon, radiusKm } })
    if (error) {
      const ctx = (error as { context?: Response }).context
      const msg = ctx ? await ctx.json().then((j: { error?: string }) => j.error).catch(() => null) : null
      throw new Error(msg ?? 'Wikipedia ist gerade nicht erreichbar.')
    }
    const items = ((data as { items?: (Omit<NearbyItem, 'distanceKm'> & { lat: number; lon: number })[] }).items ?? []).map(
      ({ lat, lon, ...it }) => ({ ...it, distanceKm: distanceKm(at, { lat, lon }) }),
    )
    return items.filter((it) => it.distanceKm <= radiusKm + 1).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 60)
  }

// ---------------------------------------------------------------------------
// OpenStreetMap direkt aus dem Browser (Overpass): Overpass-api.de lehnt Anfragen aus Rechenzentren ab,
// darum nicht über unseren Server. Der Ort geht auf ~1 km gerundet hinaus.
// ---------------------------------------------------------------------------
const coarse = (n: number) => Math.round(n * 100) / 100

const OSM_KINDS: Record<string, Record<string, string>> = {
  tourism: {
    viewpoint: 'Aussichtspunkt',
    attraction: 'Sehenswürdigkeit',
    museum: 'Museum',
    camp_site: 'Campingplatz',
    picnic_site: 'Picknickplatz',
    zoo: 'Zoo',
    artwork: 'Kunstwerk',
    gallery: 'Galerie',
  },
  natural: { beach: 'Strand', waterfall: 'Wasserfall', peak: 'Gipfel', hot_spring: 'Heisse Quelle', cave_entrance: 'Höhle' },
  leisure: { nature_reserve: 'Naturschutzgebiet', park: 'Park', beach_resort: 'Strandbad' },
  historic: { monument: 'Denkmal', memorial: 'Gedenkstätte', castle: 'Burg', ruins: 'Ruine', archaeological_site: 'Ausgrabung' },
}
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter']

interface OsmElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

const osmUrl = (e: OsmElement) => {
  const t = e.tags ?? {}
  const site = t.website ?? t['contact:website']
  if (site && /^https?:\/\//i.test(site)) return site
  const w = t.wikipedia?.match(/^([a-z-]+):(.+)$/)
  if (w) return `https://${w[1]}.wikipedia.org/wiki/${encodeURIComponent(w[2].replace(/ /g, '_'))}`
  return `https://www.openstreetmap.org/${e.type}/${e.id}`
}

const loadOsm: NearbySource['load'] = async (at, radiusKm) => {
  const around = `around:${Math.min(25_000, Math.round(radiusKm * 1000))},${coarse(at.lat)},${coarse(at.lon)}`
  const filters = Object.entries(OSM_KINDS)
    .map(([key, values]) => `nwr(${around})[${key}~"^(${Object.keys(values).join('|')})$"][name];`)
    .join('')
  const body = `data=${encodeURIComponent(`[out:json][timeout:15];(${filters});out center 120;`)}`
  let data: { elements?: OsmElement[] } | null = null
  for (const url of OVERPASS) {
    try {
      const res = await fetch(url, { method: 'POST', body, signal: AbortSignal.timeout(20_000) })
      if (res.ok) {
        data = await res.json()
        break
      }
    } catch {
      /* nächster Server */
    }
  }
  if (!data) throw new Error('OpenStreetMap ist gerade ausgelastet. Bitte später nochmals versuchen.')
  const seen = new Set<string>()
  const out: NearbyItem[] = []
  for (const e of data.elements ?? []) {
    const pos = e.center ?? (e.lat !== undefined && e.lon !== undefined ? { lat: e.lat, lon: e.lon } : null)
    const name = e.tags?.['name:de'] ?? e.tags?.name
    if (!pos || !name) continue
    let detail: string | null = null
    for (const [key, values] of Object.entries(OSM_KINDS)) if (e.tags?.[key] && values[e.tags[key]]) detail = values[e.tags[key]]
    const k = `${name}|${detail}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push({ key: `${e.type}/${e.id}`, title: name, detail, url: osmUrl(e), distanceKm: distanceKm(at, pos) })
  }
  return out.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 60)
}

export const NEARBY_SOURCES: NearbySource[] = [
  {
    id: 'travelers',
    label: 'Reisende',
    note: 'Links aus Beiträgen anderer Reisender – ohne Namen, Texte oder Fotos. Der Ort ist auf etwa 1 km gerundet und erscheint frühestens 24 Stunden nach dem Beitrag.',
    load: loadTravelers,
  },
  {
    id: 'wikipedia',
    label: 'Wikipedia',
    note: 'Artikel mit Ortsangabe aus Wikipedia (höchstens 10 km Umkreis). Abgefragt über unseren Server mit auf etwa 1 km gerundetem Ort.',
    load: viaServer('wikipedia'),
  },
  {
    id: 'osm',
    label: 'Orte',
    note: 'Aussichtspunkte, Strände, Wasserfälle, Campingplätze und mehr aus OpenStreetMap (höchstens 25 km Umkreis). Daten © OpenStreetMap-Mitwirkende, ODbL. Dein Gerät fragt die Overpass-API direkt ab, mit auf etwa 1 km gerundetem Ort.',
    load: loadOsm,
  },
]

export const formatKm = (km: number) =>
  km < 1 ? `${Math.max(100, Math.round((km * 1000) / 100) * 100)} m` : `${km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)} km`
