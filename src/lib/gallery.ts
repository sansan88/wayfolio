import { appUrl } from './auth'
import { loadRoute } from './route'
import { supabase } from './supabase'
import { uploadMedia, type MediaKind } from './updates'
import { cachedLoad } from './offline'

export interface GalleryItem {
  id: string
  kind: 'photo' | 'video'
  url: string
  /** nur für Reisende */
  download_url?: string
  taken_at: string
  /** kleines Vorschaubild fürs Raster */
  thumb_url?: string
  thumb_path?: string
  /** Ort aus den Foto-Metadaten */
  place?: string | null
  storage_path?: string
}

export interface GalleryDay {
  day: string // YYYY-MM-DD
  places: string[]
  items: GalleryItem[]
}

/** Gruppiert Medien nach Kalendertag (lokale Zeit) und hängt die Orte dieses Tages an. */
export const groupByDay = (items: GalleryItem[], points: { place_name: string | null; recorded_at: string }[]): GalleryDay[] => {
  const key = (iso: string) => new Date(iso).toLocaleDateString('sv-SE') // YYYY-MM-DD
  const days = new Map<string, GalleryItem[]>()
  items.forEach((i) => days.set(key(i.taken_at), [...(days.get(key(i.taken_at)) ?? []), i]))
  return [...days.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([day, list]) => ({
      day,
      items: list,
      // Orte des Tages: zuerst aus den Fotos (EXIF), dann aus den Standorten der Route
      places: [
        ...new Set(
          [
            ...list.map((i) => i.place),
            ...points.filter((p) => key(p.recorded_at) === day).map((p) => p.place_name),
          ]
            .filter((n): n is string => !!n)
            .map((n) => n.split(',')[0].trim()),
        ),
      ],
    }))
}

/** Alle Fotos und Videos einer Reise für Reisende. */
export const loadGallery = (tripId: string): Promise<GalleryDay[]> => cachedLoad(`gallery:${tripId}`, () => fetchGallery(tripId))

const fetchGallery = async (tripId: string): Promise<GalleryDay[]> => {
  const { data, error } = await supabase
    .from('media')
    .select('id, kind, storage_path, taken_at, taken_place, created_at, variants')
    .eq('trip_id', tripId)
    .in('kind', ['photo', 'video'])
    .order('taken_at', { ascending: false })
  if (error) throw new Error(error.message)
  // automatisch erzeugte Routenbilder gehören nicht in die Fotogalerie
  const rows = (data ?? []).filter((r) => !(r.variants as { route?: boolean } | null)?.route)
  const paths = rows.map((r) => r.storage_path)
  const thumbOf = (r: { variants: unknown }) => (r.variants as { thumb?: string } | null)?.thumb
  const thumbs = rows.map(thumbOf).filter(Boolean) as string[]
  const [view, download, route, thumbView] = await Promise.all([
    paths.length ? supabase.storage.from('media').createSignedUrls(paths, 3600) : Promise.resolve({ data: [] }),
    paths.length ? supabase.storage.from('media').createSignedUrls(paths, 3600, { download: true }) : Promise.resolve({ data: [] }),
    loadRoute(tripId).catch(() => []),
    thumbs.length ? supabase.storage.from('media').createSignedUrls(thumbs, 3600) : Promise.resolve({ data: [] }),
  ])
  const urlOf = (list: { path: string | null; signedUrl: string | null }[] | null, p: string) => list?.find((s) => s.path === p)?.signedUrl ?? ''
  const items: GalleryItem[] = rows
    .map((r) => ({
      id: r.id,
      kind: r.kind as GalleryItem['kind'],
      storage_path: r.storage_path,
      url: urlOf(view.data, r.storage_path),
      download_url: urlOf(download.data, r.storage_path),
      thumb_path: thumbOf(r),
      thumb_url: thumbOf(r) ? urlOf(thumbView.data, thumbOf(r)!) : undefined,
      taken_at: r.taken_at ?? r.created_at,
      place: r.taken_place,
    }))
    .filter((i) => i.url)
  return groupByDay(items, route)
}

/** Fotos/Videos nur in die Galerie laden (ohne Beitrag). */
export const uploadToGallery = async (tripId: string, userId: string, files: File[]) => {
  for (const file of files) {
    const kind: MediaKind = file.type.startsWith('video') ? 'video' : 'photo'
    await uploadMedia({ tripId, userId, position: null, place: null }, file, kind)
  }
}

/** Datei aus Speicher und Galerie entfernen (Bausteine in Beiträgen verlieren das Bild). */
export const deleteMedia = async (item: GalleryItem) => {
  if (item.storage_path) {
    const { error } = await supabase.storage.from('media').remove([item.storage_path, ...(item.thumb_path ? [item.thumb_path] : [])])
    if (error) throw new Error(error.message)
  }
  const { error } = await supabase.from('media').delete().eq('id', item.id)
  if (error) throw new Error(error.message)
}

export const galleryUrl = (token: string) => `${appUrl()}g/${token}`

/** Galerie-Link der Reise (getrennt vom Follower-Link), beim ersten Mal anlegen. */
export const getOrCreateGalleryLink = async (tripId: string): Promise<string> => {
  const { data: existing } = await supabase
    .from('share_links')
    .select('token')
    .eq('trip_id', tripId)
    .eq('role', 'gallery')
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (existing) return galleryUrl(existing.token)
  const { data, error } = await supabase.from('share_links').insert({ trip_id: tripId, role: 'gallery' }).select('token').single()
  if (error) throw new Error(error.message)
  return galleryUrl(data.token)
}

export const rotateGalleryLink = async (tripId: string): Promise<string> => {
  await supabase
    .from('share_links')
    .update({ revoked_at: new Date().toISOString() })
    .eq('trip_id', tripId)
    .eq('role', 'gallery')
    .is('revoked_at', null)
  return getOrCreateGalleryLink(tripId)
}

/** Token aus /wayfolio/g/<token> */
export const galleryTokenFromPath = (pathname: string) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const m = pathname.slice(base.length).match(/^\/g\/([a-f0-9]{32,})\/?$/)
  return m?.[1] ?? null
}

export const formatDay = (day: string) =>
  new Date(`${day}T12:00:00`).toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
