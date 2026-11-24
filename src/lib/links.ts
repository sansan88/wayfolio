import { bedOutline, globeOutline, logoInstagram, logoYoutube, mapOutline, restaurantOutline, ticketOutline } from 'ionicons/icons'

/** Ergänzt «https://», entfernt Leerzeichen; null, wenn es keine gültige Web-Adresse ist. */
export const normalizeUrl = (raw: string): string | null => {
  const s = raw.trim()
  if (!s) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : `https://${s}`
  try {
    const u = new URL(withScheme)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    if (!u.hostname.includes('.')) return null
    return u.toString()
  } catch {
    return null
  }
}

/** Leere Felder weglassen, Adressen vereinheitlichen, Doppelte entfernen. */
export const cleanLinks = (links: string[]) => [...new Set(links.map(normalizeUrl).filter((u): u is string => !!u))]

const KNOWN: { test: (host: string, path: string) => boolean; label: string; icon: string }[] = [
  {
    test: (h, p) => /(^|\.)maps\.google\./.test(h) || (/(^|\.)google\.[a-z.]+$/.test(h) && p.startsWith('/maps')) || h === 'maps.app.goo.gl' || (h === 'goo.gl' && p.startsWith('/maps')),
    label: 'Google Maps',
    icon: mapOutline,
  },
  { test: (h) => /(^|\.)maps\.apple\.com$/.test(h), label: 'Apple Karten', icon: mapOutline },
  { test: (h) => /(^|\.)airbnb\.[a-z.]+$/.test(h), label: 'Airbnb', icon: bedOutline },
  { test: (h) => /(^|\.)booking\.com$/.test(h), label: 'Booking.com', icon: bedOutline },
  { test: (h) => /(^|\.)(hostelworld|hotels|expedia|agoda)\.[a-z.]+$/.test(h), label: '', icon: bedOutline },
  { test: (h) => /(^|\.)tripadvisor\.[a-z.]+$/.test(h), label: 'Tripadvisor', icon: restaurantOutline },
  { test: (h) => /(^|\.)(getyourguide|viator)\.[a-z.]+$/.test(h), label: '', icon: ticketOutline },
  { test: (h) => /(^|\.)instagram\.com$/.test(h), label: 'Instagram', icon: logoInstagram },
  { test: (h) => /(^|\.)(youtube\.com|youtu\.be)$/.test(h), label: 'YouTube', icon: logoYoutube },
  { test: (h) => /(^|\.)wikipedia\.org$/.test(h), label: 'Wikipedia', icon: globeOutline },
]

/** Ortsname aus einem Google-Maps-Link (…/maps/place/Te+Papa/…), sonst null */
const mapsPlace = (u: URL) => {
  const m = u.pathname.match(/\/maps\/place\/([^/@]+)/)
  if (m) return decodeURIComponent(m[1].replace(/\+/g, ' ')).trim() || null
  const q = u.searchParams.get('q') ?? u.searchParams.get('query')
  return q && !/^-?\d+(\.\d+)?,\s*-?\d+/.test(q) ? q.trim() : null
}

/** «The Gables Osteria & Enoteca 19 The Strand, Russell 0202, Neuseeland» → «The Gables Osteria & Enoteca» */
const placeName = (s: string) => {
  const first = s.split(',')[0].trim()
  const beforeNumber = first.split(/\s\d+[a-z]?\s/i)[0].trim()
  return beforeNumber.length >= 3 ? beforeNumber : first
}

/** «Apartment · Kerikeri · ★Neu · 1 Schlafzimmer …» → «Apartment · Kerikeri» */
const shortListing = (s: string) =>
  s
    .split('·')
    .map((x) => x.trim())
    .filter((x) => x && !x.startsWith('★'))
    .slice(0, 2)
    .join(' · ')

/** Instagram-Profil (instagram.com/<name>) → «@name», sonst null */
const instagramHandle = (u: URL) => {
  const first = u.pathname.split('/').filter(Boolean)[0]
  if (!first || ['p', 'reel', 'reels', 'stories', 'explore', 'tv', 'accounts'].includes(first)) return null
  return /^[a-z0-9._]{1,30}$/i.test(first) ? `@${first}` : null
}

/**
 * Anzeige eines Links – nie die ganze Adresse. `label`: Ort, Titel oder @Profil, damit mehrere Links
 * desselben Dienstes unterscheidbar sind; `service`: Name des Dienstes als zweite Zeile (falls bekannt).
 */
export const describeLink = (url: string, title?: string | null) => {
  const t = title?.trim() || null
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    const known = KNOWN.find((k) => k.test(host, u.pathname))
    const icon = known?.icon ?? globeOutline
    const service = known?.label || null
    switch (service) {
      case 'Google Maps': {
        const name = t ?? mapsPlace(u)
        return { label: name ? placeName(name) : 'Google Maps', service: name ? service : null, icon }
      }
      case 'Airbnb':
      case 'Booking.com':
        return { label: t ? shortListing(t) || service : service, service: t ? service : null, icon }
      case 'Instagram': {
        const handle = instagramHandle(u)
        return { label: handle ?? t ?? 'Instagram-Beitrag', service, icon }
      }
      default:
        if (service) return { label: t ?? service, service: t ? service : null, icon }
        return { label: t ?? host, service: t ? host : null, icon }
    }
  } catch {
    return { label: t ?? 'Link', service: null, icon: globeOutline }
  }
}
