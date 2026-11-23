import { IonContent, IonFab, IonFabButton, IonIcon, IonPage, IonText, useIonViewWillEnter } from '@ionic/react'
import { locate } from 'ionicons/icons'
import { lazy, Suspense, useCallback, useMemo, useState } from 'react'

import CheckinModal from '../components/CheckinModal'
import LocationSheet from '../components/LocationSheet'
import { PageHeader } from '../components/PageHeader'
import { loadRoute, type RoutePoint } from '../lib/route'
import { useTrip } from '../lib/trip'
import { loadUpdates, type FeedPost } from '../lib/updates'

const RouteMap = lazy(() => import('../components/RouteMap'))

const MapPage = () => {
  const { trip } = useTrip()
  const [points, setPoints] = useState<RoutePoint[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
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
      const hit = p.blocks.find((b) => b.kind === 'photo' && b.mediaUrl && !b.route)
      const url = hit?.thumbUrl ?? hit?.mediaUrl
      if (p.checkin_id && url && !out[p.checkin_id]) out[p.checkin_id] = url
    }
    return out
  }, [posts])

  useIonViewWillEnter(refresh, [refresh])



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
          <IonFabButton aria-label="Check-in" onClick={() => setPicking(true)}>
            <IonIcon icon={locate} />
          </IonFabButton>
        </IonFab>

        <CheckinModal isOpen={picking} onClose={() => setPicking(false)} onPosted={refresh} />
        <LocationSheet
          point={selected}
          points={points ?? []}
          posts={posts}
          start={trip?.starts_on}
          mode="owner"
          onClose={() => setSelected(null)}
          onNavigate={setSelected}
        />
      </IonContent>
    </IonPage>
  )
}

export default MapPage
