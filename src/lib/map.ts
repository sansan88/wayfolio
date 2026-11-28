import { LngLatBounds, type PaddingOptions, Map as MlMap, setWorkerUrl, type LngLatBoundsLike } from 'maplibre-gl'
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

const ACCENT = '#11a683'

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

/**
 * Ausschnitt nah am aktuellen Ort: letzte Etappe (vorheriger + aktueller Punkt), Zoom 8–11.
 * Ist die Etappe sehr lang, bleibt der aktuelle Ort im Zentrum und die Linie führt aus dem Bild.
 */
export const focusCurrent = (map: MlMap, points: RoutePoint[], padding: number | PaddingOptions = 110) => {
  const last = points.at(-1)
  if (!last) return
  const prev = points.at(-2)
  if (!prev) {
    map.jumpTo({ center: [last.lon, last.lat], zoom: 10 })
    return
  }
  const b = new LngLatBounds()
  b.extend([prev.lon, prev.lat])
  b.extend([last.lon, last.lat])
  const camera = map.cameraForBounds(b, { padding, maxZoom: 11 })
  if (!camera || (camera.zoom ?? 0) < 8) map.jumpTo({ center: [last.lon, last.lat], zoom: 8 })
  else map.jumpTo(camera)
}

export const routeBounds = (points: RoutePoint[]): LngLatBoundsLike | null => {
  if (!points.length) return null
  const b = new LngLatBounds()
  points.forEach((p) => b.extend([p.lon, p.lat]))
  return b
}

/** Distanz in km zwischen zwei Punkten (Haversine). */
export { distanceKm } from './geo'
