import type { FeedPost } from './updates'

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

// Farben und Schrift wie auf der Startseite (LandingPage.css, helles Design)
const C = {
  bg: '#fbf6ee',
  tint: '#f3e8d8',
  card: '#fffdf9',
  line: '#e6d8c4',
  ink: '#2b2420',
  muted: '#74675d',
  mint: '#0e9474',
  ochre: '#dda94b',
  clay: '#c9714f',
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

const loadImage = async (url: string): Promise<ImageBitmap | null> => {
  try {
    // über fetch statt <img>, damit die Leinwand nicht «tainted» wird
    const res = await fetch(url)
    if (!res.ok) return null
    return await createImageBitmap(await res.blob())
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

const drawSun = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
  ctx.save()
  ctx.fillStyle = 'rgba(221, 169, 75, 0.22)'
  ctx.strokeStyle = 'rgba(221, 169, 75, 0.55)'
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

/** Gestricheltes Etikett wie «Open-Source-Reisetagebuch» auf der Startseite. */
const drawPill = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) => {
  ctx.save()
  ctx.font = `700 ${size}px ${SANS}`
  ctx.letterSpacing = `${size * 0.12}px`
  const padX = size * 0.9
  const h = size * 2.2
  const w = ctx.measureText(text).width + padX * 2
  roundRect(ctx, x, y, w, h, h / 2)
  ctx.fillStyle = 'rgba(17, 166, 131, 0.08)'
  ctx.fill()
  ctx.setLineDash([size * 0.4, size * 0.3])
  ctx.lineWidth = size * 0.09
  ctx.strokeStyle = C.mint
  ctx.stroke()
  ctx.fillStyle = C.mint
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
}

/** Zeichnet das Bild und liefert es als JPEG. */
export const renderShareImage = async (post: FeedPost, { format, photoIndex = 0, day }: ShareImageOptions): Promise<Blob> => {
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

  // Instagram überdeckt in Storys oben und unten je ca. 250 px – dort nur Dekoration
  const story = format === 'story'
  const M = 84
  const top = story ? 270 : 84
  const bottom = story ? H - 250 : H - 64

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)
  drawSun(ctx, W - 120, story ? 190 : 120, story ? 92 : 70)

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
  for (const l of wrap(ctx, title, W - M * 2, 2)) {
    ctx.fillText(l, M, y)
    y += titleSize * 1.1
  }
  if (place) {
    const placeSize = story ? 54 : 44
    ctx.font = `italic 600 ${placeSize}px ${SERIF}`
    ctx.fillStyle = C.mint
    y += placeSize * 0.15
    for (const l of wrap(ctx, place, W - M * 2, 1)) {
      ctx.fillText(l, M, y)
      y += placeSize * 1.2
    }
  }
  y += story ? 56 : 40

  // Fusszeile: Marke und Adresse
  const footH = story ? 96 : 84
  const footY = bottom - footH
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
  ctx.font = `italic 600 ${story ? 50 : 44}px ${SERIF}`
  ctx.fillStyle = C.ink
  ctx.fillText('Little Footnotes', M, bottom - (story ? 14 : 10))
  ctx.font = `500 ${story ? 30 : 26}px ${SANS}`
  ctx.fillStyle = C.muted
  ctx.textAlign = 'right'
  ctx.fillText('littlefootnotes.app', W - M, bottom - (story ? 20 : 16))
  ctx.textAlign = 'left'

  // Motiv dazwischen
  const areaH = footY - (story ? 64 : 44) - y
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

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Bild konnte nicht erzeugt werden.'))), 'image/jpeg', 0.92),
  )
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
