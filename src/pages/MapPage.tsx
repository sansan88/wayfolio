import { IonContent, IonFab, IonFabButton, IonIcon, IonLoading, IonPage, IonText, useIonToast, useIonViewWillEnter } from '@ionic/react'
import { locate } from 'ionicons/icons'
import { lazy, Suspense, useCallback, useMemo, useState } from 'react'

import LocationPicker from '../components/LocationPicker'
import LocationSheet from '../components/LocationSheet'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../lib/auth'
import { useCapture } from '../lib/capture'
import { formatWhen } from '../lib/datetime'
import type { Place, Position } from '../lib/location'
import { loadRoute, type RoutePoint } from '../lib/route'
import { useTrip } from '../lib/trip'
import { createLocationUpdate, loadUpdates, type FeedPost } from '../lib/updates'

const RouteMap = lazy(() => import('../components/RouteMap'))

const MapPage = () => {
  const { session } = useAuth()
  const { trip } = useTrip()
  const { position, at, setLocation } = useCapture()
  const [presentToast] = useIonToast()
  const [points, setPoints] = useState<RoutePoint[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [selected, setSelected] = useState<RoutePoint | null>(null)

  const refresh = useCallback(() => {
    if (!trip) return
    loadRoute(trip.id)
      .then(setPoints)
      .catch((e: Error) => setError(e.message))
    loadUpdates(trip.id)
      .then(setPosts)
      .catch(() => setPosts([]))
  }, [trip])

  // pro Ort das neueste Foto als Marker (ohne Routenbilder)
  const photos = useMemo(() => {
    const out: Record<string, string> = {}
    for (const p of posts) {
      const url = p.blocks.find((b) => b.kind === 'photo' && b.mediaUrl && !b.route)?.mediaUrl
      if (p.checkin_id && url && !out[p.checkin_id]) out[p.checkin_id] = url
    }
    return out
  }, [posts])

  useIonViewWillEnter(refresh, [refresh])

  // Karte im Picker beim letzten bekannten Ort öffnen (memoisiert, sonst springt die Karte zurück)
  const last = points?.at(-1)
  const pickerStart = useMemo<Position | null>(
    () => position ?? (last ? { lat: last.lat, lon: last.lon, accuracy: 0 } : null),
    [position, last],
  )

  /** Neuen Standort setzen (GPS oder Pin) → Route-Update mit Routenbild im Feed. */
  const addLocation = async (pos: Position, place: Place, source: 'gps' | 'manual', when: Date | null) => {
    if (!trip || !session) return
    setLocation(pos, place, source)
    setBusy(true)
    try {
      await createLocationUpdate({ tripId: trip.id, userId: session.user.id, position: pos, place, at: when })
      presentToast({
        message: `Standort gesetzt: ${place.name}${when ? ` · ${formatWhen(when)}` : ''}`,
        duration: 2500,
        position: 'top',
        color: 'success',
      })
      refresh()
    } catch (e) {
      presentToast({ message: (e as Error).message, duration: 3000, position: 'top', color: 'danger' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <IonPage>
      <PageHeader title="Karte" />
      <IonContent scrollY={false}>
        {error && (
          <IonText color="danger">
            <p className="ion-padding">{error}</p>
          </IonText>
        )}
        {points && (
          <Suspense fallback={null}>
            <RouteMap points={points} photos={photos} onSelect={setSelected} focus={selected} />
          </Suspense>
        )}
        {points?.length === 0 && (
          <IonText color="medium">
            <p className="ion-padding" style={{ position: 'absolute', top: 0, background: 'var(--ion-background-color)' }}>
              Noch keine Standorte. Tippt unten rechts, um euren ersten Standort zu setzen.
            </p>
          </IonText>
        )}

        <IonFab slot="fixed" vertical="bottom" horizontal="end" className="map__fab">
          <IonFabButton aria-label="Standort setzen" onClick={() => setPicking(true)}>
            <IonIcon icon={locate} />
          </IonFabButton>
        </IonFab>

        <LocationPicker
          isOpen={picking}
          initial={pickerStart}
          withTime
          at={at}
          onClose={() => setPicking(false)}
          onPick={(pos, place, source, when) => void addLocation(pos, place, source, when)}
        />
        <LocationSheet
          point={selected}
          points={points ?? []}
          posts={posts}
          start={trip?.starts_on}
          mode="owner"
          onClose={() => setSelected(null)}
          onNavigate={setSelected}
        />
        <IonLoading isOpen={busy} message="Standort und Routenbild …" />
      </IonContent>
    </IonPage>
  )
}

export default MapPage
