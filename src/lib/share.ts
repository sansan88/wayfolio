import type { FeedPost } from './updates'
import { getOrCreateShareLink } from './updates'

/** Text für WhatsApp & Co.: Titel, Ort, Anfang des Textes und der Link direkt zum Beitrag. */
const shareText = (post: FeedPost, url: string) => {
  const place = post.place_name?.split(',')[0]
  const title = post.kind === 'route_update' ? `📍 ${place ?? post.title ?? 'Neuer Ort'}` : `✍️ ${post.title ?? 'Neuer Beitrag'}`
  const body = post.blocks.find((b) => b.kind === 'text' && b.text)?.text?.trim()
  const teaser = body ? (body.length > 180 ? `${body.slice(0, 177).trimEnd()} …` : body) : ''
  return [title, post.kind !== 'route_update' && place ? `📍 ${place}` : '', teaser, url].filter(Boolean).join('\n\n')
}

/** Erstes Foto als Datei (WhatsApp zeigt es dann mit dem Text als Bildunterschrift). */
const firstPhoto = async (post: FeedPost): Promise<File | null> => {
  const b = post.blocks.find((x) => x.kind === 'photo' && x.mediaUrl && !x.route) ?? post.blocks.find((x) => x.kind === 'photo' && x.mediaUrl)
  if (!b?.mediaUrl) return null
  try {
    const res = await fetch(b.mediaUrl)
    if (!res.ok) return null
    return new File([await res.blob()], 'wayfolio.jpg', { type: 'image/jpeg' })
  } catch {
    return null
  }
}

/**
 * Beitrag über das Teilen-Menü des Geräts (Web Share API) teilen – z.B. in die WhatsApp-Community.
 * Ergebnis: 'shared' | 'copied' (kein Teilen-Menü: Text in die Zwischenablage) | 'cancelled'
 */
export const sharePost = async (post: FeedPost, tripId: string, withPhoto = true): Promise<'shared' | 'copied' | 'cancelled'> => {
  const url = `${await getOrCreateShareLink(tripId)}#p-${post.id}`
  const text = shareText(post, url)
  if (navigator.share) {
    try {
      const photo = withPhoto ? await firstPhoto(post) : null
      if (photo && navigator.canShare?.({ files: [photo] })) await navigator.share({ files: [photo], text })
      else await navigator.share({ text })
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled'
      // z.B. Dateien nicht erlaubt: ohne Foto nochmals
      if (withPhoto) return sharePost(post, tripId, false)
    }
  }
  await navigator.clipboard?.writeText(text)
  return 'copied'
}
