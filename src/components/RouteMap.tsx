import { Map as MlMap, Marker, NavigationControl, type MapLayerMouseEvent } from 'maplibre-gl'
import { useEffect, useRef } from 'react'

import { addRoute, focusCurrent, MAP_STYLE } from '../lib/map'
import type { RoutePoint } from '../lib/route'

interface Props {
  points: RoutePoint[]
  /** Foto-Vorschau pro Routenpunkt (checkin_id → Bild-URL), wie Fussabdrücke auf der Karte */
  photos?: Record<string, string>
  /** Tipp auf einen Ort */
  onSelect?: (point: RoutePoint) => void
  /** ausgewählten Ort in den sichtbaren Bereich über dem Sheet holen */
  focus?: RoutePoint | null
  height?: string
}

/** Interaktive Karte mit Route, Pins und Foto-Markern (Reisende und Follower). */
const RouteMap = ({ points, photos = {}, onSelect, focus, height = '100%' }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const select = useRef(onSelect)
  select.current = onSelect

  useEffect(() => {
    if (!ref.current) return
    const last = points.at(-1)
    const map = new MlMap({
      container: ref.current,
      style: MAP_STYLE,
      center: last ? [last.lon, last.lat] : [8.23, 46.8],
      zoom: last ? 9 : 3,
    })
    mapRef.current = map
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    const markers: Marker[] = []
    map.on('load', () => {
      if (!points.length) return
      addRoute(map, points)
      // Start nah am aktuellen Ort (letzte Etappe); herauszoomen zeigt die ganze Route
      focusCurrent(map, points)

      // Orte mit Fotos als runde Vorschaubilder
      points.forEach((p) => {
        const url = photos[p.id]
        if (!url) return
        const el = document.createElement('button')
        el.type = 'button'
        el.className = 'map-photo'
        el.style.backgroundImage = `url("${url}")`
        el.setAttribute('aria-label', p.place_name ?? 'Ort mit Fotos')
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          select.current?.(p)
        })
        markers.push(new Marker({ element: el, anchor: 'bottom' }).setLngLat([p.lon, p.lat]).addTo(map))
      })

      // Tipp auf einen Punkt öffnet die Details
      map.on('click', 'stops', (e: MapLayerMouseEvent) => {
        const f = e.features?.[0]
        if (!f || f.geometry.type !== 'Point') return
        const [lon, lat] = f.geometry.coordinates as [number, number]
        const p = points.find((x) => Math.abs(x.lon - lon) < 1e-6 && Math.abs(x.lat - lat) < 1e-6)
        if (p) select.current?.(p)
      })
      map.on('mouseenter', 'stops', () => (map.getCanvas().style.cursor = 'pointer'))
      map.on('mouseleave', 'stops', () => (map.getCanvas().style.cursor = ''))
    })
    // Ionic blendet Seiten ein: Grösse nach dem Einblenden neu berechnen
    const t = setTimeout(() => map.resize(), 300)
    return () => {
      clearTimeout(t)
      markers.forEach((m) => m.remove())
      map.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, JSON.stringify(photos)])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !focus) return
    // Sheet deckt die untere Hälfte ab: Ort im oberen Drittel zeigen
    map.easeTo({ center: [focus.lon, focus.lat], zoom: Math.max(map.getZoom(), 9), offset: [0, -map.getContainer().clientHeight * 0.22], duration: 500 })
  }, [focus])

  return <div ref={ref} style={{ width: '100%', height }} />
}

export default RouteMap
