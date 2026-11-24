// Little Footnotes – Newsletter-Versand
// POST mit Header «x-newsletter-secret» (Wert im Vault, Cron alle 15 Min.): verschickt fällige Abos
//   – «instant»: sobald neue Beiträge da sind, «weekly»: höchstens alle 7 Tage eine Zusammenfassung.
// POST {"unsubscribe": "<token>"}: Abmelden per Link aus der Mail (ohne Login).
// Versand über SMTP (Infomaniak); Zugangsdaten nur als Secrets SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.
import { createClient } from 'npm:@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6.9.16'

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

const APP = 'https://littlefootnotes.app'
const FROM = Deno.env.get('NEWSLETTER_FROM') ?? 'Little Footnotes <team@littlefootnotes.app>'
const MAX_POSTS = 20
const IMAGE_DAYS = 30

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-newsletter-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// ---------------------------------------------------------------------------
// Inhalte
// ---------------------------------------------------------------------------
interface Due {
  id: string
  email: string
  name: string
  trip_id: string
  trip_title: string
  token: string | null
  frequency: 'instant' | 'weekly'
  since: string
  unsubscribe_token: string
  delay_minutes: number
}

interface Block {
  kind: string
  position: number
  text_content: string | null
  url: string | null
  media: { storage_path: string; variants: Record<string, unknown> | null } | null
}

interface Post {
  id: string
  kind: string
  title: string | null
  published_at: string
  checkins: { place_name: string | null } | null
  post_blocks: Block[]
}

interface MailPost {
  id: string
  title: string
  place: string | null
  when: string
  text: string
  image: string | null
  links: { label: string; url: string }[]
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'long', timeZone: Deno.env.get('NEWSLETTER_TZ') ?? 'Europe/Zurich' })

const linkLabel = (url: string, title: string | null) => {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (/instagram\.com$/.test(host)) {
      const first = u.pathname.split('/').filter(Boolean)[0]
      if (first && !['p', 'reel', 'stories'].includes(first)) return `@${first}`
    }
    // Google-Maps-Orte: «Name 19 Strasse, Ort …» → «Name»
    const first = title?.split(',')[0].trim()
    const name = first?.split(/\s\d+[a-z]?\s/i)[0].trim()
    return (name && name.length >= 3 ? name : first) || host
  } catch {
    return title ?? 'Link'
  }
}

const loadPosts = async (d: Due, cutoff: string): Promise<MailPost[]> => {
  const { data, error } = await admin
    .from('posts')
    .select(
      'id, kind, title, published_at, checkins(place_name), post_blocks!post_blocks_post_id_fkey(kind, position, text_content, url, media(storage_path, variants))',
    )
    .eq('trip_id', d.trip_id)
    .eq('visibility', 'followers')
    .not('published_at', 'is', null)
    .lte('published_at', cutoff)
    .or(`published_at.gt.${d.since},created_at.gt.${d.since}`)
    .order('published_at', { ascending: true })
    .limit(MAX_POSTS)
  if (error) throw new Error(error.message)
  const out: MailPost[] = []
  for (const p of (data ?? []) as unknown as Post[]) {
    const blocks = [...(p.post_blocks ?? [])].sort((a, b) => a.position - b.position)
    const text = blocks
      .filter((b) => b.kind === 'text' && b.text_content && !/^\d+([.,]\d+)?\s*km\b/i.test(b.text_content))
      .map((b) => b.text_content!.trim())
      .join('\n\n')
    const photo = blocks.find((b) => b.kind === 'photo' && b.media && !(b.media.variants as { route?: boolean } | null)?.route)
      ?? blocks.find((b) => b.kind === 'photo' && b.media)
    let image: string | null = null
    if (photo?.media) {
      const { data: signed } = await admin.storage.from('media').createSignedUrl(photo.media.storage_path, IMAGE_DAYS * 86400)
      image = signed?.signedUrl ?? null
    }
    const place = p.checkins?.place_name ?? null
    out.push({
      id: p.id,
      title: p.title?.trim() || place || 'Update',
      place: place && place !== p.title ? place : null,
      when: fmtDate(p.published_at),
      text,
      image,
      links: blocks.filter((b) => b.kind === 'link' && b.url).map((b) => ({ url: b.url!, label: linkLabel(b.url!, b.text_content) })),
    })
  }
  return out
}

// ---------------------------------------------------------------------------
// Mail im Stil der Startseite (Sand, Serifen-Titel, Mint-Knopf mit dunklem Rand)
// ---------------------------------------------------------------------------
const C = {
  bg: '#fbf6ee',
  card: '#fffdf9',
  line: '#e6d8c4',
  ink: '#2b2420',
  muted: '#74675d',
  mint: '#11a683',
  mintText: '#0e9474',
  ochre: '#dda94b',
}
const SERIF = "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif"
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

const paragraphs = (t: string) =>
  t
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px;font:16px/1.6 ${SANS};color:${C.ink};">${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('')

const button = (href: string, label: string) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 0;"><tr><td style="border-radius:999px;background:${C.mint};border:2px solid ${C.ink};">
    <a href="${href}" style="display:inline-block;padding:12px 24px;font:600 16px ${SANS};color:#ffffff;text-decoration:none;">${esc(label)}</a>
  </td></tr></table>`

const renderMail = (d: Due, posts: MailPost[]) => {
  const tripUrl = d.token ? `${APP}/t/${d.token}` : `${APP}/abos`
  const settings = `${APP}/abos`
  const unsubscribe = `${APP}/abmelden/${d.unsubscribe_token}`
  const intro =
    d.frequency === 'weekly'
      ? `Hallo ${esc(d.name)}, hier ist die Woche von «${esc(d.trip_title)}» in ${posts.length === 1 ? 'einem Update' : `${posts.length} Updates`}.`
      : `Hallo ${esc(d.name)}, es gibt ${posts.length === 1 ? 'ein neues Update' : `${posts.length} neue Updates`} von «${esc(d.trip_title)}».`

  const cards = posts
    .map((p) => {
      const link = d.token ? `${APP}/t/${d.token}#p-${p.id}` : tripUrl
      const meta = [p.place, p.when].filter(Boolean).map((x) => esc(x!)).join(' · ')
      const links = p.links.length
        ? `<p style="margin:4px 0 12px;font:14px/1.6 ${SANS};">${p.links
            .map((l) => `<a href="${esc(l.url)}" style="color:${C.mintText};text-decoration:none;font-weight:600;">↗ ${esc(l.label)}</a>`)
            .join('&nbsp;&nbsp; ')}</p>`
        : ''
      return `
      <tr><td style="padding:0 0 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.card};border:1.5px solid ${C.line};border-radius:20px;overflow:hidden;">
          ${p.image ? `<tr><td><a href="${link}"><img src="${esc(p.image)}" width="560" alt="" style="display:block;width:100%;max-width:560px;height:auto;border:0;border-radius:18px 18px 0 0;"></a></td></tr>` : ''}
          <tr><td style="padding:20px 22px 18px;">
            <p style="margin:0 0 4px;font:600 13px ${SANS};color:${C.mintText};letter-spacing:.02em;">${meta}</p>
            <h2 style="margin:0 0 10px;font:600 24px/1.2 ${SERIF};color:${C.ink};">${esc(p.title)}</h2>
            ${p.text ? paragraphs(p.text) : ''}
            ${links}
            <a href="${link}" style="font:600 14px ${SANS};color:${C.mintText};text-decoration:none;">Im Tagebuch ansehen →</a>
          </td></tr>
        </table>
      </td></tr>`
    })
    .join('')

  const html = `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>${esc(d.trip_title)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};">
<div style="display:none;max-height:0;overflow:hidden;">${esc(posts.map((p) => p.title).join(' · ')).slice(0, 140)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};">
<tr><td align="center" style="padding:28px 14px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
    <tr><td style="padding:0 4px 18px;">
      <span style="font:italic 600 20px ${SERIF};color:${C.ink};">Little Footnotes</span>
      <span style="float:right;font:20px ${SANS};">☀️</span>
    </td></tr>
    <tr><td style="padding:0 4px 22px;">
      <span style="display:inline-block;padding:4px 12px;border:1.5px dashed ${C.mint};border-radius:999px;font:700 12px ${SANS};letter-spacing:.06em;text-transform:uppercase;color:${C.mintText};">${d.frequency === 'weekly' ? 'Wochenrückblick' : 'Neue Fussnoten'}</span>
      <h1 style="margin:14px 0 10px;font:600 32px/1.1 ${SERIF};color:${C.ink};">${esc(d.trip_title)}</h1>
      <p style="margin:0;font:16px/1.6 ${SANS};color:${C.muted};">${intro}</p>
    </td></tr>
    ${cards}
    <tr><td align="center" style="padding:4px 0 26px;">${button(tripUrl, 'Ganze Reise ansehen')}</td></tr>
    <tr><td style="padding:18px 4px 0;border-top:1.5px dashed ${C.line};font:13px/1.7 ${SANS};color:${C.muted};">
      Du bekommst diese Mail, weil du «${esc(d.trip_title)}» ${d.frequency === 'weekly' ? 'wöchentlich' : 'bei jedem Beitrag'} abonniert hast.<br>
      <a href="${settings}" style="color:${C.mintText};">Abo-Einstellungen</a> · <a href="${unsubscribe}" style="color:${C.mintText};">Abmelden</a><br>
      Made with ❤️ and some ☕️ · <a href="${APP}" style="color:${C.muted};">littlefootnotes.app</a>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`

  const text = [
    d.trip_title,
    '',
    intro.replace(/&[a-z]+;/g, ''),
    '',
    ...posts.flatMap((p) => [`${p.title}${p.place ? ` – ${p.place}` : ''} (${p.when})`, p.text, ...p.links.map((l) => `${l.label}: ${l.url}`), '']),
    `Ganze Reise: ${tripUrl}`,
    `Einstellungen: ${settings}`,
    `Abmelden: ${unsubscribe}`,
  ].join('\n')

  const subject =
    d.frequency === 'weekly'
      ? `${d.trip_title}: Wochenrückblick`
      : posts.length === 1
        ? `${d.trip_title}: ${posts[0].title}`
        : `${d.trip_title}: ${posts.length} neue Updates`

  return { html, text, subject, unsubscribe }
}

// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Nur POST' }, 405)
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    /* leer */
  }

  // Abmelden per Link aus der Mail
  if (typeof body.unsubscribe === 'string') {
    const { data, error } = await admin.rpc('newsletter_unsubscribe', { p_token: body.unsubscribe.slice(0, 100) })
    if (error) return json({ error: 'Abmelden hat nicht geklappt.' }, 500)
    if (!data) return json({ error: 'Dieser Abmelde-Link ist ungültig.' }, 404)
    return json({ ok: true, trip: data })
  }

  // Versand nur mit Geheimnis: liegt im Vault der Datenbank (vom Cron-Job mitgeschickt)
  const given = req.headers.get('x-newsletter-secret') ?? ''
  const { data: allowed } = given ? await admin.rpc('newsletter_check_secret', { p_secret: given }) : { data: false }
  if (!allowed) return json({ error: 'Nicht erlaubt' }, 401)
  const dryRun = body.dryRun === true
  const pass = Deno.env.get('SMTP_PASS') ?? ''
  if (!pass && !dryRun) return json({ error: 'SMTP_PASS fehlt' }, 500)

  const transport = nodemailer.createTransport({
    host: Deno.env.get('SMTP_HOST') ?? 'mail.infomaniak.com',
    port: Number(Deno.env.get('SMTP_PORT') ?? 587),
    secure: Number(Deno.env.get('SMTP_PORT') ?? 587) === 465,
    auth: { user: Deno.env.get('SMTP_USER') ?? 'team@littlefootnotes.app', pass },
  })

  const { data: due, error } = await admin.rpc('newsletter_due', { p_limit: 40 })
  if (error) return json({ error: error.message }, 500)

  const results: { id: string; ok: boolean; posts?: number; error?: string; subject?: string; html?: string }[] = []
  for (const d of (due ?? []) as Due[]) {
    try {
      // Stand der Mail: alles bis jetzt (abzüglich Standort-Verzögerung der Reise)
      const cutoff = new Date(Date.now() - d.delay_minutes * 60_000).toISOString()
      const posts = await loadPosts(d, cutoff)
      if (!posts.length) {
        results.push({ id: d.id, ok: true, posts: 0 })
        continue
      }
      const mail = renderMail(d, posts)
      if (!dryRun) {
        await transport.sendMail({
          from: FROM,
          to: d.email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          headers: {
            'List-Unsubscribe': `<${mail.unsubscribe}>`,
          },
        })
        await admin.from('trip_subscriptions').update({ last_sent_at: cutoff }).eq('id', d.id)
      }
      results.push({ id: d.id, ok: true, posts: posts.length, ...(dryRun ? { subject: mail.subject, html: mail.html } : {}) })
    } catch (e) {
      console.error('Newsletter', d.id, e)
      results.push({ id: d.id, ok: false, error: (e as Error).message })
    }
  }
  return json({ sent: results.filter((r) => r.ok && r.posts).length, results })
})
