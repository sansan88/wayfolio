import { IonContent, IonFab, IonFabButton, IonIcon, IonPage, IonText, useIonViewDidLeave, useIonViewWillEnter } from '@ionic/react'
import { add } from 'ionicons/icons'
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

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

  // Ionic lässt verlassene Tabs stehen: die Karte (WebGL, Kacheln, Foto-Marker) beim Verlassen abbauen und beim
  // Zurückkehren neu aufbauen – sonst bleibt sie im Hintergrund im Speicher, was iOS zum Neuladen der Seite bringt.
  const [active, setActive] = useState(true)
  useIonViewWillEnter(() => setActive(true))
  useIonViewDidLeave(() => setActive(false))

  // aus dem Feed: /karte?ort=<checkin_id> – zu diesem Punkt springen und Details zeigen
  const location = useLocation()
  const navigate = useNavigate()
  const wanted = new URLSearchParams(location.search).get('ort')
  useEffect(() => {
    if (!wanted || !points) return
    const p = points.find((x) => x.id === wanted)
    if (p) setSelected(p)
    navigate(location.pathname, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, points])



  return (
    <IonPage>
      <PageHeader title="Karte" />
      <IonContent scrollY={false}>
        {error && (
          <IonText color="danger">
            <p className="ion-padding">{error}</p>
          </IonText>
        )}
        {points && active && (
          <Suspense fallback={null}>
            <RouteMap points={points} photos={photos} onSelect={setSelected} focus={selected} />
          </Suspense>
        )}
        {points?.length === 0 && (
          <IonText color="medium">
            <p className="ion-padding" style={{ position: 'absolute', top: 0, background: 'var(--ion-background-color)' }}>
              Noch keine Standorte. Tippt unten rechts auf «+», um euren ersten Beitrag mit Ort zu erfassen.
            </p>
          </IonText>
        )}

        <IonFab slot="fixed" vertical="bottom" horizontal="end" className="map__fab">
          <IonFabButton aria-label="Neuer Beitrag" onClick={() => navigate('/feed', { state: { compose: true } })}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

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
