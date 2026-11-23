import {
  IonApp,
  IonContent,
  IonIcon,
  IonLabel,
  IonPage,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { images, map, newspaper, settingsOutline } from 'ionicons/icons'
import { lazy, Suspense } from 'react'
import { Navigate, Route } from 'react-router-dom'

import { AuthProvider, useAuth } from './lib/auth'
import { CaptureProvider } from './lib/capture'
import { followerTokenFromPath, postTokenFromPath } from './lib/follower'
import { galleryTokenFromPath } from './lib/gallery'
import { inviteTokenFromPath } from './lib/members'
import { TripProvider, useTrip } from './lib/trip'
import CreateTripPage from './pages/CreateTripPage'
import FeedPage from './pages/FeedPage'
import GalleryPage from './pages/GalleryPage'
import LoginPage from './pages/LoginPage'
import MapPage from './pages/MapPage'
import TripSettingsPage from './pages/TripSettingsPage'
import PageSpinner from './components/PageSpinner'
import AppStatus from './components/AppStatus'
import UpdateBanner from './components/UpdateBanner'
import { isStandalone } from './lib/pwa'

const FollowerPage = lazy(() => import('./pages/FollowerPage'))
const SharedPostPage = lazy(() => import('./pages/SharedPostPage'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const AcceptInvitePage = lazy(() => import('./pages/AcceptInvitePage'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
const PublicGalleryPage = lazy(() => import('./pages/PublicGalleryPage'))

/** Unterpfad der App, z.B. "/wayfolio" auf GitHub Pages ("" lokal). */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')
const path = window.location.pathname.slice(basename.length) || '/'

/** Öffentliche Pfade, die ohne Anmeldung funktionieren. */
const followerToken = followerTokenFromPath(window.location.pathname)
const postToken = postTokenFromPath(window.location.pathname)
const inviteToken = inviteTokenFromPath(window.location.pathname)
const galleryToken = galleryTokenFromPath(window.location.pathname)
const wantsLogin = path.startsWith('/login')
const legalPage = path.startsWith('/impressum') ? 'impressum' : path.startsWith('/datenschutz') ? 'datenschutz' : null

const Loading = () => (
  <IonPage>
    <IonContent>
      <PageSpinner />
    </IonContent>
  </IonPage>
)

const Tabs = () => (
  <IonTabs>
    <IonRouterOutlet>
      <Route path="/feed" element={<FeedPage />} />
      <Route path="/karte" element={<MapPage />} />
      <Route path="/galerie" element={<GalleryPage />} />
      <Route path="/reise" element={<TripSettingsPage />} />
      <Route path="*" element={<Navigate to="/feed" replace />} />
    </IonRouterOutlet>

    <IonTabBar slot="bottom">
      <IonTabButton tab="feed" href="/feed">
        <IonIcon aria-hidden="true" icon={newspaper} />
        <IonLabel>Feed</IonLabel>
      </IonTabButton>
      <IonTabButton tab="karte" href="/karte">
        <IonIcon aria-hidden="true" icon={map} />
        <IonLabel>Karte</IonLabel>
      </IonTabButton>
      <IonTabButton tab="galerie" href="/galerie">
        <IonIcon aria-hidden="true" icon={images} />
        <IonLabel>Galerie</IonLabel>
      </IonTabButton>
      <IonTabButton tab="reise" href="/reise">
        <IonIcon aria-hidden="true" icon={settingsOutline} />
        <IonLabel>Reisen</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
)

const SignedIn = () => {
  const { trip, loading } = useTrip()
  if (loading) return <Loading />
  if (!trip) return <CreateTripPage />
  return (
    <CaptureProvider>
      <IonReactRouter basename={basename}>
        <Tabs />
      </IonReactRouter>
    </CaptureProvider>
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

/**
 * Follower ohne Konto, die Little Footnotes auf den Home-Bildschirm gelegt haben: die installierte App startet
 * auf der Startseite – dann direkt zu ihrem Reise-Link weiterleiten.
 */
const FOLLOWER_LINK_KEY = 'wayfolio-follower-link'
if (followerToken) {
  try {
    localStorage.setItem(FOLLOWER_LINK_KEY, window.location.pathname)
  } catch {
    /* egal */
  }
} else if (!legalPage && !galleryToken && !postToken && isStandalone()) {
  try {
    const saved = localStorage.getItem(FOLLOWER_LINK_KEY)
    const signedIn = Object.keys(localStorage).some((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
    if (saved && !signedIn) window.location.replace(saved)
  } catch {
    /* egal */
  }
}

const App = () => (
  <IonApp>
    <AppStatus />
    <UpdateBanner />
    {legalPage ? (
      <Suspense fallback={<Loading />}>
        <LegalPage page={legalPage} />
      </Suspense>
    ) : galleryToken ? (
      <Suspense fallback={<Loading />}>
        <PublicGalleryPage token={galleryToken} />
      </Suspense>
    ) : postToken ? (
      <Suspense fallback={<Loading />}>
        <SharedPostPage token={postToken} />
      </Suspense>
    ) : followerToken ? (
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
