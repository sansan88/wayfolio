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

const RECAP = `Aufgabe: Fasse die Updates seit dem letzten Beitrag zu EINEM neuen Beitrag zusammen – ein Rückblick auf diese Tage, chronologisch erzählt, als Vorlage, die die Reisenden danach selbst bearbeiten.
- Nutze nur, was in den Updates steht (Orte, Daten, Texte) und was auf den mitgeschickten Fotos zu sehen ist.
- Verbinde die Stationen zu einer kleinen Geschichte statt einer Liste. Nenne die Orte, aber zähle nicht jedes Datum auf.
- Länge: etwa 100 bis 220 Wörter, 2 bis 4 kurze Absätze.`

// Überarbeiten eines vorhandenen Texts (Action Sheet in der App)
const EDITS: Record<string, string> = {
  proofread: `Aufgabe: Lies den vorhandenen Text Korrektur. Korrigiere nur Rechtschreibung, Grammatik, Zeichensetzung und Tippfehler (Schweizer Rechtschreibung, «ss» statt «ß»). Lass Wortwahl, Ton, Aufbau, Absätze, Emojis und Länge sonst unverändert. Den Titel nur korrigieren, nicht umschreiben; ist keiner da, bleibt er leer.`,
  shorten: `Aufgabe: Kürze den vorhandenen Text auf etwa die Hälfte. Behalte die wichtigsten Momente, die Stimme und die Wir-/Ich-Form. Nichts Neues hinzufügen. Titel beibehalten, ausser er passt nicht mehr.`,
  lengthen: `Aufgabe: Mach den vorhandenen Text etwa anderthalbmal so lang. Vertiefe Stimmung, Sinneseindrücke und Gedanken zu dem, was schon dasteht oder auf den Fotos zu sehen ist. Erfinde keine neuen Ereignisse, Namen oder Orte. Stimme und Form beibehalten. Titel beibehalten, ausser er passt nicht mehr.`,
  rewrite: `Aufgabe: Überarbeite den vorhandenen Text nach dem Wunsch der Reisenden (siehe «Änderungswunsch»). Ändere nur, was der Wunsch verlangt, und halte dich an alle Regeln oben. Erfinde keine Fakten.`,
}

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

  // Nur mit Einwilligung (Hinweis in der App, gespeichert im Profil)
  const { data: profile } = await userClient.from('profiles').select('ai_enabled_at').eq('id', user.id).maybeSingle()
  if (!profile?.ai_enabled_at)
    return json({ error: 'Bitte zuerst die KI-Funktionen bestätigen.', code: 'consent_required' }, 403)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Ungültige Anfrage' }, 400)
  }

  const mode = body.mode === 'recap' ? 'recap' : 'post'
  const action = typeof body.action === 'string' && body.action in EDITS ? body.action : null
  const instruction = clip(body.instruction, 500)
  if (action === 'rewrite' && !instruction) return json({ error: 'Schreib kurz, was Claude ändern soll.' }, 400)
  const tripId = clip(body.tripId, 64)
  const notes = clip(body.notes, 3000)
  const title = clip(body.title, 200)
  const place = clip(body.place, 200)
  const when = clip(body.when, 80)
  let tz = clip(body.tz, 64) || 'Europe/Zurich'
  try {
    new Intl.DateTimeFormat('de-CH', { timeZone: tz })
  } catch {
    tz = 'Europe/Zurich'
  }
  // Korrekturlesen und Kürzen brauchen keine Fotos
  const wantsImages = action !== 'proofread' && action !== 'shorten'
  const images = (wantsImages && Array.isArray(body.images) ? (body.images as ImageIn[]) : [])
    .filter((i) => typeof i.data === 'string' && (i.data as string).length < MAX_IMAGE_BYTES)
    .slice(0, MAX_IMAGES)
    .map((i) => ({
      data: i.data as string,
      mediaType: ['image/jpeg', 'image/png', 'image/webp'].includes(String(i.mediaType)) ? String(i.mediaType) : 'image/jpeg',
    }))

  if (!tripId) return json({ error: 'Reise fehlt' }, 400)
  if (action && !notes) return json({ error: 'Es gibt noch keinen Text zum Überarbeiten.' }, 400)
  if (mode === 'post' && !notes && !images.length && !title) return json({ error: 'Schreib ein paar Stichworte oder füge Fotos hinzu.' }, 400)

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
  // Im Rückblick nur klassische Beiträge, damit die Check-ins nicht doppelt vorkommen
  const { data: recent } = await userClient
    .from('posts')
    .select('title, published_at, post_blocks!post_blocks_post_id_fkey(kind, text_content, position)')
    .eq('trip_id', tripId)
    .in('kind', mode === 'recap' ? ['feed', 'background'] : ['feed', 'background', 'route_update', 'story'])
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

  // Rückblick: alle Updates seit dem letzten klassischen Beitrag
  let recap = ''
  if (mode === 'recap') {
    const { data: last } = await userClient
      .from('posts')
      .select('published_at')
      .eq('trip_id', tripId)
      .in('kind', ['feed', 'background'])
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    let q = userClient
      .from('posts')
      .select('title, kind, published_at, checkins(place_name), post_blocks!post_blocks_post_id_fkey(kind, text_content, position, media(storage_path, variants))')
      .eq('trip_id', tripId)
      .in('kind', ['route_update', 'story'])
      .not('published_at', 'is', null)
      .order('published_at', { ascending: true })
      .limit(40)
    if (last?.published_at) q = q.gt('published_at', last.published_at)
    const { data: updates } = await q
    if (!updates?.length)
      return json({ error: 'Seit dem letzten Beitrag gibt es keine neuen Check-ins. Erfasse zuerst ein paar Updates.' }, 400)

    type Blk = { kind: string; text_content: string | null; position: number; media: { storage_path: string; variants: Record<string, unknown> | null } | null }
    const photoPaths: string[] = []
    recap = updates
      .map((u) => {
        const blocks = ((u as { post_blocks?: Blk[] }).post_blocks ?? []).sort((a, b) => a.position - b.position)
        const text = blocks.filter((b) => b.kind === 'text' && b.text_content).map((b) => b.text_content).join(' ')
        const photo = blocks.find((b) => b.kind === 'photo' && b.media && !(b.media.variants as { route?: boolean } | null)?.route)
        if (photo?.media) photoPaths.push(String((photo.media.variants as { thumb?: string } | null)?.thumb ?? photo.media.storage_path))
        const place = (u as { checkins?: { place_name: string | null } | null }).checkins?.place_name ?? u.title ?? ''
        const date = new Date(u.published_at as string).toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'long', timeZone: tz })
        return `- ${date}${place ? ` · ${place}` : ''}${text ? `: ${text.slice(0, 400)}` : ''}`
      })
      .join('\n')

    // Bis zu vier Fotos, über den Zeitraum verteilt
    const step = Math.max(1, Math.ceil(photoPaths.length / MAX_IMAGES))
    for (const path of photoPaths.filter((_, i) => i % step === 0).slice(0, MAX_IMAGES)) {
      const { data: file } = await admin.storage.from('media').download(path)
      if (!file || file.size > 900_000) continue
      const bytes = new Uint8Array(await file.arrayBuffer())
      let bin = ''
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
      images.push({ data: btoa(bin), mediaType: 'image/jpeg' })
    }
  }

  const facts = [
    `Reise: ${trip.title}${trip.description ? ` – ${String(trip.description).slice(0, 300)}` : ''}`,
    place && `Ort: ${place}`,
    when && `Zeitpunkt: ${when}`,
    !action && title && `Gewünschter Titel oder Thema: ${title}`,
    action
      ? `Vorhandener Titel: ${title || '(keiner)'}\n\nVorhandener Text:\n${notes}${action === 'rewrite' ? `\n\nÄnderungswunsch: ${instruction}` : ''}`
      : mode === 'recap'
      ? `Updates seit dem letzten Beitrag (chronologisch):\n${recap}${notes ? `\n\nZusätzliche Stichworte:\n${notes}` : ''}`
      : notes
        ? `Stichworte der Reisenden:\n${notes}`
        : 'Keine Stichworte – schreibe anhand der Fotos.',
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
    body: JSON.stringify({ model: MODEL, max_tokens: 1500, system: action ? `${SYSTEM}\n\n${EDITS[action]}` : mode === 'recap' ? `${SYSTEM}\n\n${RECAP}` : SYSTEM, messages: [{ role: 'user', content }] }),
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
