// Little Footnotes – Beitrag mit Claude entwerfen
// Nur für angemeldete Reisende (JWT-Prüfung aktiv). Aus Stichworten, Ort, Datum und
// optionalen Fotos entsteht ein Entwurf (Titel + Text). Der API-Key liegt nur hier als
// Secret ANTHROPIC_API_KEY und gelangt nie in die App.
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const admin = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

const MODEL = Deno.env.get('AI_MODEL') ?? 'claude-sonnet-5-5'
const DAILY_LIMIT = Number(Deno.env.get('AI_DAILY_LIMIT') ?? 40)
const MAX_IMAGES = 4
const MAX_IMAGE_BYTES = 1_200_000 // Base64-Länge pro Bild

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const clip = (s: unknown, n: number) => (typeof s === 'string' ? s.trim().slice(0, n) : '')

const SYSTEM = `Du schreibst Beiträge für «Little Footnotes», ein privates Reisetagebuch. Reisende teilen damit Momente ihrer Reise mit Familie und Freunden – bewusst, ruhig, persönlich, ohne Social-Media-Ton.

So schreibst du:
- Deutsch mit Schweizer Rechtschreibung: nie «ß», immer «ss». Anführungszeichen «so».
- Aus Sicht der Reisenden in der Wir-Form (oder Ich-Form, wenn die Stichworte so geschrieben sind), so als würden sie selbst nach Hause schreiben.
- Warm, lebendig und konkret: Sinneseindrücke, kleine Details, ein Gedanke oder Gefühl. Kein Werbe- oder Reiseführer-Ton, keine Floskeln («atemberaubend», «unvergesslich», «ein Traum»), keine Hashtags.
- Höchstens ein bis zwei passende Emojis, gern keines.
- Erfinde keine Fakten: keine Namen, Erlebnisse, Zahlen oder Orte, die nicht in den Stichworten, im Ort oder sichtbar auf den Fotos stehen. Was auf den Fotos zu sehen ist, darfst du beschreiben. Erwähne die Fotos aber nie als Fotos («auf dem Bild», «das Foto zeigt») – erzähle, was ihr erlebt und gesehen habt.
- Länge: etwa 60 bis 160 Wörter, in 1 bis 3 kurzen Absätzen. Wenn die Stichworte sehr knapp sind, lieber kürzer.
- Titel: kurz (2 bis 6 Wörter), ohne Punkt am Ende, kein Ortsname allein.
- Passe dich dem Stil früherer Beiträge an, falls welche mitgegeben werden, ohne sie zu wiederholen.

Antworte ausschliesslich mit JSON in dieser Form, ohne weiteren Text:
{"title": "…", "text": "…"}`

interface ImageIn {
  data?: unknown
  mediaType?: unknown
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Nur POST' }, 405)

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return json({ error: 'Der Claude-API-Key fehlt auf dem Server.' }, 500)

  // Wer fragt an? Die Reise wird mit den Rechten dieser Person gelesen (RLS).
  const auth = req.headers.get('Authorization') ?? ''
  const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
    auth: { persistSession: false },
    global: { headers: { Authorization: auth } },
  })
  const { data: userData } = await userClient.auth.getUser()
  const user = userData?.user
  if (!user) return json({ error: 'Bitte anmelden.' }, 401)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Ungültige Anfrage' }, 400)
  }

  const tripId = clip(body.tripId, 64)
  const notes = clip(body.notes, 3000)
  const title = clip(body.title, 200)
  const place = clip(body.place, 200)
  const when = clip(body.when, 80)
  const images = (Array.isArray(body.images) ? (body.images as ImageIn[]) : [])
    .filter((i) => typeof i.data === 'string' && (i.data as string).length < MAX_IMAGE_BYTES)
    .slice(0, MAX_IMAGES)
    .map((i) => ({
      data: i.data as string,
      mediaType: ['image/jpeg', 'image/png', 'image/webp'].includes(String(i.mediaType)) ? String(i.mediaType) : 'image/jpeg',
    }))

  if (!tripId) return json({ error: 'Reise fehlt' }, 400)
  if (!notes && !images.length && !title) return json({ error: 'Schreib ein paar Stichworte oder füge Fotos hinzu.' }, 400)

  const { data: trip } = await userClient.from('trips').select('id, title, description').eq('id', tripId).maybeSingle()
  if (!trip) return json({ error: 'Reise nicht gefunden' }, 404)

  // Begrenzung pro Person und Tag
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { count } = await admin
    .from('ai_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', since)
  if ((count ?? 0) >= DAILY_LIMIT) return json({ error: 'Für heute sind genug Entwürfe erstellt. Morgen geht es weiter.' }, 429)

  // Frühere Beiträge als Stilvorlage (nur Titel und Textanfang)
  const { data: recent } = await userClient
    .from('posts')
    .select('title, published_at, post_blocks(kind, text_content, position)')
    .eq('trip_id', tripId)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(5)
  const examples = (recent ?? [])
    .map((p) => {
      const blocks = ((p as { post_blocks?: { kind: string; text_content: string | null; position: number }[] }).post_blocks ?? [])
        .filter((b) => b.kind === 'text' && b.text_content)
        .sort((a, b) => a.position - b.position)
      const text = blocks.map((b) => b.text_content).join('\n').slice(0, 500)
      return text ? `Titel: ${p.title ?? '–'}\n${text}` : ''
    })
    .filter(Boolean)
    .slice(0, 3)

  const facts = [
    `Reise: ${trip.title}${trip.description ? ` – ${String(trip.description).slice(0, 300)}` : ''}`,
    place && `Ort: ${place}`,
    when && `Zeitpunkt: ${when}`,
    title && `Gewünschter Titel oder Thema: ${title}`,
    notes ? `Stichworte der Reisenden:\n${notes}` : 'Keine Stichworte – schreibe anhand der Fotos.',
    images.length ? `Dazu ${images.length} Foto(s), siehe oben.` : '',
    examples.length ? `Frühere Beiträge dieser Reise (nur als Stilvorlage):\n\n${examples.join('\n\n---\n\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  const content = [
    ...images.map((i) => ({ type: 'image', source: { type: 'base64', media_type: i.mediaType, data: i.data } })),
    { type: 'text', text: `${facts}\n\nSchreibe jetzt den Beitrag als JSON.` },
  ]

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 1200, system: SYSTEM, messages: [{ role: 'user', content }] }),
  })

  if (!res.ok) {
    console.error('Claude API', res.status, (await res.text()).slice(0, 500))
    return json({ error: 'Claude ist gerade nicht erreichbar. Bitte später nochmals versuchen.' }, 502)
  }

  const out = await res.json()
  const raw: string = (out.content ?? []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('')
  let draft: { title?: string; text?: string } = {}
  try {
    const m = raw.match(/\{[\s\S]*\}/)
    draft = JSON.parse(m ? m[0] : raw)
  } catch {
    draft = { title: '', text: raw.trim() }
  }
  const fix = (s: unknown) => (typeof s === 'string' ? s.replace(/ß/g, 'ss').trim() : '')

  await admin.from('ai_usage').insert({ user_id: user.id, trip_id: tripId })

  return json({ title: fix(draft.title), text: fix(draft.text) })
})
