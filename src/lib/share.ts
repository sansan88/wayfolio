import type { FeedPost } from './updates'
import { getOrCreatePostLink, getOrCreateShareLink } from './updates'

/**
 * Text für WhatsApp & Co.: Einleitung, Ort bzw. Titel, Anfang des Textes und der Link direkt zum Beitrag.
 * Check-ins beginnen mit «Wir sind heute hier.», Beiträge mit «Wir haben ein Update für euch».
 */
const shareText = (post: FeedPost, url: string) => {
  const isCheckin = post.kind === 'route_update'
  const place = post.place_name?.split(',').map((x) => x.trim())
  const intro = isCheckin ? 'Wir sind heute hier.' : 'Wir haben ein Update für euch'
  const headline = isCheckin
    ? `📍 ${place?.join(', ') ?? post.title ?? ''}`.trim()
    : [post.title ? `✍️ ${post.title}` : '', place?.[0] ? `📍 ${place[0]}` : ''].filter(Boolean).join('\n')
  const body = post.blocks.find((b) => b.kind === 'text' && b.text)?.text?.trim()
  const teaser = body ? (body.length > 180 ? `${body.slice(0, 177).trimEnd()} …` : body) : ''
  return [intro, headline, teaser, url].filter(Boolean).join('\n\n')
}

/** Erstes Foto als Datei (WhatsApp zeigt es dann mit dem Text als Bildunterschrift). */
const firstPhoto = async (post: FeedPost): Promise<File | null> => {
  const b = post.blocks.find((x) => x.kind === 'photo' && x.mediaUrl && !x.route) ?? post.blocks.find((x) => x.kind === 'photo' && x.mediaUrl)
  if (!b?.mediaUrl) return null
  try {
    const res = await fetch(b.mediaUrl)
    if (!res.ok) return null
    return new File([await res.blob()], 'littlefootnotes.jpg', { type: 'image/jpeg' })
  } catch {
    return null
  }
}

/**
 * Beitrag über das Teilen-Menü des Geräts (Web Share API) teilen – z.B. in die WhatsApp-Community.
 * Ergebnis: 'shared' | 'copied' (kein Teilen-Menü: Text in die Zwischenablage) | 'cancelled'
 */
export const sharePost = async (
  post: FeedPost,
  tripId: string,
  scope: 'post' | 'trip' = 'trip',
  withPhoto = true,
): Promise<'shared' | 'copied' | 'cancelled'> => {
  // «post»: eigener Secret Link nur für diesen Beitrag; «trip»: Reise-Link, springt zum Beitrag
  const url = scope === 'post' ? await getOrCreatePostLink(post, tripId) : `${await getOrCreateShareLink(tripId)}#p-${post.id}`
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
      if (withPhoto) return sharePost(post, tripId, scope, false)
    }
  }
  await navigator.clipboard?.writeText(text)
  return 'copied'
}
