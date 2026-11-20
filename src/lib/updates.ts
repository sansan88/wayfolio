import { toWkt, type Place, type Position } from './location'
import { supabase } from './supabase'

const STORY_HOURS = 24
const MAX_IMAGE_EDGE = 2048

/**
 * Verkleinert ein Foto im Browser auf max. 2048 px und speichert es als JPEG.
 * Das Neu-Kodieren entfernt dabei auch die EXIF-Daten (inkl. GPS) – gewollt aus Datenschutzgründen.
 */
export const resizeImage = async (file: File): Promise<Blob> => {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Bild konnte nicht verarbeitet werden.'))), 'image/jpeg', 0.85),
  )
}

const fail = (message: string): never => {
  throw new Error(message)
}

const insertCheckin = async (tripId: string, userId: string, position: Position, place: Place) => {
  const { data, error } = await supabase
    .from('checkins')
    .insert({
      trip_id: tripId,
      author_id: userId,
      location: toWkt(position),
      place_name: place.name,
      country_code: place.countryCode,
    })
    .select('id')
    .single()
  if (error) fail(`Standort konnte nicht gespeichert werden: ${error.message}`)
  return data!.id as string
}

/** Kachel «Standort»: Check-in + Route-Update im Feed (Routenbild folgt per Edge Function). */
export const createLocationUpdate = async (tripId: string, userId: string, position: Position, place: Place) => {
  const checkinId = await insertCheckin(tripId, userId, position, place)
  const { error } = await supabase.from('posts').insert({
    trip_id: tripId,
    author_id: userId,
    kind: 'route_update',
    title: place.name,
    checkin_id: checkinId,
    published_at: new Date().toISOString(),
  })
  if (error) fail(`Route-Update konnte nicht veröffentlicht werden: ${error.message}`)
}

/** Kachel «Foto»: Bild hochladen, Check-in, Story mit Foto-Baustein. */
export const createPhotoStory = async (
  tripId: string,
  userId: string,
  file: File,
  position: Position | null,
  place: Place | null,
) => {
  const image = await resizeImage(file)
  const path = `${tripId}/${crypto.randomUUID()}.jpg`
  const upload = await supabase.storage.from('media').upload(path, image, { contentType: 'image/jpeg' })
  if (upload.error) fail(`Upload fehlgeschlagen: ${upload.error.message}`)

  const { data: media, error: mediaError } = await supabase
    .from('media')
    .insert({ trip_id: tripId, uploaded_by: userId, kind: 'photo', storage_path: path, taken_at: new Date().toISOString() })
    .select('id')
    .single()
  if (mediaError) fail(`Foto konnte nicht gespeichert werden: ${mediaError.message}`)

  const checkinId = position && place ? await insertCheckin(tripId, userId, position, place) : null
  const now = new Date()
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      trip_id: tripId,
      author_id: userId,
      kind: 'story',
      title: place?.name ?? null,
      checkin_id: checkinId,
      published_at: now.toISOString(),
      story_expires_at: new Date(now.getTime() + STORY_HOURS * 3600 * 1000).toISOString(),
    })
    .select('id')
    .single()
  if (postError) fail(`Story konnte nicht veröffentlicht werden: ${postError.message}`)

  const { error: blockError } = await supabase
    .from('post_blocks')
    .insert({ post_id: post!.id, position: 0, kind: 'photo', media_id: media!.id })
  if (blockError) fail(`Foto konnte nicht an die Story gehängt werden: ${blockError.message}`)
}

export interface FeedPost {
  id: string
  kind: 'story' | 'feed' | 'background' | 'route_update' | 'poll'
  title: string | null
  published_at: string
  story_expires_at: string | null
  checkin: { place_name: string | null; recorded_at: string } | null
  blocks: { position: number; kind: string; text_content: string | null; imageUrl: string | null }[]
}

interface RawPost {
  id: string
  kind: FeedPost['kind']
  title: string | null
  published_at: string
  story_expires_at: string | null
  checkin: FeedPost['checkin']
  post_blocks: { position: number; kind: string; text_content: string | null; media: { storage_path: string } | null }[]
}

/** Lädt die veröffentlichten Updates einer Reise inkl. signierter Bild-URLs (privater Bucket). */
export const loadUpdates = async (tripId: string): Promise<FeedPost[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, kind, title, published_at, story_expires_at, checkin:checkins(place_name, recorded_at), post_blocks!post_blocks_post_id_fkey(position, kind, text_content, media(storage_path))',
    )
    .eq('trip_id', tripId)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(100)
    .returns<RawPost[]>()
  if (error) fail(error.message)

  const paths = (data ?? []).flatMap((p) => p.post_blocks.map((b) => b.media?.storage_path).filter(Boolean) as string[])
  const urls = new Map<string, string>()
  if (paths.length) {
    const { data: signed } = await supabase.storage.from('media').createSignedUrls(paths, 3600)
    signed?.forEach((s) => s.path && s.signedUrl && urls.set(s.path, s.signedUrl))
  }

  return (data ?? []).map((p) => ({
    id: p.id,
    kind: p.kind,
    title: p.title,
    published_at: p.published_at,
    story_expires_at: p.story_expires_at,
    checkin: p.checkin,
    blocks: [...p.post_blocks]
      .sort((a, b) => a.position - b.position)
      .map((b) => ({
        position: b.position,
        kind: b.kind,
        text_content: b.text_content,
        imageUrl: b.media ? (urls.get(b.media.storage_path) ?? null) : null,
      })),
  }))
}
