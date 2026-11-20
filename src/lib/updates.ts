import { appUrl } from './auth'
import { toWkt, type Place, type Position } from './location'
import { supabase } from './supabase'

const STORY_HOURS = 24
const MAX_IMAGE_EDGE = 2048
export const MAX_VIDEO_MB = 100

export type PostKind = 'story' | 'feed' | 'background' | 'route_update' | 'poll'
export type MediaKind = 'photo' | 'video' | 'audio'

export interface Context {
  tripId: string
  userId: string
  position: Position | null
  place: Place | null
}

const fail = (message: string): never => {
  throw new Error(message)
}

const storyExpiry = () => new Date(Date.now() + STORY_HOURS * 3600 * 1000).toISOString()

/**
 * Verkleinert ein Foto im Browser auf max. 2048 px und speichert es als JPEG.
 * Das Neu-Kodieren entfernt dabei auch die EXIF-Daten (inkl. GPS) – gewollt aus Datenschutzgründen.
 */
export const resizeImage = async (file: Blob): Promise<Blob> => {
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

const extensionFor = (type: string, fallback: string) => {
  const sub = type.split('/')[1]?.split(';')[0]
  return sub ? sub.replace('quicktime', 'mov').replace('x-m4a', 'm4a') : fallback
}

/** Lädt eine Datei in den privaten Bucket «media» und legt den Medien-Eintrag an. */
export const uploadMedia = async (ctx: Context, data: Blob, kind: MediaKind): Promise<string> => {
  const blob = kind === 'photo' ? await resizeImage(data) : data
  const contentType = kind === 'photo' ? 'image/jpeg' : blob.type || (kind === 'audio' ? 'audio/webm' : 'video/mp4')
  const ext = kind === 'photo' ? 'jpg' : extensionFor(contentType, kind === 'audio' ? 'webm' : 'mp4')
  const path = `${ctx.tripId}/${crypto.randomUUID()}.${ext}`
  const upload = await supabase.storage.from('media').upload(path, blob, { contentType })
  if (upload.error) fail(`Upload fehlgeschlagen: ${upload.error.message}`)
  const { data: media, error } = await supabase
    .from('media')
    .insert({ trip_id: ctx.tripId, uploaded_by: ctx.userId, kind, storage_path: path, taken_at: new Date().toISOString() })
    .select('id')
    .single()
  if (error) fail(`Datei konnte nicht gespeichert werden: ${error.message}`)
  return media!.id as string
}

const insertCheckin = async (ctx: Context): Promise<string | null> => {
  if (!ctx.position) return null
  const { data, error } = await supabase
    .from('checkins')
    .insert({
      trip_id: ctx.tripId,
      author_id: ctx.userId,
      location: toWkt(ctx.position),
      place_name: ctx.place?.name ?? null,
      country_code: ctx.place?.countryCode ?? null,
    })
    .select('id')
    .single()
  if (error) fail(`Standort konnte nicht gespeichert werden: ${error.message}`)
  return data!.id as string
}

export interface NewBlock {
  kind: 'text' | 'photo' | 'video' | 'audio' | 'link'
  text?: string
  mediaId?: string
  url?: string
}

interface NewPost {
  kind: PostKind
  title?: string | null
  blocks?: NewBlock[]
  /** auch 24 Stunden in den Stories zeigen */
  inStories?: boolean
  checkinId?: string | null
  withCheckin?: boolean
}

/** Legt einen veröffentlichten Beitrag samt Bausteinen an. */
const publish = async (ctx: Context, post: NewPost): Promise<string> => {
  const checkinId = post.checkinId !== undefined ? post.checkinId : post.withCheckin === false ? null : await insertCheckin(ctx)
  const { data, error } = await supabase
    .from('posts')
    .insert({
      trip_id: ctx.tripId,
      author_id: ctx.userId,
      kind: post.kind,
      title: post.title ?? ctx.place?.name ?? null,
      checkin_id: checkinId,
      published_at: new Date().toISOString(),
      story_expires_at: post.inStories ? storyExpiry() : null,
    })
    .select('id')
    .single()
  if (error) fail(`Veröffentlichen fehlgeschlagen: ${error.message}`)
  const postId = data!.id as string
  const blocks = post.blocks ?? []
  if (blocks.length) {
    const { error: blockError } = await supabase.from('post_blocks').insert(
      blocks.map((b, i) => ({
        post_id: postId,
        position: i,
        kind: b.kind,
        text_content: b.text ?? null,
        media_id: b.mediaId ?? null,
        url: b.url ?? null,
      })),
    )
    if (blockError) fail(`Inhalte konnten nicht gespeichert werden: ${blockError.message}`)
  }
  return postId
}

const mediaBlocks = async (ctx: Context, files: File[]): Promise<NewBlock[]> => {
  const blocks: NewBlock[] = []
  for (const file of files) {
    const kind: MediaKind = file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'photo'
    blocks.push({ kind, mediaId: await uploadMedia(ctx, file, kind) })
  }
  return blocks
}

// ---------------------------------------------------------------------------
// Kacheln
// ---------------------------------------------------------------------------

/** Kachel «Foto» (und Einzel-Updates allgemein): einzelnes Element → Story. */
export const createMediaStory = async (ctx: Context, data: Blob, kind: MediaKind) => {
  const mediaId = await uploadMedia(ctx, data, kind)
  await publish(ctx, { kind: 'story', blocks: [{ kind, mediaId }], inStories: true })
}

/** Kachel «Standort»: Check-in, automatisches Routenbild, Route-Update im Feed. */
export const createLocationUpdate = async (ctx: Context) => {
  if (!ctx.position) fail('Ohne Standort kein Check-in.')
  const checkinId = await insertCheckin(ctx)
  const blocks: NewBlock[] = []
  try {
    const { loadRoute, renderRouteImage, distanceKm } = await import('./map')
    const route = await loadRoute(ctx.tripId)
    const prev = route.at(-2)
    const leg = prev ? Math.round(distanceKm(prev, route.at(-1)!)) : 0
    const total = Math.round(route.slice(1).reduce((sum, p, i) => sum + distanceKm(route[i], p), 0))
    const day = route.length ? Math.floor((Date.now() - Date.parse(route[0].recorded_at)) / 86400000) + 1 : 1
    const name = ctx.place?.name.split(',')[0] ?? 'Neuer Ort'
    const caption = prev?.place_name
      ? `Tag ${day} · ${prev.place_name.split(',')[0]} → ${name}`
      : `Tag ${day} · ${name}`
    const image = await renderRouteImage(route, caption)
    const mediaId = await uploadMedia(ctx, image, 'photo')
    blocks.push({ kind: 'photo', mediaId })
    if (prev) blocks.push({ kind: 'text', text: `${leg} km seit ${prev.place_name?.split(',')[0] ?? 'dem letzten Ort'} · ${total} km gesamt` })
    if (checkinId && leg) await supabase.from('checkins').update({ leg_distance_m: leg * 1000 }).eq('id', checkinId)
  } catch (e) {
    console.warn('Routenbild konnte nicht erzeugt werden', e)
  }
  await publish(ctx, { kind: 'route_update', checkinId, blocks })
}

/** Kachel «Beitrag schreiben»: Text mit Medien und Link → Feed. */
export const createFeedPost = async (ctx: Context, title: string, text: string, files: File[], link?: string) => {
  const blocks: NewBlock[] = []
  if (text.trim()) blocks.push({ kind: 'text', text: text.trim() })
  blocks.push(...(await mediaBlocks(ctx, files)))
  if (link?.trim()) blocks.push({ kind: 'link', url: link.trim() })
  await publish(ctx, { kind: 'feed', title: title.trim() || null, blocks })
}

/** Kachel «Hintergrund»: vertiefender Beitrag → Feed + Story. */
export const createBackground = async (ctx: Context, title: string, text: string, files: File[]) => {
  const blocks: NewBlock[] = [{ kind: 'text', text: text.trim() }, ...(await mediaBlocks(ctx, files))]
  await publish(ctx, { kind: 'background', title: title.trim(), blocks, inStories: true })
}

/** Kachel «Entscheidung»: Abstimmung → Feed + Story. */
export const createPoll = async (
  ctx: Context,
  question: string,
  description: string,
  options: string[],
  closesInHours: number | null,
) => {
  const postId = await publish(ctx, { kind: 'poll', title: question.trim(), inStories: true })
  const { data: poll, error } = await supabase
    .from('polls')
    .insert({
      post_id: postId,
      question: question.trim(),
      description: description.trim() || null,
      closes_at: closesInHours ? new Date(Date.now() + closesInHours * 3600 * 1000).toISOString() : null,
    })
    .select('id')
    .single()
  if (error) fail(`Abstimmung konnte nicht angelegt werden: ${error.message}`)
  const { error: optError } = await supabase
    .from('poll_options')
    .insert(options.map((label, i) => ({ poll_id: poll!.id, position: i, label: label.trim() })))
  if (optError) fail(`Optionen konnten nicht gespeichert werden: ${optError.message}`)
}

/** «Unsere Entscheidung» bekanntgeben. */
export const resolvePoll = async (pollId: string, optionId: string, text: string) => {
  const { error } = await supabase
    .from('polls')
    .update({
      status: 'resolved',
      chosen_option_id: optionId,
      decision_text: text.trim() || null,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', pollId)
  if (error) fail(error.message)
}

export const addOwnerReply = async (postId: string, userId: string, body: string) => {
  const { error } = await supabase.from('replies').insert({ post_id: postId, author_profile_id: userId, body: body.trim() })
  if (error) fail(error.message)
}

export const hideReply = async (replyId: string) => {
  const { error } = await supabase.from('replies').update({ hidden_at: new Date().toISOString() }).eq('id', replyId)
  if (error) fail(error.message)
}

/** Titel und Text eines Beitrags ändern (erster Text-Baustein; fehlt er, wird er angehängt). */
export const updatePost = async (post: FeedPost, title: string, text: string) => {
  const { error } = await supabase.from('posts').update({ title: title.trim() || null }).eq('id', post.id)
  if (error) fail(error.message)
  const textBlock = post.blocks.find((b) => b.kind === 'text' && b.id)
  if (textBlock) {
    const res = text.trim()
      ? await supabase.from('post_blocks').update({ text_content: text.trim() }).eq('id', textBlock.id!)
      : await supabase.from('post_blocks').delete().eq('id', textBlock.id!)
    if (res.error) fail(res.error.message)
  } else if (text.trim()) {
    const position = Math.max(-1, ...post.blocks.map((b) => b.position)) + 1
    const { error: e } = await supabase.from('post_blocks').insert({ post_id: post.id, position, kind: 'text', text_content: text.trim() })
    if (e) fail(e.message)
  }
}

/** Beitrag löschen. Fotos und Videos bleiben in der Galerie. */
export const deletePost = async (postId: string) => {
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) fail(error.message)
}

// ---------------------------------------------------------------------------
// Secret Link
// ---------------------------------------------------------------------------

export const followerUrl = (token: string) => `${appUrl()}t/${token}`

/** Liefert den Follower-Link der Reise und legt ihn beim ersten Mal an. */
export const getOrCreateShareLink = async (tripId: string): Promise<string> => {
  const { data: existing } = await supabase
    .from('share_links')
    .select('token')
    .eq('trip_id', tripId)
    .eq('role', 'follower')
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (existing) return followerUrl(existing.token)
  const { data, error } = await supabase.from('share_links').insert({ trip_id: tripId, role: 'follower' }).select('token').single()
  if (error) fail(error.message)
  return followerUrl(data!.token)
}

/** Alten Link sperren und neuen erzeugen (z.B. wenn er an Falsche gelangt ist). */
export const rotateShareLink = async (tripId: string): Promise<string> => {
  await supabase.from('share_links').update({ revoked_at: new Date().toISOString() }).eq('trip_id', tripId).eq('role', 'follower').is('revoked_at', null)
  return getOrCreateShareLink(tripId)
}

// ---------------------------------------------------------------------------
// Feed laden (gemeinsames Format für Reisende und Follower)
// ---------------------------------------------------------------------------

export interface FeedBlock {
  id?: string
  position: number
  kind: string
  text: string | null
  url: string | null
  mediaUrl: string | null
}

export interface FeedPoll {
  id: string
  question: string
  description: string | null
  closes_at: string | null
  status: 'open' | 'closed' | 'resolved'
  chosen_option_id: string | null
  decision_text: string | null
  options: { id: string; label: string; votes: number }[]
  /** null = Resultat verborgen (Follower hat noch nicht abgestimmt) */
  total: number | null
  my_option_id?: string | null
}

export interface FeedReply {
  id: string
  body: string
  author: string
  from_traveler: boolean
  is_private: boolean
  created_at: string
}

export interface FeedPost {
  id: string
  kind: PostKind
  title: string | null
  published_at: string
  story_expires_at: string | null
  place_name: string | null
  /** wer den Beitrag erfasst hat (nur in der Ansicht der Reisenden) */
  author_name?: string | null
  blocks: FeedBlock[]
  poll: FeedPoll | null
  reactions: Record<string, number>
  my_reactions?: string[]
  replies: FeedReply[]
}

export const EMOJIS = ['❤️', '😍', '😂', '😮', '🙏', '🎉'] as const

interface RawPoll {
  id: string
  question: string
  description: string | null
  closes_at: string | null
  status: FeedPoll['status']
  chosen_option_id: string | null
  decision_text: string | null
  poll_options: { id: string; position: number; label: string }[]
  votes: { option_id: string }[]
}

interface RawPost {
  id: string
  kind: PostKind
  title: string | null
  published_at: string
  story_expires_at: string | null
  author: { display_name: string | null } | null
  checkin: { place_name: string | null } | null
  post_blocks: { id: string; position: number; kind: string; text_content: string | null; url: string | null; media: { storage_path: string } | null }[]
  polls: RawPoll | RawPoll[] | null
  reactions: { emoji: string }[]
  replies: {
    id: string
    body: string
    visibility: 'public' | 'private'
    hidden_at: string | null
    created_at: string
    author_profile_id: string | null
    follower: { display_name: string } | null
  }[]
}

/** Lädt alle veröffentlichten Updates einer Reise für Reisende (inkl. Abstimmungsergebnis und Antworten). */
export const loadUpdates = async (tripId: string): Promise<FeedPost[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `id, kind, title, published_at, story_expires_at,
       author:profiles(display_name),
       checkin:checkins(place_name),
       post_blocks!post_blocks_post_id_fkey(id, position, kind, text_content, url, media(storage_path)),
       polls(id, question, description, closes_at, status, chosen_option_id, decision_text, poll_options!poll_options_poll_id_fkey(id, position, label), votes(option_id)),
       reactions(emoji),
       replies(id, body, visibility, hidden_at, created_at, author_profile_id, follower:followers(display_name))`,
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

  return (data ?? []).map((p) => {
    const pl = (Array.isArray(p.polls) ? p.polls[0] : p.polls) ?? null
    const reactions: Record<string, number> = {}
    p.reactions.forEach((r) => (reactions[r.emoji] = (reactions[r.emoji] ?? 0) + 1))
    return {
      id: p.id,
      kind: p.kind,
      title: p.title,
      published_at: p.published_at,
      story_expires_at: p.story_expires_at,
      place_name: p.checkin?.place_name ?? null,
      author_name: p.author?.display_name ?? null,
      blocks: [...p.post_blocks]
        .sort((a, b) => a.position - b.position)
        .map((b) => ({
          id: b.id,
          position: b.position,
          kind: b.kind,
          text: b.text_content,
          url: b.url,
          mediaUrl: b.media ? (urls.get(b.media.storage_path) ?? null) : null,
        })),
      poll: pl
        ? {
            id: pl.id,
            question: pl.question,
            description: pl.description,
            closes_at: pl.closes_at,
            status: pl.status,
            chosen_option_id: pl.chosen_option_id,
            decision_text: pl.decision_text,
            total: pl.votes.length,
            options: [...pl.poll_options]
              .sort((a, b) => a.position - b.position)
              .map((o) => ({ id: o.id, label: o.label, votes: pl.votes.filter((v) => v.option_id === o.id).length })),
          }
        : null,
      reactions,
      replies: p.replies
        .filter((r) => !r.hidden_at)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((r) => ({
          id: r.id,
          body: r.body,
          author: r.follower?.display_name ?? 'Ihr',
          from_traveler: !!r.author_profile_id,
          is_private: r.visibility === 'private',
          created_at: r.created_at,
        })),
    }
  })
}
