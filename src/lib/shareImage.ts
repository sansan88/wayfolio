import { type ShareImageSymbol, SYMBOLS } from './shareSymbols'
import { supabase } from './supabase'
import { canvasToJpeg, type FeedPost } from './updates'

export type { ShareImageSymbol } from './shareSymbols'

/**
 * Bild eines Beitrags für Instagram (Story oder Beitrag) im Stil der Produktseite:
 * Sand, Serif, Mint, gestrichelte Etikette, Sonne. Wird komplett im Browser gezeichnet –
 * keine Daten verlassen das Gerät, bis die Reisenden selbst teilen.
 */
export type ShareImageFormat = 'story' | 'post'

export const SHARE_IMAGE_SIZE: Record<ShareImageFormat, { w: number; h: number }> = {
  story: { w: 1080, h: 1920 }, // 9:16
  post: { w: 1080, h: 1350 }, // 4:5, grösstes Hochformat im Instagram-Feed
}

/** Farbdesign des Bildes. «sand» entspricht der Startseite (LandingPage.css), «nacht» ihrem dunklen Design. */
export type ShareImageTheme = 'foto' | 'sand' | 'nacht' | 'mint' | 'terrakotta' | 'salbei'

interface Palette {
  label: string
  bg: string
  tint: string
  card: string
  line: string
  ink: string
  muted: string
  /** Etikett und Ort */
  accent: string
  sun: string
  /** zweite Farbe für einen Verlauf von oben (bg) nach unten (bg2) */
  bg2?: string
}

export const SHARE_IMAGE_THEMES: Record<ShareImageTheme, Palette> = {
  // Platzhalter: die echten Farben entstehen beim Zeichnen aus dem gewählten Foto (photoPalette)
  foto: { label: 'Foto', bg: '#3a2e28', bg2: '#141210', tint: '#241d18', card: '#fffdf9', line: '#5a4a40', ink: '#f7f1e8', muted: '#c9bcae', accent: '#f2c48d', sun: '#f2c48d' },
  sand: { label: 'Sand', bg: '#fbf6ee', tint: '#f3e8d8', card: '#fffdf9', line: '#e6d8c4', ink: '#2b2420', muted: '#74675d', accent: '#0e9474', sun: '#dda94b' },
  nacht: { label: 'Nacht', bg: '#141210', tint: '#241d18', card: '#f4ebdf', line: '#40342a', ink: '#f4ebdf', muted: '#b5a797', accent: '#5ee0b5', sun: '#e6bb6a' },
  mint: { label: 'Mint', bg: '#e4f4ee', tint: '#cfeadf', card: '#fffdf9', line: '#b9ddd0', ink: '#10372c', muted: '#4f7268', accent: '#0e9474', sun: '#dda94b' },
  terrakotta: { label: 'Terrakotta', bg: '#f6e3d7', tint: '#efd2c0', card: '#fffdf9', line: '#e3bfa9', ink: '#3a2219', muted: '#80594a', accent: '#b4573a', sun: '#dda94b' },
  salbei: { label: 'Salbei', bg: '#e9eee3', tint: '#d9e2cf', card: '#fffdf9', line: '#c9d4bd', ink: '#26301f', muted: '#5e6b55', accent: '#5f7a52', sun: '#dda94b' },
}

/** Aktuelles Design; wird in renderShareImage direkt vor dem (synchronen) Zeichnen gesetzt. */
let C: Palette = SHARE_IMAGE_THEMES.sand

// ---- Farben aus dem Foto ------------------------------------------------------------------------------------

type Hsl = [number, number, number]

const rgbToHsl = (r: number, g: number, b: number): Hsl => {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h / 6, s, l]
}

const hslToHex = ([h, s, l]: Hsl) => {
  const f = (n: number) => {
    const k = (n + h * 12) % 12
    const a = s * Math.min(l, 1 - l)
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/** Mittlere Farbe einer Bildzone; kräftige Pixel zählen mehr, damit der Verlauf nicht grau wird. */
const zoneColor = (data: Uint8ClampedArray, from: number, to: number): { hsl: Hsl; light: number } => {
  let r = 0
  let g = 0
  let b = 0
  let wSum = 0
  let lSum = 0
  let n = 0
  for (let i = from; i < to; i += 4) {
    const [, sat, l] = rgbToHsl(data[i], data[i + 1], data[i + 2])
    const w = 0.15 + sat * (1 - Math.abs(l - 0.5) * 1.6)
    r += data[i] * w
    g += data[i + 1] * w
    b += data[i + 2] * w
    wSum += w
    lSum += l
    n++
  }
  return { hsl: rgbToHsl(r / wSum, g / wSum, b / wSum), light: lSum / Math.max(1, n) }
}

/**
 * Design aus dem Foto: Farbverlauf aus der oberen und unteren Bildhälfte. Ein dunkles Foto ergibt einen dunklen
 * Hintergrund mit heller Schrift, ein helles einen hellen mit dunkler Schrift – lesbar bleibt es so immer.
 */
const photoPalette = (img: ImageBitmap): Palette => {
  const size = 24
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const x = c.getContext('2d', { willReadFrequently: true })!
  x.drawImage(img, 0, 0, size, size)
  const data = x.getImageData(0, 0, size, size).data
  c.width = 0
  c.height = 0
  const half = (size * size * 4) / 2
  const top = zoneColor(data, 0, half)
  const bottom = zoneColor(data, half, data.length)
  const dark = (top.light + bottom.light) / 2 < 0.55
  const tone = ([h, s]: Hsl, l: number, maxS: number): string => hslToHex([h, Math.min(s, maxS), l])
  // Akzent mit etwas Farbe, auch wenn das Foto eher blass ist
  const strong = ([h, s]: Hsl, l: number): string => hslToHex([h, Math.min(Math.max(s, 0.5), 0.8), l])
  // Akzent: die kräftigere der beiden Farben
  const vivid = top.hsl[1] >= bottom.hsl[1] ? top.hsl : bottom.hsl
  return dark
    ? {
        label: 'Foto',
        bg: tone(top.hsl, 0.24, 0.5),
        bg2: tone(bottom.hsl, 0.1, 0.45),
        tint: tone(top.hsl, 0.18, 0.4),
        card: '#fffdf9',
        line: tone(top.hsl, 0.36, 0.35),
        ink: '#f7f1e8',
        muted: tone(top.hsl, 0.78, 0.25),
        accent: strong(vivid, 0.74),
        sun: tone(vivid, 0.7, 0.7),
      }
    : {
        label: 'Foto',
        bg: tone(top.hsl, 0.92, 0.55),
        bg2: tone(bottom.hsl, 0.82, 0.45),
        tint: tone(top.hsl, 0.86, 0.45),
        card: '#fffdf9',
        line: tone(top.hsl, 0.74, 0.35),
        ink: '#231d19',
        muted: tone(top.hsl, 0.36, 0.25),
        accent: strong(vivid, 0.34),
        sun: tone(vivid, 0.6, 0.7),
      }
}

/** #rrggbb → rgba() mit Deckkraft */
const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}
const SERIF = "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif"
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"

/** Fotos eines Beitrags, die als Motiv in Frage kommen (eigene Fotos zuerst, dann das Routenbild). */
export const sharePhotos = (post: FeedPost) => [
  ...post.blocks.filter((b) => b.kind === 'photo' && b.mediaUrl && !b.route),
  ...post.blocks.filter((b) => b.kind === 'photo' && b.mediaUrl && b.route),
]

/** Titel und Ort wie auf der Karte im Feed: eigener Titel vor Ort, ohne Titel ist die Ortschaft der Titel. */
export const shareHeadline = (post: FeedPost) => {
  const parts = post.place_name?.split(',').map((x) => x.trim()).filter(Boolean) ?? []
  const t = post.title?.trim()
  const ownTitle = t && t !== post.place_name?.trim() && t !== parts[0] ? t : null
  return {
    title: ownTitle ?? parts[0] ?? 'Unterwegs',
    place: ownTitle ? parts.join(', ') || null : parts.slice(1).join(', ') || null,
  }
}

/**
 * Foto für die Leinwand laden. Nicht über die signierte URL: Der Service Worker hat sie vom Feed her
 * als «opake» Antwort (ohne CORS) im Cache, und die lässt sich weder per fetch lesen noch zeichnen –
 * das Bild blieb dann leer. Darum direkt aus dem Speicher laden (anderer Pfad, mit Anmeldung).
 */
const loadImage = async (url: string): Promise<ImageBitmap | null> => {
  const blob = (await downloadFromStorage(url)) ?? (await fetchBlob(url))
  if (!blob) return null
  try {
    return await createImageBitmap(blob)
  } catch {
    return null
  }
}

const downloadFromStorage = async (signedUrl: string): Promise<Blob | null> => {
  try {
    const m = new URL(signedUrl).pathname.match(/\/storage\/v1\/object\/sign\/media\/(.+)$/)
    if (!m) return null
    const { data } = await supabase.storage.from('media').download(decodeURIComponent(m[1]))
    return data ?? null
  } catch {
    return null
  }
}

const fetchBlob = async (url: string): Promise<Blob | null> => {
  try {
    const res = await fetch(url, { cache: 'reload' })
    return res.ok ? await res.blob() : null
  } catch {
    return null
  }
}

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Zeilenumbruch mit «…», wenn der Platz nicht reicht. */
const wrap = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) => {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width <= maxWidth || !line) line = next
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  let last = kept[maxLines - 1]
  while (last && ctx.measureText(`${last} …`).width > maxWidth) last = last.split(' ').slice(0, -1).join(' ')
  kept[maxLines - 1] = `${last} …`
  return kept
}

const drawSunIn = (ctx: CanvasRenderingContext2D, color: string, cx: number, cy: number, r: number) => {
  ctx.save()
  ctx.fillStyle = alpha(color, 0.22)
  ctx.strokeStyle = alpha(color, 0.55)
  ctx.lineWidth = r * 0.08
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.lineCap = 'round'
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 1.3)
    ctx.lineTo(cx + Math.cos(a) * r * 1.65, cy + Math.sin(a) * r * 1.65)
    ctx.stroke()
  }
  ctx.restore()
}

// ---- Symbole oben rechts --------------------------------------------------------------------------------------

/** Symbol zentriert bei (cx, cy); `size` = Kantenlänge. */
const drawSymbol = (ctx: CanvasRenderingContext2D, symbol: ShareImageSymbol, color: string, cx: number, cy: number, size: number) => {
  if (symbol === 'keins') return
  if (symbol === 'sonne') return drawSunIn(ctx, color, cx, cy, size / 3.4)
  const def = SYMBOLS[symbol]
  const scale = size / def.grid
  ctx.save()
  ctx.translate(cx - size / 2, cy - size / 2)
  ctx.scale(scale, scale)
  // gleiche sichtbare Strichstärke in beiden Rastern
  ctx.lineWidth = def.grid === 24 ? 1.3 : 5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = alpha(color, 0.7)
  ctx.fillStyle = alpha(color, 0.22)
  for (const d of def.fill ?? []) {
    const path = new Path2D(d)
    ctx.fill(path)
    ctx.stroke(path)
  }
  // alle Linien als ein Pfad: Überkreuzungen werden so nicht dunkler
  const lines = new Path2D()
  for (const d of def.line ?? []) lines.addPath(new Path2D(d))
  ctx.stroke(lines)
  ctx.restore()
}

/** Kleine Vorschau eines Symbols für die Auswahl im Dialog (PNG als Data-URL). */
export const symbolPreview = (symbol: ShareImageSymbol, color: string, px = 96) => {
  const c = document.createElement('canvas')
  c.width = px
  c.height = px
  const ctx = c.getContext('2d')
  if (!ctx) return ''
  drawSymbol(ctx, symbol, color, px / 2, px / 2, symbol === 'sonne' ? px * 0.95 : px * 0.8)
  const url = c.toDataURL('image/png')
  c.width = 0
  c.height = 0
  return url
}

/** Gestricheltes Etikett wie «Open-Source-Reisetagebuch» auf der Startseite. */
const drawPill = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) => {
  ctx.save()
  ctx.font = `700 ${size}px ${SANS}`
  ctx.letterSpacing = `${size * 0.12}px`
  const padX = size * 0.9
  const h = size * 2.2
  const w = ctx.measureText(text).width + padX * 2
  roundRect(ctx, x, y, w, h, h / 2)
  ctx.fillStyle = alpha(C.accent, 0.1)
  ctx.fill()
  ctx.setLineDash([size * 0.4, size * 0.3])
  ctx.lineWidth = size * 0.09
  ctx.strokeStyle = C.accent
  ctx.stroke()
  ctx.fillStyle = C.accent
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + padX, y + h / 2 + size * 0.05)
  ctx.restore()
  return h
}

/** Foto im Polaroid-Rahmen, formatfüllend zugeschnitten. */
const drawPhoto = (ctx: CanvasRenderingContext2D, img: ImageBitmap, x: number, y: number, w: number, h: number) => {
  const pad = w * 0.028
  ctx.save()
  ctx.translate(x + w / 2, y + h / 2)
  ctx.rotate((-1.4 * Math.PI) / 180)
  ctx.translate(-w / 2, -h / 2)
  ctx.shadowColor = 'rgba(43, 36, 32, 0.18)'
  ctx.shadowBlur = w * 0.04
  ctx.shadowOffsetY = w * 0.012
  roundRect(ctx, 0, 0, w, h, w * 0.035)
  ctx.fillStyle = C.card
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.lineWidth = 2
  ctx.strokeStyle = C.line
  ctx.stroke()
  const iw = w - pad * 2
  const ih = h - pad * 2
  const scale = Math.max(iw / img.width, ih / img.height)
  const sw = iw / scale
  const sh = ih / scale
  roundRect(ctx, pad, pad, iw, ih, w * 0.02)
  ctx.clip()
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, pad, pad, iw, ih)
  ctx.restore()
}

/** Ohne Foto: der Anfang des Textes als Zitat auf einer Karte. */
const drawQuote = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, h: number) => {
  ctx.save()
  roundRect(ctx, x, y, w, h, w * 0.035)
  ctx.fillStyle = C.tint
  ctx.fill()
  ctx.setLineDash([14, 10])
  ctx.lineWidth = 3
  ctx.strokeStyle = C.line
  ctx.stroke()
  const size = Math.round(w * 0.06)
  ctx.font = `italic 400 ${size}px ${SERIF}`
  ctx.fillStyle = C.ink
  ctx.textBaseline = 'top'
  const lines = wrap(ctx, `«${text}»`, w * 0.82, Math.max(1, Math.floor((h * 0.8) / (size * 1.4))))
  const blockH = lines.length * size * 1.4
  lines.forEach((l, i) => ctx.fillText(l, x + w * 0.09, y + (h - blockH) / 2 + i * size * 1.4))
  ctx.restore()
}

export interface ShareImageOptions {
  format: ShareImageFormat
  /** Index in sharePhotos(post) */
  photoIndex?: number
  /** Reisetag (1 = erster Tag) */
  day?: number | null
  theme?: ShareImageTheme
  symbol?: ShareImageSymbol
}

/** Zeichnet das Bild und liefert es als JPEG. */
export const renderShareImage = async (post: FeedPost, { format, photoIndex = 0, day, theme = 'sand', symbol = 'sonne' }: ShareImageOptions): Promise<Blob> => {
  const { w: W, h: H } = SHARE_IMAGE_SIZE[format]
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Bild konnte nicht erzeugt werden.')

  const photos = sharePhotos(post)
  const photo = photos[photoIndex] ?? photos[0]
  const img = photo?.mediaUrl ? await loadImage(photo.mediaUrl) : null
  await document.fonts?.ready
  // ab hier synchron gezeichnet – ein paralleler Aufruf kann das Design nicht mehr wechseln
  C = theme === 'foto' ? (img ? photoPalette(img) : SHARE_IMAGE_THEMES.sand) : (SHARE_IMAGE_THEMES[theme] ?? SHARE_IMAGE_THEMES.sand)

  // Instagram überdeckt in Storys oben und unten je ca. 250 px – dort nur Dekoration
  const story = format === 'story'
  const M = 84
  const top = story ? 270 : 84
  const bottom = story ? H - 250 : H - 64

  if (C.bg2) {
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, C.bg)
    g.addColorStop(1, C.bg2)
    ctx.fillStyle = g
  } else ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)
  // Sonne wie bisher angeschnitten am Rand, die übrigen Symbole ganz im Bild
  if (symbol === 'sonne') drawSymbol(ctx, 'sonne', C.sun, W - 120, story ? 190 : 120, (story ? 92 : 70) * 3.4)
  else drawSymbol(ctx, symbol, C.sun, W - (story ? 170 : 140), story ? 190 : 124, story ? 220 : 170)

  // Etikett: Reisetag und Datum
  const date = new Date(post.published_at).toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' })
  const label = [day ? `Tag ${day}` : null, date].filter(Boolean).join(' · ').toUpperCase()
  let y = top
  y += drawPill(ctx, label, M, y, story ? 30 : 26) + (story ? 44 : 32)

  // Titel (Serif) und Ort (kursiv in Mint, wie «Momente teilen» auf der Startseite)
  const { title, place } = shareHeadline(post)
  const titleSize = story ? 96 : 76
  ctx.font = `600 ${titleSize}px ${SERIF}`
  ctx.fillStyle = C.ink
  ctx.textBaseline = 'top'
  // Im Beitrag steht der Titel auf Höhe des Symbols: rechts Platz lassen, damit nichts überlappt
  const titleWidth = !story && symbol !== 'keins' ? W - M * 2 - 190 : W - M * 2
  for (const l of wrap(ctx, title, titleWidth, 2)) {
    ctx.fillText(l, M, y)
    y += titleSize * 1.1
  }
  if (place) {
    const placeSize = story ? 54 : 44
    ctx.font = `italic 600 ${placeSize}px ${SERIF}`
    ctx.fillStyle = C.accent
    y += placeSize * 0.15
    for (const l of wrap(ctx, place, W - M * 2, 1)) {
      ctx.fillText(l, M, y)
      y += placeSize * 1.2
    }
  }
  y += story ? 56 : 40

  // Fusszeile: Marke und Adresse. In der Story dezent und tief unten (unterhalb der Schutzzone, eine Zeile,
  // gedämpfte Farbe); das Foto bekommt dafür mehr Platz.
  let footY: number
  if (story) {
    footY = bottom
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = C.muted
    const brand = 'Little Footnotes'
    const site = '  ·  littlefootnotes.app'
    ctx.font = `italic 500 34px ${SERIF}`
    const bw = ctx.measureText(brand).width
    ctx.font = `400 24px ${SANS}`
    const sw = ctx.measureText(site).width
    const x0 = (W - bw - sw) / 2
    ctx.font = `italic 500 34px ${SERIF}`
    ctx.fillText(brand, x0, H - 150)
    ctx.font = `400 24px ${SANS}`
    ctx.fillText(site, x0 + bw, H - 152)
  } else {
    const footH = 84
    footY = bottom - footH
    ctx.save()
    ctx.setLineDash([12, 9])
    ctx.lineWidth = 3
    ctx.strokeStyle = C.line
    ctx.beginPath()
    ctx.moveTo(M, footY)
    ctx.lineTo(W - M, footY)
    ctx.stroke()
    ctx.restore()
    ctx.textBaseline = 'alphabetic'
    ctx.font = `italic 600 44px ${SERIF}`
    ctx.fillStyle = C.ink
    ctx.fillText('Little Footnotes', M, bottom - 10)
    ctx.font = `500 26px ${SANS}`
    ctx.fillStyle = C.muted
    ctx.textAlign = 'right'
    ctx.fillText('littlefootnotes.app', W - M, bottom - 16)
    ctx.textAlign = 'left'
  }

  // Motiv dazwischen
  const areaH = footY - (story ? 16 : 44) - y
  const areaW = W - M * 2
  if (img) {
    // Fläche füllen (zugeschnitten), aber nicht höher als 4:5 im Beitrag bzw. 3:4 in der Story
    const w = areaW
    const h = Math.min(areaH, w * (story ? 4 / 3 : 1.25))
    drawPhoto(ctx, img, (W - w) / 2, y + (areaH - h) / 2, w, h)
    img.close()
  } else {
    const text = post.blocks.find((b) => b.kind === 'text' && b.text)?.text?.trim() ?? title
    drawQuote(ctx, text, M, y, areaW, Math.min(areaH, areaW))
  }

  return canvasToJpeg(canvas, 0.92)
}

/**
 * Bild über das Teilen-Menü des Geräts weitergeben (dort erscheint Instagram mit Story und Beitrag).
 * Ohne Teilen-Menü wird das Bild heruntergeladen.
 */
export const shareImageFile = async (blob: Blob, format: ShareImageFormat): Promise<'shared' | 'saved' | 'cancelled'> => {
  const file = new File([blob], `littlefootnotes-${format === 'story' ? 'story' : 'beitrag'}.jpg`, { type: 'image/jpeg' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      // Nur das Bild: iOS hängt sonst den Seitentitel als Text an, und Instagram übernimmt dann den Text statt
      // des Bildes. Leerer Titel und Text verhindern das.
      await navigator.share({ files: [file], title: '', text: '' })
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled'
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'saved'
}
