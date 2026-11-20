import { LngLatBounds, Map as MlMap, setWorkerUrl, type LngLatBoundsLike } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre 6 lädt seinen Worker relativ zur eigenen Datei – im Vite-Build muss er mitgebündelt werden.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

setWorkerUrl(workerUrl)

import type { RoutePoint } from './route'

/** Kostenlose OpenStreetMap-Vektorkarte ohne API-Key (https://openfreemap.org). */
export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
export const ATTRIBUTION = '© OpenStreetMap · OpenFreeMap'

export type { RoutePoint } from './route'
export { loadRoute } from './route'

const ACCENT = '#1f6feb'

/** Route als Linie, frühere Orte als Punkte, letzter Ort hervorgehoben. */
export const addRoute = (map: MlMap, points: RoutePoint[]) => {
  const coords = points.map((p) => [p.lon, p.lat])
  const last = points.at(-1)
  map.addSource('route', {
    type: 'geojson',
    data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
  })
  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': ACCENT, 'line-width': 4, 'line-opacity': 0.85 },
  })
  map.addSource('stops', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: points.map((p) => ({
        type: 'Feature',
        properties: { last: p.id === last?.id },
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
      })),
    },
  })
  map.addLayer({
    id: 'stops',
    type: 'circle',
    source: 'stops',
    paint: {
      'circle-radius': ['case', ['get', 'last'], 9, 5],
      'circle-color': ['case', ['get', 'last'], ACCENT, '#ffffff'],
      'circle-stroke-color': ACCENT,
      'circle-stroke-width': 3,
    },
  })
}

export const routeBounds = (points: RoutePoint[]): LngLatBoundsLike | null => {
  if (!points.length) return null
  const b = new LngLatBounds()
  points.forEach((p) => b.extend([p.lon, p.lat]))
  return b
}

const waitForIdle = (map: MlMap) =>
  new Promise<void>((resolve) => {
    const done = () => resolve()
    map.once('idle', done)
    setTimeout(done, 12000) // Sicherheitsnetz bei langsamem Netz
  })

/**
 * Erzeugt das Routenbild (quadratisch, 1080 px) im Browser: Karte mit Route rendern,
 * als JPEG exportieren, Ortszeile und Quellenangabe einzeichnen.
 */
export const renderRouteImage = async (points: RoutePoint[], caption: string): Promise<Blob> => {
  const size = 1080
  const host = document.createElement('div')
  host.style.cssText = `position:fixed;left:-${size * 2}px;top:0;width:${size / 2}px;height:${size / 2}px;`
  document.body.appendChild(host)
  const map = new MlMap({
    container: host,
    style: MAP_STYLE,
    interactive: false,
    attributionControl: false,
    pixelRatio: 2,
    canvasContextAttributes: { preserveDrawingBuffer: true },
    center: [points.at(-1)!.lon, points.at(-1)!.lat],
    zoom: 10,
  })
  try {
    await new Promise<void>((resolve) => map.once('load', () => resolve()))
    addRoute(map, points)
    const bounds = routeBounds(points)
    if (bounds && points.length > 1) map.fitBounds(bounds, { padding: 60, maxZoom: 12, animate: false })
    await waitForIdle(map)

    const out = document.createElement('canvas')
    out.width = size
    out.height = size
    const ctx = out.getContext('2d')!
    ctx.drawImage(map.getCanvas(), 0, 0, size, size)
    // Ortszeile unten
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, size - 120, size, 120)
    ctx.fillStyle = '#ffffff'
    ctx.font = '600 44px system-ui, sans-serif'
    ctx.fillText(caption, 40, size - 58, size - 80)
    ctx.font = '24px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fillText(ATTRIBUTION, 40, size - 22)
    return await new Promise<Blob>((resolve, reject) =>
      out.toBlob((b) => (b ? resolve(b) : reject(new Error('Routenbild fehlgeschlagen'))), 'image/jpeg', 0.88),
    )
  } finally {
    map.remove()
    host.remove()
  }
}

/** Distanz in km zwischen zwei Punkten (Haversine). */
export const distanceKm = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const r = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(h))
}
