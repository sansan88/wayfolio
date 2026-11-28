import { appUrl } from './auth'
import { readPhotoMeta } from './exif'
import { cachedLoad } from './offline'
import { distanceKm, isDistanceLine, ROUTE_IMAGE_VERSION } from './geo'
import { cleanLinks } from './links'
import { loadRoute, type RoutePoint } from './route'
import { reverseGeocode, toWkt, type Place, type Position } from './location'
import { supabase } from './supabase'

const STORY_HOURS = 24
/** Anzeigegrösse: lange Kante 1600 px, JPEG ~82 % – scharf auf dem Handy, meist 250–500 KB */
const MAX_IMAGE_EDGE = 1600
export const MAX_VIDEO_MB = 100

export type PostKind = 'story' | 'feed' | 'background' | 'route_update' | 'poll'
export type MediaKind = 'photo' | 'video' | 'audio'

export interface Context {
  tripId: string
  userId: string
  position: Position | null
  place: Place | null
  /** Zeitpunkt des Updates (rückdatiert); null/undefined = jetzt */
  at?: Date | null
  source?: 'gps' | 'manual'
  /** Ort wurde für dieses Update ausdrücklich gewählt: nicht durch Foto-GPS ersetzen */
  lockPlace?: boolean
}

const when = (ctx: Context) => (ctx.at ?? new Date()).toISOString()

const fail = (message: string): never => {
  throw new Error(message)
}

const storyExpiry = () => new Date(Date.now() + STORY_HOURS * 3600 * 1000).toISOString()

/**
 * Verkleinert ein Foto im Browser auf max. 2048 px und speichert es als JPEG.
 * Das Neu-Kodieren entfernt die EXIF-Daten aus der Datei; Aufnahmezeit und Ort werden vorher
 * mit readPhotoMeta gelesen und nur in der Datenbank (für Reisende/Galerie) gespeichert.
 */
/** Bild verkleinern und als JPEG neu kodieren (entfernt EXIF aus der Datei). */
export const resizeImage = async (file: Blob, maxEdge = MAX_IMAGE_EDGE, quality = 0.82): Promise<Blob> => {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvasToJpeg(canvas, quality)
}

/**
 * Leinwand als JPEG und danach sofort freigeben. iOS Safari gibt den Speicher einer Leinwand sonst erst spät frei;
 * bei mehreren Fotos summiert sich das, bis iOS die Seite neu lädt.
 */
export const canvasToJpeg = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Bild konnte nicht verarbeitet werden.'))), 'image/jpeg', quality),
  ).finally(() => {
    canvas.width = 0
    canvas.height = 0
  })

/** Vorschaubild (Feed-Punkte, Galerie-Raster, Karte): klein und schnell auf dem Handy. */
const THUMB_EDGE = 480

const extensionFor = (type: string, fallback: string) => {
  const sub = type.split('/')[1]?.split(';')[0]
  return sub ? sub.replace('quicktime', 'mov').replace('x-m4a', 'm4a') : fallback
}

/** Lädt eine Datei in den privaten Bucket «media» und legt den Medien-Eintrag an. */
export const uploadMedia = async (ctx: Context, data: Blob, kind: MediaKind, opts: { route?: boolean } = {}): Promise<string> => {
  // Aufnahmedatum und -ort aus den Metadaten übernehmen, bevor das Verkleinern sie entfernt
  const meta = kind === 'photo' && !opts.route ? await readPhotoMeta(data) : { takenAt: null, position: null }
  const blob = kind === 'photo' ? await resizeImage(data) : data
  // zu jedem Foto ein Vorschaubild (ausser Routenbildern)
  let thumbPath: string | null = null
  if (kind === 'photo' && !opts.route) {
    // aus dem bereits verkleinerten Bild – das Original (bis 48 MP) nicht ein zweites Mal dekodieren
    const thumb = await resizeImage(blob, THUMB_EDGE, 0.72)
    thumbPath = `${ctx.tripId}/${crypto.randomUUID()}_thumb.jpg`
    const up = await supabase.storage.from('media').upload(thumbPath, thumb, { contentType: 'image/jpeg' })
    if (up.error) thumbPath = null
  }
  const contentType = kind === 'photo' ? 'image/jpeg' : blob.type || (kind === 'audio' ? 'audio/webm' : 'video/mp4')
  const ext = kind === 'photo' ? 'jpg' : extensionFor(contentType, kind === 'audio' ? 'webm' : 'mp4')
  const path = `${ctx.tripId}/${crypto.randomUUID()}.${ext}`
  const upload = await supabase.storage.from('media').upload(path, blob, { contentType })
  if (upload.error) fail(`Upload fehlgeschlagen: ${upload.error.message}`)
  const { data: media, error } = await supabase
    .from('media')
    .insert({
      trip_id: ctx.tripId,
      uploaded_by: ctx.userId,
      kind,
      storage_path: path,
      // Routenbilder markieren: nicht in der Galerie und nicht als Foto auf der Karte
      variants: opts.route ? { route: true, v: ROUTE_IMAGE_VERSION } : thumbPath ? { thumb: thumbPath } : {},
      taken_at: meta.takenAt?.toISOString() ?? when(ctx),
      // Ort aus den Foto-Metadaten, sonst der beim Erfassen gewählte Ort (GPS oder Pin)
      taken_location: meta.position ? toWkt(meta.position) : ctx.position ? toWkt(ctx.position) : null,
      taken_place: meta.position ? (await reverseGeocode(meta.position)).name : (ctx.place?.name ?? null),
    })
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
      recorded_at: when(ctx),
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
      title: post.title ?? null,
      checkin_id: checkinId,
      published_at: when(ctx),
      // Story-Kreis immer 24 h ab Veröffentlichung, auch wenn rückdatiert
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


// ---------------------------------------------------------------------------
// Ort und Zeit vereinheitlichen («Fussabdruck»): jedes Update hat Ort + Zeitpunkt
// ---------------------------------------------------------------------------

/** Gleicher Ort, wenn näher als 1 km und innerhalb von 12 Stunden – dann keinen neuen Routenpunkt anlegen. */
const SAME_PLACE_KM = 1
const SAME_PLACE_HOURS = 12

/**
 * Ort und Zeitpunkt aus dem ersten Foto mit Metadaten übernehmen:
 * - Zeitpunkt: manuell rückdatiert > Aufnahmezeit des Fotos > jetzt
 * - Ort: im Dialog gewählter Ort > GPS des Fotos > Ort aus «Erfassen» (GPS oder Pin)
 */
const withPhotoMeta = async (ctx: Context, files: Blob[]): Promise<Context> => {
  for (const file of files) {
    if (!file.type.startsWith('image')) continue
    const meta = await readPhotoMeta(file)
    if (!meta.takenAt && !meta.position) continue
    const useFotoPlace = !!meta.position && !ctx.lockPlace
    return {
      ...ctx,
      at: ctx.at ?? meta.takenAt ?? null,
      position: useFotoPlace ? meta.position : ctx.position,
      place: useFotoPlace ? await reverseGeocode(meta.position!) : ctx.place,
    }
  }
  return ctx
}

/** Bestehenden Routenpunkt in der Nähe verwenden oder einen neuen anlegen. */
const checkinFor = async (ctx: Context, forceNew = false): Promise<{ id: string; isNew: boolean } | null> => {
  if (!ctx.position) return null
  if (!forceNew) {
    const t = Date.parse(when(ctx))
    const near = (await loadRoute(ctx.tripId)).find(
      (p) =>
        distanceKm(p, ctx.position!) < SAME_PLACE_KM && Math.abs(Date.parse(p.recorded_at) - t) < SAME_PLACE_HOURS * 3600_000,
    )
    if (near) return { id: near.id, isNew: false }
  }
  const id = await insertCheckin(ctx)
  return id ? { id, isNew: true } : null
}

/** Bildzeile: «Tag 3 · Queenstown → Wānaka» */
const routeCaption = (route: RoutePoint[], placeName?: string | null) => {
  const prev = route.at(-2)
  const day = route.length ? Math.floor((Date.parse(route.at(-1)!.recorded_at) - Date.parse(route[0].recorded_at)) / 86400000) + 1 : 1
  const name = (placeName ?? route.at(-1)?.place_name ?? 'Neuer Ort').split(',')[0]
  return prev?.place_name ? `Tag ${day} · ${prev.place_name.split(',')[0]} → ${name}` : `Tag ${day} · ${name}`
}

/**
 * Bestehende Routenbilder neu zeichnen (z.B. nach geändertem Kartenausschnitt). Ersetzt die Datei,
 * die Verknüpfung in den Beiträgen bleibt. Nur Bilder mit älterer Version werden angefasst.
 */
export const regenerateRouteImages = async (tripId: string, onProgress?: (done: number, total: number) => void) => {
  const { data: media, error } = await supabase
    .from('media')
    .select('id, storage_path, variants, post_blocks(post:posts!post_blocks_post_id_fkey(checkin_id))')
    .eq('trip_id', tripId)
    .eq('variants->>route', 'true')
  if (error) fail(error.message)
  const outdated = (media ?? []).filter((m) => ((m.variants as { v?: number } | null)?.v ?? 1) < ROUTE_IMAGE_VERSION)
  if (!outdated.length) return 0
  const { renderRouteImage } = await import('./map')
  const all = await loadRoute(tripId)
  let done = 0
  for (const m of outdated) {
    const blocks = (m.post_blocks ?? []) as unknown as { post: { checkin_id: string | null } | null }[]
    const checkinId = blocks.map((b) => b.post?.checkin_id).find(Boolean)
    const idx = all.findIndex((p) => p.id === checkinId)
    if (idx >= 0) {
      const route = all.slice(0, idx + 1)
      const image = await renderRouteImage(route, routeCaption(route))
      const path = `${tripId}/${crypto.randomUUID()}.jpg`
      const up = await supabase.storage.from('media').upload(path, image, { contentType: 'image/jpeg' })
      if (!up.error) {
        const { error: e } = await supabase
          .from('media')
          .update({ storage_path: path, variants: { route: true, v: ROUTE_IMAGE_VERSION } })
          .eq('id', m.id)
        if (!e) await supabase.storage.from('media').remove([m.storage_path])
      }
    }
    onProgress?.(++done, outdated.length)
  }
  return done
}

/** Routenbild bis zu diesem (evtl. rückdatierten) Punkt plus Distanzzeile. */
const routeBlocks = async (ctx: Context, checkinId: string): Promise<NewBlock[]> => {
  try {
    const { renderRouteImage, distanceKm } = await import('./map')
    const all = await loadRoute(ctx.tripId)
    const idx = all.findIndex((p) => p.id === checkinId)
    const route = idx >= 0 ? all.slice(0, idx + 1) : all
    const prev = route.at(-2)
    const leg = prev ? Math.round(distanceKm(prev, route.at(-1)!)) : 0
    const image = await renderRouteImage(route, routeCaption(route, ctx.place?.name))
    const blocks: NewBlock[] = [{ kind: 'photo', mediaId: await uploadMedia(ctx, image, 'photo', { route: true }) }]
    if (leg) await supabase.from('checkins').update({ leg_distance_m: leg * 1000 }).eq('id', checkinId)
    return blocks
  } catch (e) {
    console.warn('Routenbild konnte nicht erzeugt werden', e)
    return []
  }
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

/**
 * Foto, Video oder Sprachnachricht: Story. Bringt das Update einen neuen Ort mit
 * (Foto-GPS oder Pin), erscheint es zusätzlich im Feed – mit Routenbild.
 */
export const createMediaStory = async (base: Context, data: File | Blob, kind: MediaKind) => {
  const ctx = kind === 'photo' ? await withPhotoMeta(base, [data]) : base
  const checkin = await checkinFor(ctx)
  const mediaId = await uploadMedia(ctx, data, kind)
  if (checkin?.isNew) {
    const route = await routeBlocks(ctx, checkin.id)
    await publish(ctx, { kind: 'feed', title: ctx.place?.name.split(',')[0] ?? null, blocks: [{ kind, mediaId }, ...route], inStories: true, checkinId: checkin.id })
  } else {
    await publish(ctx, { kind: 'story', blocks: [{ kind, mediaId }], inStories: true, checkinId: checkin?.id ?? null })
  }
}

/** Seitentitel bzw. Ortsnamen für Links holen (Edge Function «link-title»). */
const fetchTitles = async (urls: string[]): Promise<(string | null)[]> => {
  if (!urls.length) return []
  try {
    const { data } = await supabase.functions.invoke<{ titles: (string | null)[] }>('link-title', { body: { urls } })
    return urls.map((_, i) => data?.titles?.[i] ?? null)
  } catch {
    return urls.map(() => null)
  }
}

/**
 * Ältere Links ohne gespeicherten Titel einmalig im Hintergrund ergänzen (pro Gerät und Link nur ein Versuch).
 * Gibt die Zahl der ergänzten Titel zurück.
 */
export const fillLinkTitles = async (posts: FeedPost[]) => {
  const key = 'lf-link-title-tried'
  let tried: string[] = []
  try {
    tried = JSON.parse(localStorage.getItem(key) ?? '[]') as string[]
  } catch {
    /* leer */
  }
  const todo = posts
    .flatMap((p) => p.blocks)
    .filter((b) => b.kind === 'link' && b.id && b.url && !b.text && !tried.includes(b.id))
    .slice(0, 16)
  if (!todo.length) return 0
  let filled = 0
  for (let i = 0; i < todo.length; i += 8) {
    const batch = todo.slice(i, i + 8)
    const titles = await fetchTitles(batch.map((b) => b.url!))
    for (const [j, b] of batch.entries()) {
      tried.push(b.id!)
      if (!titles[j]) continue
      const { error } = await supabase.from('post_blocks').update({ text_content: titles[j] }).eq('id', b.id!)
      if (!error) filled++
    }
  }
  try {
    localStorage.setItem(key, JSON.stringify(tried.slice(-500)))
  } catch {
    /* egal */
  }
  return filled
}

/** Link-Bausteine (bereinigt, ohne Doppelte), mit Seitentitel als Anzeigetext */
const linkBlocks = async (links: string[]): Promise<NewBlock[]> => {
  const urls = cleanLinks(links)
  if (!urls.length) return []
  const titles = await fetchTitles(urls)
  return urls.map((url, i) => ({ kind: 'link', url, text: titles[i] ?? undefined }))
}

/** Standort setzen: immer ein neuer Routenpunkt mit Routenbild im Feed. */
export const createLocationUpdate = async (ctx: Context) => {
  if (!ctx.position) fail('Ohne Standort kein Update.')
  const checkin = await checkinFor(ctx, true)
  const blocks = await routeBlocks(ctx, checkin!.id)
  await publish(ctx, { kind: 'feed', checkinId: checkin!.id, blocks })
}

/**
 * Ein Beitrag – die einzige Art, Neues zu erfassen: optional Titel, Text, Ort, Zeit, Fotos/Medien, Links.
 * Ort: manuell gewählt (fix) > aus dem ersten Foto > GPS. An einem neuen Ort oder ohne Fotos kommt
 * das Routenbild dazu. Ohne Titel zeigt die App den Ort als Titel.
 * `recap`: Vorlage aus «Rückblick mit Claude» – markiert als Beitragsart «background», damit der
 * nächste Rückblick erst danach beginnt.
 */
export const createPost = async (
  base: Context,
  post: { title: string; text: string; files: File[]; links?: string[]; recap?: boolean },
) => {
  const ctx = await withPhotoMeta(base, post.files)
  const checkin = await checkinFor(ctx)
  const blocks: NewBlock[] = []
  if (post.text.trim()) blocks.push({ kind: 'text', text: post.text.trim() })
  blocks.push(...(await mediaBlocks(ctx, post.files)))
  blocks.push(...(await linkBlocks(post.links ?? [])))
  const hasPhoto = post.files.some((f) => f.type.startsWith('image') || f.type.startsWith('video'))
  if (checkin && (checkin.isNew || !hasPhoto)) blocks.push(...(await routeBlocks(ctx, checkin.id)).filter((b) => b.kind !== 'text'))
  await publish(ctx, {
    kind: post.recap ? 'background' : 'feed',
    title: post.title.trim() || null,
    blocks,
    checkinId: checkin?.id ?? null,
  })
}

export const createBackground = async (base: Context, title: string, text: string, files: File[]) => {
  const ctx = await withPhotoMeta(base, files)
  const checkin = await checkinFor(ctx)
  const blocks: NewBlock[] = [{ kind: 'text', text: text.trim() }, ...(await mediaBlocks(ctx, files))]
  await publish(ctx, { kind: 'background', title: title.trim(), blocks, inStories: true, checkinId: checkin?.id ?? null })
}

export const addOwnerReply = async (postId: string, userId: string, body: string) => {
  const { error } = await supabase.from('replies').insert({ post_id: postId, author_profile_id: userId, body: body.trim() })
  if (error) fail(error.message)
}

export const hideReply = async (replyId: string) => {
  const { error } = await supabase.from('replies').update({ hidden_at: new Date().toISOString() }).eq('id', replyId)
  if (error) fail(error.message)
}

/** Titel, Text und Zeitpunkt eines Beitrags ändern (erster Text-Baustein; fehlt er, wird er angehängt). */
export interface PostChanges {
  title: string
  text: string
  links: string[]
  at: Date | null
  location: { position: Position; place: Place } | null
  files: File[]
  removedBlockIds: string[]
  /** Reihenfolge der Medien: Block-ID oder «new:<Index in files>» */
  mediaOrder?: string[]
}

/** Beitrag bearbeiten: Titel, Text, Link, Zeitpunkt, Ort, Medien hinzufügen/entfernen. */
export const updatePost = async (post: FeedPost, tripId: string, userId: string, c: PostChanges) => {
  const at = c.at ?? new Date(post.published_at)
  const ctx: Context = { tripId, userId, position: c.location?.position ?? null, place: c.location?.place ?? null, at, lockPlace: true }

  // neuer Ort: passenden Routenpunkt finden oder anlegen, an neuem Ort mit Routenbild
  let checkinId = post.checkin_id ?? null
  const extra: NewBlock[] = []
  if (c.location) {
    const checkin = await checkinFor(ctx)
    checkinId = checkin?.id ?? null
    if (checkin?.isNew && !post.blocks.some((b) => b.route)) extra.push(...(await routeBlocks(ctx, checkin.id)).filter((b) => b.kind !== 'text'))
  } else if (c.at && post.checkin_id) {
    // Zeitpunkt auch am Ort nachführen, damit die Route in der richtigen Reihenfolge bleibt
    const { error: e } = await supabase.from('checkins').update({ recorded_at: at.toISOString() }).eq('id', post.checkin_id)
    if (e) fail(e.message)
  }

  const { error } = await supabase
    .from('posts')
    .update({
      title: c.title.trim() || null,
      published_at: at.toISOString(),
      checkin_id: checkinId,
    })
    .eq('id', post.id)
  if (error) fail(error.message)

  // alte, nicht mehr angezeigte Distanzzeilen entfernen
  const { data: legacy } = await supabase.from('post_blocks').select('id, text_content').eq('post_id', post.id).eq('kind', 'text')
  const distanceIds = (legacy ?? []).filter((b) => isDistanceLine(b.text_content as string | null)).map((b) => b.id as string)
  if (distanceIds.length) await supabase.from('post_blocks').delete().in('id', distanceIds)

  // Text
  const textBlock = post.blocks.find((b) => b.kind === 'text' && b.id)
  if (textBlock) {
    const res = c.text.trim()
      ? await supabase.from('post_blocks').update({ text_content: c.text.trim() }).eq('id', textBlock.id!)
      : await supabase.from('post_blocks').delete().eq('id', textBlock.id!)
    if (res.error) fail(res.error.message)
  }

  // Links: alle bisherigen ersetzen (Reihenfolge wie im Dialog)
  const oldLinkIds = post.blocks.filter((b) => b.kind === 'link' && b.id).map((b) => b.id!)
  if (oldLinkIds.length) {
    const { error: e } = await supabase.from('post_blocks').delete().in('id', oldLinkIds)
    if (e) fail(e.message)
  }

  // entfernte Medien; an neuem Ort das alte Routenbild ersetzen
  const removeIds = [...c.removedBlockIds, ...(extra.length ? post.blocks.filter((b) => b.route && b.id).map((b) => b.id!) : [])]
  if (removeIds.length) {
    const { error: e } = await supabase.from('post_blocks').delete().in('id', removeIds)
    if (e) fail(e.message)
  }

  // neue Bausteine anhängen
  const added: NewBlock[] = []
  if (!textBlock && c.text.trim()) added.push({ kind: 'text', text: c.text.trim() })
  const newMedia = await mediaBlocks(ctx, c.files)
  added.push(...newMedia)
  added.push(...(await linkBlocks(c.links)))
  added.push(...extra)
  if (added.length) {
    // Position aus der Datenbank: ausgeblendete Bausteine (z.B. alte Distanzzeilen) zählen mit
    const { data: existing } = await supabase.from('post_blocks').select('position').eq('post_id', post.id)
    let position = Math.max(-1, ...(existing ?? []).map((b) => b.position as number), ...post.blocks.map((b) => b.position)) + 1
    const { error: e } = await supabase.from('post_blocks').insert(
      added.map((b) => ({
        post_id: post.id,
        position: position++,
        kind: b.kind,
        text_content: b.text ?? null,
        media_id: b.mediaId ?? null,
        url: b.url ?? null,
      })),
    )
    if (e) fail(e.message)
  }

  if (c.mediaOrder?.length) await reorderMedia(post.id, c.mediaOrder, newMedia.map((b) => b.mediaId!))
}

/**
 * Medien in die gewünschte Reihenfolge bringen. Die Plätze (Positionen) der Medien bleiben,
 * nur ihre Belegung wechselt – Text, Links und Routenbild bleiben, wo sie sind.
 */
const reorderMedia = async (postId: string, order: string[], newMediaIds: string[]) => {
  const { data, error } = await supabase.from('post_blocks').select('id, position, media_id').eq('post_id', postId)
  if (error) fail(error.message)
  const rows = (data ?? []) as { id: string; position: number; media_id: string | null }[]
  const idFor = (key: string) =>
    key.startsWith('new:') ? rows.find((r) => r.media_id === newMediaIds[Number(key.slice(4))])?.id : rows.find((r) => r.id === key)?.id
  const ids = order.map(idFor).filter((id): id is string => !!id)
  const slots = rows.filter((r) => ids.includes(r.id)).map((r) => r.position).sort((a, b) => a - b)
  const target = new Map(ids.map((id, i) => [id, slots[i]]))
  const moves = rows.filter((r) => target.has(r.id) && target.get(r.id) !== r.position)
  if (!moves.length) return
  // zweistufig wegen der Eindeutigkeit von (post_id, position)
  const temp = Math.max(...rows.map((r) => r.position)) + 1000
  for (const [i, r] of moves.entries()) {
    const { error: e } = await supabase.from('post_blocks').update({ position: temp + i }).eq('id', r.id)
    if (e) fail(e.message)
  }
  for (const r of moves) {
    const { error: e } = await supabase.from('post_blocks').update({ position: target.get(r.id)! }).eq('id', r.id)
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

/** Secret Link für genau einen Beitrag (zeigt nicht die ganze Reise). */
export const postUrl = (token: string) => `${appUrl()}p/${token}`

export const getOrCreatePostLink = async (post: FeedPost, tripId: string): Promise<string> => {
  const { data: existing } = await supabase
    .from('share_links')
    .select('token')
    .eq('post_id', post.id)
    .eq('role', 'post')
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (existing) return postUrl(existing.token)
  const { data, error } = await supabase
    .from('share_links')
    .insert({ trip_id: tripId, role: 'post', post_id: post.id })
    .select('token')
    .single()
  if (error) fail(error.message)
  return postUrl(data!.token)
}

/** Alle Links dieses Beitrags sperren (wer ihn hat, sieht nichts mehr). */
export const revokePostLinks = async (postId: string) => {
  const { error } = await supabase
    .from('share_links')
    .update({ revoked_at: new Date().toISOString() })
    .eq('post_id', postId)
    .eq('role', 'post')
    .is('revoked_at', null)
  if (error) fail(error.message)
}

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
  /** Vorschaubild (klein) */
  thumbUrl?: string | null
  /** automatisch erzeugtes Routenbild */
  route?: boolean
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
  checkin_id?: string | null
  /** wer den Beitrag erfasst hat (nur in der Ansicht der Reisenden) */
  author_name?: string | null
  blocks: FeedBlock[]
  reactions: Record<string, number>
  my_reactions?: string[]
  replies: FeedReply[]
}

export const EMOJIS = ['❤️', '😍', '😂', '😮', '🙏', '🎉'] as const

interface RawPost {
  id: string
  kind: PostKind
  title: string | null
  published_at: string
  story_expires_at: string | null
  author: { display_name: string | null } | null
  checkin: { id: string; place_name: string | null } | null
  post_blocks: { id: string; position: number; kind: string; text_content: string | null; url: string | null; media: { storage_path: string; variants: { route?: boolean; thumb?: string } | null } | null }[]
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

/** Lädt alle veröffentlichten Updates einer Reise für Reisende (inkl. Antworten). */
export const loadUpdates = (tripId: string): Promise<FeedPost[]> => cachedLoad(`posts:${tripId}`, () => fetchUpdates(tripId))

const fetchUpdates = async (tripId: string): Promise<FeedPost[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `id, kind, title, published_at, story_expires_at,
       author:profiles(display_name),
       checkin:checkins(id, place_name),
       post_blocks!post_blocks_post_id_fkey(id, position, kind, text_content, url, media(storage_path, variants)),
       reactions(emoji),
       replies(id, body, visibility, hidden_at, created_at, author_profile_id, follower:followers(display_name))`,
    )
    .eq('trip_id', tripId)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(100)
    .returns<RawPost[]>()
  if (error) fail(error.message)

  const paths = (data ?? []).flatMap(
    (p) => p.post_blocks.flatMap((b) => [b.media?.storage_path, b.media?.variants?.thumb]).filter(Boolean) as string[],
  )
  const urls = new Map<string, string>()
  if (paths.length) {
    const { data: signed } = await supabase.storage.from('media').createSignedUrls(paths, 3600)
    signed?.forEach((s) => s.path && s.signedUrl && urls.set(s.path, s.signedUrl))
  }

  return (data ?? []).map((p) => {
    const reactions: Record<string, number> = {}
    p.reactions.forEach((r) => (reactions[r.emoji] = (reactions[r.emoji] ?? 0) + 1))
    return {
      id: p.id,
      kind: p.kind,
      title: p.title,
      published_at: p.published_at,
      story_expires_at: p.story_expires_at,
      place_name: p.checkin?.place_name ?? null,
      checkin_id: p.checkin?.id ?? null,
      author_name: p.author?.display_name ?? null,
      blocks: [...p.post_blocks]
        .filter((b) => !(b.kind === 'text' && isDistanceLine(b.text_content)))
        .sort((a, b) => a.position - b.position)
        .map((b) => ({
          id: b.id,
          position: b.position,
          kind: b.kind,
          text: b.text_content,
          url: b.url,
          mediaUrl: b.media ? (urls.get(b.media.storage_path) ?? null) : null,
          // Vorschaubild; ältere Fotos ohne Vorschau nutzen das grosse Bild
          thumbUrl: b.media ? (urls.get(b.media.variants?.thumb ?? '') ?? urls.get(b.media.storage_path) ?? null) : null,
          route: !!b.media?.variants?.route,
        })),
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
