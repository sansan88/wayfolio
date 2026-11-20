import { Map as MlMap } from 'maplibre-gl'
import { useEffect, useRef } from 'react'

import { MAP_STYLE } from '../lib/map'

interface Props {
  center: { lat: number; lon: number }
  zoom: number
  /** byUser: vom Menschen verschoben (nicht durch flyTo) */
  onMove: (center: { lat: number; lon: number }, byUser: boolean) => void
  /** Wechselt bei jeder Suche/GPS-Abfrage, damit die Karte dorthin fliegt */
  flyTo?: { lat: number; lon: number; key: number }
}

/** Karte mit festem Pin in der Mitte: die Karte wird verschoben, der Pin bleibt stehen. */
const PickerMap = ({ center, zoom, onMove, flyTo }: Props) => {
  const host = useRef<HTMLDivElement>(null)
  const map = useRef<MlMap | null>(null)

  useEffect(() => {
    if (!host.current) return
    const m = new MlMap({ container: host.current, style: MAP_STYLE, center: [center.lon, center.lat], zoom })
    m.on('moveend', (e) => {
      const c = m.getCenter()
      onMove({ lat: c.lat, lon: c.lng }, !!(e as { originalEvent?: Event }).originalEvent)
    })
    map.current = m
    const t = setTimeout(() => m.resize(), 350)
    return () => {
      clearTimeout(t)
      m.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (flyTo && map.current) map.current.flyTo({ center: [flyTo.lon, flyTo.lat], zoom: Math.max(map.current.getZoom(), 12), duration: 600 })
  }, [flyTo])

  return (
    <div className="picker-map">
      <div ref={host} style={{ position: 'absolute', inset: 0 }} />
      <svg className="picker-map__pin" viewBox="0 0 24 36" aria-hidden="true">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#1f6feb" />
        <circle cx="12" cy="12" r="4.5" fill="#fff" />
      </svg>
    </div>
  )
}

export default PickerMap
