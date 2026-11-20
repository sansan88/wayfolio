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
import { addCircle, map, newspaper, settingsOutline } from 'ionicons/icons'
import { lazy, Suspense } from 'react'
import { Navigate, Route } from 'react-router-dom'

import { AuthProvider, useAuth } from './lib/auth'
import { followerTokenFromPath } from './lib/follower'
import { inviteTokenFromPath } from './lib/members'
import { TripProvider, useTrip } from './lib/trip'
import CapturePage from './pages/CapturePage'
import CreateTripPage from './pages/CreateTripPage'
import FeedPage from './pages/FeedPage'
import LoginPage from './pages/LoginPage'
import MapPage from './pages/MapPage'
import TripSettingsPage from './pages/TripSettingsPage'

const FollowerPage = lazy(() => import('./pages/FollowerPage'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const AcceptInvitePage = lazy(() => import('./pages/AcceptInvitePage'))

/** Unterpfad der App, z.B. "/wayfolio" auf GitHub Pages ("" lokal). */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')
const path = window.location.pathname.slice(basename.length) || '/'

/** Öffentliche Pfade, die ohne Anmeldung funktionieren. */
const followerToken = followerTokenFromPath(window.location.pathname)
const inviteToken = inviteTokenFromPath(window.location.pathname)
const wantsLogin = path.startsWith('/login')

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
      <Route path="/reise" element={<TripSettingsPage />} />
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
      <IonTabButton tab="reise" href="/reise">
        <IonIcon aria-hidden="true" icon={settingsOutline} />
        <IonLabel>Reise</IonLabel>
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
  if (!session) {
    if (inviteToken || wantsLogin) return <LoginPage invite={!!inviteToken} />
    return (
      <Suspense fallback={<Loading />}>
        <LandingPage />
      </Suspense>
    )
  }
  if (inviteToken)
    return (
      <Suspense fallback={<Loading />}>
        <AcceptInvitePage token={inviteToken} />
      </Suspense>
    )
  if (wantsLogin) {
    // Bereits angemeldet: /login nicht im Verlauf lassen
    window.history.replaceState(null, '', import.meta.env.BASE_URL)
  }
  return (
    <TripProvider>
      <SignedIn />
    </TripProvider>
  )
}

const App = () => (
  <IonApp>
    {followerToken ? (
      <Suspense fallback={<Loading />}>
        <FollowerPage token={followerToken} />
      </Suspense>
    ) : (
      <AuthProvider>
        <Root />
      </AuthProvider>
    )}
  </IonApp>
)

export default App
