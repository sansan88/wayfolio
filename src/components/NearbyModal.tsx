import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { compassOutline, earthOutline, libraryOutline, locate, openOutline } from 'ionicons/icons'
import { useEffect, useRef, useState } from 'react'

import { useGeoPermission } from '../lib/geoPermission'
import { getPosition } from '../lib/location'
import { useCardPresenter } from '../lib/modal'
import { formatKm, NEARBY_SOURCES, type NearbyItem, type NearbySource } from '../lib/nearby'
import { loadRoute } from '../lib/route'
import './NearbyModal.css'

interface Props {
  isOpen: boolean
  /** Reise, deren letzter Ort als Ausgangspunkt dient, wenn kein GPS da ist */
  tripId: string | null
  onClose: () => void
}

type Origin = { lat: number; lon: number; label: string }

const RADII = [5, 10, 25, 50]
const SOURCE_ICON: Record<NearbySource['id'], string> = { travelers: compassOutline, wikipedia: libraryOutline, osm: earthOutline }

/** «In der Nähe entdecken»: Tipps anderer Reisender, Wikipedia und OpenStreetMap rund um den Standort. */
const NearbyModal = ({ isOpen, tripId, onClose }: Props) => {
  const presenter = useCardPresenter(isOpen)
  const { state: geo } = useGeoPermission()
  const [origin, setOrigin] = useState<Origin | null>(null)
  const [locating, setLocating] = useState(false)
  const [source, setSource] = useState<NearbySource['id']>('travelers')
  const [radius, setRadius] = useState(25)
  const [items, setItems] = useState<NearbyItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cache = useRef(new Map<string, NearbyItem[]>())

  const useGps = async () => {
    setLocating(true)
    setError(null)
    try {
      const p = await getPosition()
      setOrigin({ lat: p.lat, lon: p.lon, label: 'deinen Standort' })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLocating(false)
    }
  }

  // Ausgangspunkt: GPS, falls freigegeben, sonst der letzte Ort der Reise
  useEffect(() => {
    if (!isOpen) return
    cache.current.clear()
    setItems(null)
    setError(null)
    if (geo === 'granted') {
      void useGps()
      return
    }
    if (!tripId) return
    loadRoute(tripId)
      .then((pts) => {
        const last = [...pts].sort((a, b) => Date.parse(b.recorded_at) - Date.parse(a.recorded_at))[0]
        if (last) setOrigin({ lat: last.lat, lon: last.lon, label: last.place_name?.split(',')[0] ?? 'euren letzten Ort' })
        else setError('Noch kein Ort bekannt – tippe auf «Mein Standort».')
      })
      .catch(() => setError('Noch kein Ort bekannt – tippe auf «Mein Standort».'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tripId, geo])

  // Tipps der gewählten Quelle laden (pro Ort, Quelle und Umkreis zwischengespeichert)
  useEffect(() => {
    if (!isOpen || !origin) return
    const key = `${source}|${radius}|${origin.lat.toFixed(3)},${origin.lon.toFixed(3)}`
    const hit = cache.current.get(key)
    if (hit) {
      setItems(hit)
      setError(null)
      return
    }
    let cancelled = false
    setItems(null)
    setError(null)
    NEARBY_SOURCES.find((s) => s.id === source)!
      .load(origin, radius)
      .then((list) => {
        if (cancelled) return
        cache.current.set(key, list)
        setItems(list)
      })
      .catch((e: Error) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [isOpen, origin, source, radius])

  const current = NEARBY_SOURCES.find((s) => s.id === source)!

  return (
    <IonModal isOpen={isOpen} presentingElement={presenter} onDidDismiss={onClose} className="nearby">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>Schliessen</IonButton>
          </IonButtons>
          <IonTitle>In der Nähe</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => void useGps()} disabled={locating} aria-label="Mein Standort verwenden">
              {locating ? <IonSpinner name="dots" /> : <IonIcon slot="icon-only" icon={locate} />}
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={source} onIonChange={(e) => setSource((e.detail.value as NearbySource['id']) ?? 'travelers')}>
            {NEARBY_SOURCES.map((s) => (
              <IonSegmentButton key={s.id} value={s.id}>
                <IonLabel>{s.label}</IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent color="light">
        <div className="nearby__head">
          <p className="nearby__origin">{origin ? <>Rund um {origin.label}</> : locating ? 'Standort wird ermittelt …' : ' '}</p>
          <div className="nearby__radii" role="radiogroup" aria-label="Umkreis">
            {RADII.map((r) => (
              <IonChip key={r} role="radio" aria-checked={r === radius} outline={r !== radius} color={r === radius ? 'primary' : 'medium'} onClick={() => setRadius(r)}>
                {r} km
              </IonChip>
            ))}
          </div>
        </div>

        {error ? (
          <p className="nearby__empty">{error}</p>
        ) : !origin || items === null ? (
          <div className="nearby__loading">
            <IonSpinner name="crescent" aria-label="Tipps werden geladen" />
          </div>
        ) : items.length === 0 ? (
          <p className="nearby__empty">
            {source === 'travelers'
              ? 'Hier hat noch niemand einen Tipp hinterlassen. Vielleicht bist du die erste Person – Links in deinen Beiträgen helfen später anderen.'
              : 'In diesem Umkreis wurde nichts gefunden. Probier einen grösseren Umkreis.'}
          </p>
        ) : (
          <IonList inset>
            {items.map((it) => (
              <IonItem key={it.key} href={it.url} target="_blank" rel="noopener noreferrer" detail={false}>
                <IonIcon slot="start" icon={it.icon ?? SOURCE_ICON[source]} color="primary" aria-hidden="true" />
                <IonLabel className="ion-text-wrap">
                  <h3>{it.title}</h3>
                  <p>
                    {[it.detail, it.mentions && it.mentions > 1 ? `${it.mentions}× empfohlen` : null].filter(Boolean).join(' · ')}
                  </p>
                </IonLabel>
                <IonNote slot="end" className="nearby__km">
                  {formatKm(it.distanceKm)}
                  <IonIcon icon={openOutline} aria-hidden="true" />
                </IonNote>
              </IonItem>
            ))}
          </IonList>
        )}
        <IonNote className="list-footnote nearby__note">{current.note}</IonNote>
      </IonContent>
    </IonModal>
  )
}

export default NearbyModal
