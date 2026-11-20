import {
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react'
import { lazy, Suspense, useState } from 'react'

import { loadRoute, type RoutePoint } from '../lib/route'
import { useTrip } from '../lib/trip'

const RouteMap = lazy(() => import('../components/RouteMap'))

const MapPage = () => {
  const { trip } = useTrip()
  const [points, setPoints] = useState<RoutePoint[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useIonViewWillEnter(() => {
    if (!trip) return
    loadRoute(trip.id)
      .then(setPoints)
      .catch((e: Error) => setError(e.message))
  }, [trip])

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Karte</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false}>
        {error && (
          <IonText color="danger">
            <p className="ion-padding">{error}</p>
          </IonText>
        )}
        {points && (
          <Suspense fallback={null}>
            <RouteMap points={points} />
          </Suspense>
        )}
        {points?.length === 0 && (
          <IonText color="medium">
            <p className="ion-padding" style={{ position: 'absolute', top: 0, background: 'var(--ion-background-color)' }}>
              Noch keine Standorte. Setzt im Tab «Erfassen» euren ersten Standort.
            </p>
          </IonText>
        )}
      </IonContent>
    </IonPage>
  )
}

export default MapPage
