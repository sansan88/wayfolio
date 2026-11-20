import {
  IonApp,
  IonContent,
  IonIcon,
  IonLabel,
  IonPage,
  IonRouterOutlet,
  IonSpinner,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { addCircle, map, newspaper } from 'ionicons/icons'
import { Navigate, Route } from 'react-router-dom'

import { AuthProvider, useAuth } from './lib/auth'
import { TripProvider, useTrip } from './lib/trip'
import CapturePage from './pages/CapturePage'
import CreateTripPage from './pages/CreateTripPage'
import FeedPage from './pages/FeedPage'
import LoginPage from './pages/LoginPage'
import MapPage from './pages/MapPage'

/** Unterpfad der App, z.B. "/wayfolio" auf GitHub Pages ("" lokal). */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

const Loading = () => (
  <IonPage>
    <IonContent className="ion-padding ion-text-center">
      <IonSpinner style={{ marginTop: '40vh' }} />
    </IonContent>
  </IonPage>
)

const Tabs = () => (
  <IonTabs>
    <IonRouterOutlet>
      <Route path="/feed" element={<FeedPage />} />
      <Route path="/karte" element={<MapPage />} />
      <Route path="/erfassen" element={<CapturePage />} />
      <Route path="*" element={<Navigate to="/erfassen" replace />} />
    </IonRouterOutlet>

    <IonTabBar slot="bottom">
      <IonTabButton tab="feed" href="/feed">
        <IonIcon aria-hidden="true" icon={newspaper} />
        <IonLabel>Feed</IonLabel>
      </IonTabButton>
      <IonTabButton tab="erfassen" href="/erfassen">
        <IonIcon aria-hidden="true" icon={addCircle} />
        <IonLabel>Erfassen</IonLabel>
      </IonTabButton>
      <IonTabButton tab="karte" href="/karte">
        <IonIcon aria-hidden="true" icon={map} />
        <IonLabel>Karte</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
)

const SignedIn = () => {
  const { trip, loading } = useTrip()
  if (loading) return <Loading />
  if (!trip) return <CreateTripPage />
  return (
    <IonReactRouter basename={basename}>
      <Tabs />
    </IonReactRouter>
  )
}

const Root = () => {
  const { session, loading } = useAuth()
  if (loading) return <Loading />
  if (!session) return <LoginPage />
  return (
    <TripProvider>
      <SignedIn />
    </TripProvider>
  )
}

const App = () => (
  <IonApp>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </IonApp>
)

export default App
