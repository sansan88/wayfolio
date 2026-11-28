import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { locate, timeOutline } from 'ionicons/icons'
import { lazy, Suspense, useEffect, useState } from 'react'

import { getPosition, reverseGeocode, searchPlaces, type Place, type Position, type SearchResult } from '../lib/location'
import { formatWhen } from '../lib/datetime'
import { useCardPresenter } from '../lib/modal'
import DateTimeSheet from './DateTimeSheet'

const PickerMap = lazy(() => import('./PickerMap'))

interface Props {
  isOpen: boolean
  initial: Position | null
  onClose: () => void
  /** Standort erfassen: zusätzlich Zeitpunkt wählen (rückwirkend) */
  withTime?: boolean
  /** vorbelegter Zeitpunkt, null = jetzt */
  at?: Date | null
  onPick: (position: Position, place: Place, source: 'gps' | 'manual', at: Date | null) => void
}

/** Ort per GPS oder manuell: Karte verschieben, bis der Pin stimmt, oder einen Ort suchen. */
const LocationPicker = ({ isOpen, initial, withTime = false, at = null, onClose, onPick }: Props) => {
  const presenter = useCardPresenter(isOpen)
  const [center, setCenter] = useState<{ lat: number; lon: number }>(initial ?? { lat: 46.8, lon: 8.23 })
  const [flyTo, setFlyTo] = useState<{ lat: number; lon: number; key: number }>()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chosen, setChosen] = useState<SearchResult | null>(null)
  const [when, setWhen] = useState<Date | null>(at)
  const [choosingTime, setChoosingTime] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setCenter(initial ?? { lat: 46.8, lon: 8.23 })
      setQuery('')
      setResults([])
      setError(null)
      setChosen(null)
      setWhen(at)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initial])

  // Ortssuche mit kurzer Verzögerung (Nominatim: max. 1 Anfrage pro Sekunde)
  useEffect(() => {
    if (query.trim().length < 3) return setResults([])
    setSearching(true)
    const t = setTimeout(() => {
      // Nähe nur bevorzugen, wenn die Karte schon bei der Reise ist (nicht beim Standard-Ausschnitt)
      searchPlaces(query, initial ? center : undefined)
        .then(setResults)
        .finally(() => setSearching(false))
    }, 700)
    return () => clearTimeout(t)
  }, [query])

  const useGps = async () => {
    setBusy(true)
    setError(null)
    try {
      const pos = await getPosition()
      onPick(pos, await reverseGeocode(pos), 'gps', when)
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const confirm = async () => {
    setBusy(true)
    // Suchtreffer unverändert übernommen? Dann dessen Position und Namen statt eines Nachbarorts verwenden
    const pos: Position = chosen ? { lat: chosen.lat, lon: chosen.lon, accuracy: 0 } : { lat: center.lat, lon: center.lon, accuracy: 0 }
    const place = chosen
      ? { name: `${chosen.name}, ${chosen.detail.split(',').at(-1)!.trim()}`, countryCode: null }
      : await reverseGeocode(pos)
    onPick(pos, place, 'manual', when)
    setBusy(false)
    onClose()
  }

  return (
    <IonModal
      isOpen={isOpen}
      presentingElement={presenter}
      // Nicht per Wischen schliessen: die Karte braucht die Geste, Schliessen nur über Abbrechen/Übernehmen
      canDismiss={async (_data?: unknown, role?: string) => role !== 'gesture'}
      onDidDismiss={onClose}
    >
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>Abbrechen</IonButton>
          </IonButtons>
          <IonTitle>{withTime ? 'Standort erfassen' : 'Ort wählen'}</IonTitle>
          <IonButtons slot="end">
            <IonButton strong disabled={busy} onClick={() => void confirm()}>
              {busy ? <IonSpinner name="dots" /> : withTime ? 'Erfassen' : 'Übernehmen'}
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar placeholder="Ort suchen" value={query} debounce={0} onIonInput={(e) => setQuery(String(e.detail.value ?? ''))} />
        </IonToolbar>
        {withTime && (
          <IonToolbar>
            <IonItem button detail lines="none" className="picker__when" onClick={() => setChoosingTime(true)}>
              <IonIcon slot="start" icon={timeOutline} color={when ? 'warning' : 'primary'} />
              <IonLabel>Zeitpunkt</IonLabel>
              <IonNote slot="end">{formatWhen(when)}</IonNote>
            </IonItem>
          </IonToolbar>
        )}
      </IonHeader>
      <IonContent scrollY={false}>
        {results.length > 0 || searching ? (
          <IonList>
            {searching && (
              <IonItem lines="none">
                <IonSpinner name="dots" />
              </IonItem>
            )}
            {results.map((r) => (
              <IonItem
                key={`${r.lat},${r.lon}`}
                button
                detail={false}
                onClick={() => {
                  setFlyTo({ lat: r.lat, lon: r.lon, key: Date.now() })
                  setCenter({ lat: r.lat, lon: r.lon })
                  setChosen(r)
                  setResults([])
                  setQuery('')
                }}
              >
                <IonLabel>
                  <h3>{r.name}</h3>
                  <p>{r.detail}</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        ) : null}
        <div style={{ display: results.length || searching ? 'none' : 'block', position: 'absolute', inset: 0 }}>
          {isOpen && (
            <Suspense fallback={null}>
              <PickerMap center={center} zoom={initial ? 12 : 5} onMove={(c, byUser) => {
                  setCenter(c)
                  if (byUser) setChosen(null)
                }} flyTo={flyTo} />
            </Suspense>
          )}
          <div className="picker-map__actions">
            <IonButton shape="round" color="light" onClick={() => void useGps()} disabled={busy}>
              <IonIcon slot="start" icon={locate} color="primary" />
              Mein Standort
            </IonButton>
            {error && <IonNote color="danger">{error}</IonNote>}
            <IonNote className="picker-map__hint">Karte verschieben, bis der Pin stimmt</IonNote>
          </div>
        </div>
        <DateTimeSheet isOpen={choosingTime} value={when} onClose={() => setChoosingTime(false)} onChange={setWhen} />
      </IonContent>
    </IonModal>
  )
}

export default LocationPicker
