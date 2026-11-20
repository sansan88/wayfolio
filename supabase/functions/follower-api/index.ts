// Wayfolio – Follower-API
// Follower haben kein Konto. Jede Anfrage enthält den Secret Link (token) und ein
// zufälliges Geräte-Token aus dem Browser. Die Funktion prüft den Link und arbeitet
// mit der Service-Rolle, gibt aber nur Inhalte der Reise dieses Links heraus.
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const EMOJIS = ['❤️', '😍', '😂', '😮', '🙏', '🎉']
const FREQUENCIES = ['instant', 'weekly', 'monthly']

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const sha256 = async (text: string) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

interface Link {
  id: string
  trip_id: string
}

const getLink = async (token: unknown): Promise<Link> => {
  if (typeof token !== 'string' || token.length < 32) throw new HttpError(404, 'Link ungültig')
  const { data } = await supabase
    .from('share_links')
    .select('id, trip_id, expires_at, revoked_at')
    .eq('token', token)
    .eq('role', 'follower')
    .maybeSingle()
  if (!data || data.revoked_at || (data.expires_at && Date.parse(data.expires_at) < Date.now()))
    throw new HttpError(404, 'Dieser Link ist nicht mehr gültig.')
  return data
}

const findFollower = async (link: Link, device: unknown) => {
  if (typeof device !== 'string' || device.length < 20) return null
  const { data } = await supabase
    .from('followers')
    .select('id, display_name, email, blocked_at')
    .eq('device_token_hash', await sha256(`${link.id}:${device}`))
    .maybeSingle()
  return data
}

const requireFollower = async (link: Link, device: unknown) => {
  const f = await findFollower(link, device)
  if (!f) throw new HttpError(401, 'Bitte zuerst einen Namen angeben.')
  if (f.blocked_at) throw new HttpError(403, 'Dieser Zugang wurde gesperrt.')
  return f
}

/** Beitrag muss zur Reise des Links gehören und für Follower sichtbar sein. */
const requirePost = async (link: Link, postId: unknown) => {
  const { data } = await supabase
    .from('posts')
    .select('id, replies_enabled')
    .eq('id', String(postId))
    .eq('trip_id', link.trip_id)
    .eq('visibility', 'followers')
    .not('published_at', 'is', null)
    .maybeSingle()
  if (!data) throw new HttpError(404, 'Beitrag nicht gefunden.')
  return data
}

const feed = async (link: Link, device: unknown) => {
  const follower = await findFollower(link, device)
  const [{ data: trip }, { data: posts, error }, { data: route }] = await Promise.all([
    supabase.from('trips').select('title, description, starts_on').eq('id', link.trip_id).single(),
    supabase
      .from('posts')
      .select(
        `id, kind, title, published_at, story_expires_at, replies_enabled,
         checkin:checkins(place_name),
         post_blocks!post_blocks_post_id_fkey(position, kind, text_content, url, media(storage_path)),
         polls(id, question, description, closes_at, status, chosen_option_id, decision_text, poll_options!poll_options_poll_id_fkey(id, position, label), votes(option_id, follower_id)),
         reactions(emoji, follower_id),
         replies(id, body, visibility, hidden_at, created_at, follower_id, author_profile_id, follower:followers(display_name))`,
      )
      .eq('trip_id', link.trip_id)
      .eq('visibility', 'followers')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(100),
    supabase.rpc('trip_checkins', { p_trip_id: link.trip_id }),
  ])
  if (error) throw new HttpError(500, error.message)

  // deno-lint-ignore no-explicit-any
  const rows = (posts ?? []) as any[]
  const paths = rows.flatMap((p) => p.post_blocks.map((b: { media: { storage_path: string } | null }) => b.media?.storage_path).filter(Boolean))
  const urls = new Map<string, string>()
  if (paths.length) {
    const { data: signed } = await supabase.storage.from('media').createSignedUrls(paths, 3600)
    signed?.forEach((s) => s.path && s.signedUrl && urls.set(s.path, s.signedUrl))
  }
  const me = follower?.id ?? null

  const out = rows.map((p) => {
    const pl = Array.isArray(p.polls) ? p.polls[0] : p.polls
    const reactions: Record<string, number> = {}
    p.reactions.forEach((r: { emoji: string }) => (reactions[r.emoji] = (reactions[r.emoji] ?? 0) + 1))
    let poll = null
    if (pl) {
      const myVote = me ? pl.votes.find((v: { follower_id: string }) => v.follower_id === me) : null
      const open = pl.status === 'open' && (!pl.closes_at || Date.parse(pl.closes_at) > Date.now())
      // Resultat erst nach der eigenen Stimme (oder wenn die Abstimmung vorbei ist)
      const reveal = !!myVote || !open
      poll = {
        id: pl.id,
        question: pl.question,
        description: pl.description,
        closes_at: pl.closes_at,
        status: pl.status,
        chosen_option_id: pl.status === 'resolved' ? pl.chosen_option_id : null,
        decision_text: pl.status === 'resolved' ? pl.decision_text : null,
        my_option_id: myVote?.option_id ?? null,
        total: reveal ? pl.votes.length : null,
        options: [...pl.poll_options]
          .sort((a, b) => a.position - b.position)
          .map((o) => ({
            id: o.id,
            label: o.label,
            votes: reveal ? pl.votes.filter((v: { option_id: string }) => v.option_id === o.id).length : 0,
          })),
      }
    }
    return {
      id: p.id,
      kind: p.kind,
      title: p.title,
      published_at: p.published_at,
      story_expires_at: p.story_expires_at,
      place_name: p.checkin?.place_name ?? null,
      replies_enabled: p.replies_enabled,
      blocks: [...p.post_blocks]
        .sort((a, b) => a.position - b.position)
        .map((b) => ({
          position: b.position,
          kind: b.kind,
          text: b.text_content,
          url: b.url,
          mediaUrl: b.media ? (urls.get(b.media.storage_path) ?? null) : null,
        })),
      poll,
      reactions,
      my_reactions: me ? p.reactions.filter((r: { follower_id: string }) => r.follower_id === me).map((r: { emoji: string }) => r.emoji) : [],
      // öffentliche Antworten + eigene private Antworten
      replies: p.replies
        .filter((r: { hidden_at: string | null; visibility: string; follower_id: string | null }) =>
          !r.hidden_at && (r.visibility === 'public' || (me && r.follower_id === me)))
        .sort((a: { created_at: string }, b: { created_at: string }) => a.created_at.localeCompare(b.created_at))
        .map((r: { id: string; body: string; visibility: string; created_at: string; author_profile_id: string | null; follower: { display_name: string } | null }) => ({
          id: r.id,
          body: r.body,
          author: r.follower?.display_name ?? 'Reisende',
          from_traveler: !!r.author_profile_id,
          is_private: r.visibility === 'private',
          created_at: r.created_at,
        })),
    }
  })

  let subscription = null
  if (follower) {
    const { data } = await supabase
      .from('follower_subscriptions')
      .select('frequency, status')
      .eq('follower_id', follower.id)
      .eq('trip_id', link.trip_id)
      .eq('channel', 'email')
      .maybeSingle()
    subscription = data ? { ...data, email: follower.email } : null
  }

  return {
    trip,
    follower: follower ? { display_name: follower.display_name } : null,
    subscription,
    posts: out,
    route: route ?? [],
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Nur POST' }, 405)

  try {
    const body = await req.json()
    const link = await getLink(body.token)

    switch (body.action) {
      case 'feed':
        return json(await feed(link, body.device))

      case 'join': {
        const name = String(body.name ?? '').trim().slice(0, 40)
        if (!name || typeof body.device !== 'string' || body.device.length < 20) throw new HttpError(400, 'Name fehlt.')
        const hash = await sha256(`${link.id}:${body.device}`)
        const { error } = await supabase
          .from('followers')
          .upsert({ share_link_id: link.id, display_name: name, device_token_hash: hash }, { onConflict: 'device_token_hash' })
        if (error) throw new HttpError(500, error.message)
        return json({ ok: true })
      }

      case 'react': {
        const f = await requireFollower(link, body.device)
        await requirePost(link, body.post_id)
        if (!EMOJIS.includes(body.emoji)) throw new HttpError(400, 'Unbekanntes Emoji.')
        const { data: existing } = await supabase
          .from('reactions')
          .select('id')
          .eq('post_id', body.post_id)
          .eq('follower_id', f.id)
          .eq('emoji', body.emoji)
          .maybeSingle()
        if (existing) await supabase.from('reactions').delete().eq('id', existing.id)
        else await supabase.from('reactions').insert({ post_id: body.post_id, follower_id: f.id, emoji: body.emoji })
        return json({ ok: true })
      }

      case 'reply': {
        const f = await requireFollower(link, body.device)
        const post = await requirePost(link, body.post_id)
        if (!post.replies_enabled) throw new HttpError(403, 'Antworten sind hier ausgeschaltet.')
        const text = String(body.body ?? '').trim()
        if (!text || text.length > 500) throw new HttpError(400, 'Antwort muss 1–500 Zeichen lang sein.')
        const { error } = await supabase.from('replies').insert({
          post_id: body.post_id,
          follower_id: f.id,
          body: text,
          visibility: body.private ? 'private' : 'public',
        })
        if (error) throw new HttpError(500, error.message)
        return json({ ok: true })
      }

      case 'vote': {
        const f = await requireFollower(link, body.device)
        const { data: option } = await supabase
          .from('poll_options')
          .select('id, poll:polls!poll_options_poll_id_fkey(id, status, closes_at, post:posts(trip_id))')
          .eq('id', String(body.option_id))
          .maybeSingle()
        // deno-lint-ignore no-explicit-any
        const poll = (option as any)?.poll
        if (!option || !poll || poll.post?.trip_id !== link.trip_id) throw new HttpError(404, 'Option nicht gefunden.')
        if (poll.status !== 'open' || (poll.closes_at && Date.parse(poll.closes_at) < Date.now()))
          throw new HttpError(409, 'Die Abstimmung ist beendet.')
        const { error } = await supabase
          .from('votes')
          .upsert({ poll_id: poll.id, option_id: option.id, follower_id: f.id }, { onConflict: 'poll_id,follower_id' })
        if (error) throw new HttpError(500, error.message)
        return json({ ok: true })
      }

      case 'subscribe': {
        const f = await requireFollower(link, body.device)
        const email = String(body.email ?? '').trim().toLowerCase()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'E-Mail-Adresse ungültig.')
        if (!FREQUENCIES.includes(body.frequency)) throw new HttpError(400, 'Frequenz ungültig.')
        await supabase.from('followers').update({ email }).eq('id', f.id)
        const { error } = await supabase.from('follower_subscriptions').upsert(
          { follower_id: f.id, trip_id: link.trip_id, channel: 'email', frequency: body.frequency, status: 'pending' },
          { onConflict: 'follower_id,trip_id,channel' },
        )
        if (error) throw new HttpError(500, error.message)
        // Double-Opt-in-Mail folgt, sobald ein Mailversand (z.B. Resend) eingerichtet ist.
        return json({ ok: true, status: 'pending' })
      }

      case 'unsubscribe': {
        const f = await requireFollower(link, body.device)
        await supabase
          .from('follower_subscriptions')
          .update({ status: 'unsubscribed' })
          .eq('follower_id', f.id)
          .eq('trip_id', link.trip_id)
        return json({ ok: true })
      }

      default:
        throw new HttpError(400, 'Unbekannte Aktion.')
    }
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status)
    console.error(e)
    return json({ error: 'Interner Fehler' }, 500)
  }
})
