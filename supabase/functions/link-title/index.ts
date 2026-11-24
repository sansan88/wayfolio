// Little Footnotes – Titel von Web-Seiten für Links in Beiträgen
// Nur für angemeldete Reisende (JWT-Prüfung aktiv). Liest <title> bzw. og:title
// öffentlicher Seiten; private Adressen und IPs werden nicht abgefragt.
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const MAX_BYTES = 300_000
const TIMEOUT_MS = 5000

const isPublicHost = (host: string) => {
  const h = host.toLowerCase()
  if (!h.includes('.') || h.endsWith('.local') || h.endsWith('.internal') || h === 'localhost') return false
  // keine IP-Adressen (v4/v6)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h) || h.includes(':') || h.startsWith('[')) return false
  return true
}

const decode = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')

/** Ortsname aus einer aufgelösten Google-Maps-Adresse (…/maps/place/Te+Papa/…) */
const mapsPlace = (u: URL) => {
  const m = u.pathname.match(/\/maps\/place\/([^/@]+)/)
  if (m) return decodeURIComponent(m[1].replace(/\+/g, ' ')).trim() || null
  const q = u.searchParams.get('q') ?? u.searchParams.get('query')
  return q && !/^-?\d+(\.\d+)?,\s*-?\d+/.test(q) ? q.trim() : null
}

const isMapsHost = (u: URL) => /(^|\.)google\.[a-z.]+$/.test(u.hostname) && u.pathname.startsWith('/maps')

/** Seitentitel aufräumen: Zusätze wie « - Google Maps», «• Instagram …», «- Airbnb» entfernen. */
const tidy = (t: string) =>
  t
    .replace(/\s*[-–|·•]\s*(Google Maps|Airbnb|Booking\.com|Tripadvisor)\s*$/i, '')
    .replace(/\s*•\s*Instagram.*$/i, '')
    .trim()

const titleOf = async (raw: string): Promise<string | null> => {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (!['http:', 'https:'].includes(url.protocol) || !isPublicHost(url.hostname)) return null
  // Google-Maps-Kurzlinks: Weiterleitungen einzeln verfolgen und den Ortsnamen aus der Zieladresse lesen
  if (/^(maps\.app\.goo\.gl|goo\.gl)$/.test(url.hostname) || isMapsHost(url)) {
    let hop: URL = url
    for (let i = 0; i < 5; i++) {
      if (isMapsHost(hop)) {
        const place = mapsPlace(hop)
        if (place) return place.slice(0, 120)
      }
      // Einwilligungsseite in Europa: Ziel steht im Parameter «continue»
      const cont = hop.hostname.startsWith('consent.') ? hop.searchParams.get('continue') : null
      if (cont) {
        try {
          hop = new URL(cont)
          continue
        } catch {
          break
        }
      }
      try {
        const r = await fetch(hop, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) })
        const loc = r.headers.get('location')
        void r.body?.cancel().catch(() => undefined)
        if (!loc) break
        hop = new URL(loc, hop)
        if (!isPublicHost(hop.hostname)) return null
      } catch {
        break
      }
    }
  }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LittleFootnotes/1.0; +https://littlefootnotes.app)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'de-CH,de;q=0.9,en;q=0.8',
      },
    })
    if (!res.ok || !res.body) return null
    const finalUrl = new URL(res.url)
    if (!isPublicHost(finalUrl.hostname)) return null
    // Google-Maps-Kurzlink: der Ortsname steht in der aufgelösten Adresse
    if (isMapsHost(finalUrl)) {
      const place = mapsPlace(finalUrl)
      if (place) {
        void res.body.cancel().catch(() => undefined)
        return place.slice(0, 120)
      }
    }
    if (!(res.headers.get('content-type') ?? '').includes('html')) return null
    // nur den Anfang lesen
    const reader = res.body.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read()
      if (done || !value) break
      chunks.push(value)
      size += value.length
      const head = new TextDecoder().decode(value)
      if (head.includes('</head>')) break
    }
    void reader.cancel().catch(() => undefined)
    const all = new Uint8Array(size)
    let offset = 0
    for (const c of chunks) {
      all.set(c, offset)
      offset += c.length
    }
    const html = new TextDecoder().decode(all)
    const og =
      html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:title["']/i)?.[1]
    const title = og ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    if (!title) return null
    const clean = tidy(decode(title).replace(/\s+/g, ' ').trim())
    if (/^(Google Maps|Airbnb|Instagram|Login.*|Anmelden.*)$/i.test(clean)) return null
    return clean ? clean.slice(0, 120) : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Nur POST' }, 405)
  let body: { urls?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Ungültige Anfrage' }, 400)
  }
  const urls = (Array.isArray(body.urls) ? body.urls : []).filter((u): u is string => typeof u === 'string').slice(0, 8)
  const titles = await Promise.all(urls.map(titleOf))
  return json({ titles })
})
