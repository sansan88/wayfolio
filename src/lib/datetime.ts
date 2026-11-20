/** Lokale Zeit im Format, das <IonDatetime> erwartet: YYYY-MM-DDTHH:mm */
export const toLocalIso = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** «Jetzt» oder z.B. «Do., 12. Nov. 2026, 14:30» */
export const formatWhen = (d: Date | null) =>
  d
    ? d.toLocaleString('de-CH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Jetzt'
