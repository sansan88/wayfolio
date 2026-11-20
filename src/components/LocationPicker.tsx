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
import { locate } from 'ionicons/icons'
import { lazy, Suspense, useEffect, useState } from 'react'

import { getPosition, reverseGeocode, searchPlaces, type Place, type Position, type SearchResult } from '../lib/location'
import { useCardPresenter } from '../lib/modal'

const PickerMap = lazy(() => import('./PickerMap'))

interface Props {
  isOpen: boolean
  initial: Position | null
  onClose: () => void
  onPick: (position: Position, place: Place, source: 'gps' | 'manual') => void
}

/** Ort per GPS oder manuell: Karte verschieben, bis der Pin stimmt, oder einen Ort suchen. */
const LocationPicker = ({ isOpen, initial, onClose, onPick }: Props) => {
  const presenter = useCardPresenter(isOpen)
  const [center, setCenter] = useState<{ lat: number; lon: number }>(initial ?? { lat: 46.8, lon: 8.23 })
  const [flyTo, setFlyTo] = useState<{ lat: number; lon: number; key: number }>()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chosen, setChosen] = useState<SearchResult | null>(null)

  useEffect(() => {
    if (isOpen) {
      setCenter(initial ?? { lat: 46.8, lon: 8.23 })
      setQuery('')
      setResults([])
      setError(null)
      setChosen(null)
    }
  }, [isOpen, initial])

  // Ortssuche mit kurzer Verzögerung (Nominatim: max. 1 Anfrage pro Sekunde)
  useEffect(() => {
    if (query.trim().length < 3) return setResults([])
    setSearching(true)
    const t = setTimeout(() => {
      searchPlaces(query)
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
      onPick(pos, await reverseGeocode(pos), 'gps')
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
    onPick(pos, place, 'manual')
    setBusy(false)
    onClose()
  }

  return (
    <IonModal isOpen={isOpen} presentingElement={presenter} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>Abbrechen</IonButton>
          </IonButtons>
          <IonTitle>Ort wählen</IonTitle>
          <IonButtons slot="end">
            <IonButton strong disabled={busy} onClick={() => void confirm()}>
              {busy ? <IonSpinner name="dots" /> : 'Übernehmen'}
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar placeholder="Ort suchen" value={query} debounce={0} onIonInput={(e) => setQuery(String(e.detail.value ?? ''))} />
        </IonToolbar>
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
      </IonContent>
    </IonModal>
  )
}

export default LocationPicker
