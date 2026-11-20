import type { Position } from './location'

export interface PhotoMeta {
  takenAt: Date | null
  position: Position | null
}

/** «2026:11:10 10:30:00» (+ optional «+13:00») → Date. Ohne Zeitzone gilt die Gerätezeit. */
const parseExifDate = (raw: unknown, offset: unknown): Date | null => {
  if (typeof raw !== 'string') return raw instanceof Date && !isNaN(raw.getTime()) ? raw : null
  const m = raw.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/)
  if (!m) return null
  const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`
  const tz = typeof offset === 'string' && /^[+-]\d{2}:\d{2}$/.test(offset) ? offset : ''
  const d = new Date(iso + tz)
  return isNaN(d.getTime()) || d.getFullYear() < 1990 ? null : d
}

/**
 * Liest Aufnahmezeit und GPS-Position aus dem Original (vor dem Verkleinern, das EXIF entfernt).
 * Hinweis iOS: Die Position ist nur enthalten, wenn im Foto-Picker unter «Optionen» «Ort» aktiv ist.
 */
export const readPhotoMeta = async (file: Blob): Promise<PhotoMeta> => {
  try {
    const mod = await import('exifr')
    const exifr = (mod as unknown as { default?: typeof mod }).default ?? mod
    const data = (await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      reviveValues: false,
      pick: ['DateTimeOriginal', 'CreateDate', 'OffsetTimeOriginal', 'OffsetTime', 'latitude', 'longitude', 'GPSLatitude', 'GPSLongitude', 'GPSLatitudeRef', 'GPSLongitudeRef'],
    })) as Record<string, unknown> | undefined
    if (!data) return { takenAt: null, position: null }
    const takenAt =
      parseExifDate(data.DateTimeOriginal, data.OffsetTimeOriginal ?? data.OffsetTime) ?? parseExifDate(data.CreateDate, data.OffsetTime)
    const lat = Number(data.latitude)
    const lon = Number(data.longitude)
    const position: Position | null =
      Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0) ? { lat, lon, accuracy: 0 } : null
    return { takenAt, position }
  } catch (e) {
    console.warn('EXIF nicht lesbar', e)
    return { takenAt: null, position: null }
  }
}
