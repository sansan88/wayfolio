import { Map as MlMap, NavigationControl, Popup, type MapLayerMouseEvent } from 'maplibre-gl'
import { useEffect, useRef } from 'react'

import { addRoute, MAP_STYLE, routeBounds } from '../lib/map'
import type { RoutePoint } from '../lib/route'

interface Props {
  points: RoutePoint[]
  height?: string
}

/** Interaktive Karte mit Route und Pins (Reisende und Follower). */
const RouteMap = ({ points, height = '100%' }: Props) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const last = points.at(-1)
    const map = new MlMap({
      container: ref.current,
      style: MAP_STYLE,
      center: last ? [last.lon, last.lat] : [8.23, 46.8],
      zoom: last ? 9 : 3,
    })
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', () => {
      if (!points.length) return
      addRoute(map, points)
      const bounds = routeBounds(points)
      if (bounds && points.length > 1) map.fitBounds(bounds, { padding: 50, maxZoom: 12, animate: false })
      // Tipp auf einen Punkt zeigt Ort und Datum
      map.on('click', 'stops', (e: MapLayerMouseEvent) => {
        const f = e.features?.[0]
        if (!f || f.geometry.type !== 'Point') return
        const [lon, lat] = f.geometry.coordinates as [number, number]
        const p = points.find((x) => Math.abs(x.lon - lon) < 1e-6 && Math.abs(x.lat - lat) < 1e-6)
        if (p)
          new Popup({ offset: 10 })
            .setLngLat([lon, lat])
            .setText(`${p.place_name ?? 'Standort'} · ${new Date(p.recorded_at).toLocaleDateString('de-CH')}`)
            .addTo(map)
      })
      map.on('mouseenter', 'stops', () => (map.getCanvas().style.cursor = 'pointer'))
      map.on('mouseleave', 'stops', () => (map.getCanvas().style.cursor = ''))
    })
    // Ionic blendet Seiten ein: Grösse nach dem Einblenden neu berechnen
    const t = setTimeout(() => map.resize(), 300)
    return () => {
      clearTimeout(t)
      map.remove()
    }
  }, [points])

  return <div ref={ref} style={{ width: '100%', height }} />
}

export default RouteMap
