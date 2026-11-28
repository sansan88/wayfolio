import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonLoading,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
  IonButtons,
  useIonActionSheet,
  useIonAlert,
  useIonToast,
  useIonRouter,
  useIonViewWillEnter,
} from '@ionic/react'
import { add, compassOutline, shareSocialOutline } from 'ionicons/icons'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import CamperRefresher from '../components/CamperRefresher'
import ComposeModal from '../components/ComposeModal'
import FeedSkeleton from '../components/FeedSkeleton'
import GeoPermissionBanner from '../components/GeoPermissionBanner'
import NearbyModal from '../components/NearbyModal'
import PostCard, { dayNumber } from '../components/PostCard'
import ShareImageModal from '../components/ShareImageModal'
import TimelineDots from '../components/TimelineDots'
import { useAuth } from '../lib/auth'
import { useLocation, useNavigate } from 'react-router-dom'

import { useCapture } from '../lib/capture'
import { peekCache } from '../lib/offline'
import { sharePost } from '../lib/share'
import { useTimeline } from '../lib/useTimeline'
import { useTripShare } from '../lib/useTripShare'
import { loadRoute, type RoutePoint } from '../lib/route'
import { useTrip } from '../lib/trip'
import {
  addOwnerReply,
  createPost,
  deletePost,
  hideReply,
  loadUpdates,
  fillLinkTitles,
  regenerateRouteImages,
  revokePostLinks,
  updatePost,
  type FeedPost,
} from '../lib/updates'
import './FeedPage.css'

const FeedPage = () => {
  const { session } = useAuth()
  const { trip } = useTrip()
  const [presentToast] = useIonToast()
  const [presentSheet] = useIonActionSheet()
  const [presentAlert] = useIonAlert()
  const router = useIonRouter()
  // zuletzt gespeicherte Beiträge sofort zeigen, bis das Netz antwortet
  const [posts, setPosts] = useState<FeedPost[]>(() => (trip ? (peekCache<FeedPost[]>(`posts:${trip.id}`) ?? []) : []))
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [points, setPoints] = useState<RoutePoint[]>([])
  const [editing, setEditing] = useState<FeedPost | null>(null)
  const [writing, setWriting] = useState(false)
  const [busy, setBusy] = useState(false)
  const capture = useCapture()
  // «+» auf der Karte: dort gibt es keinen eigenen Dialog mehr, sondern denselben Beitrag hier
  const routerLocation = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    if ((routerLocation.state as { compose?: boolean } | null)?.compose) {
      capture.setAt(null)
      setWriting(true)
      navigate(routerLocation.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerLocation.state])
  const composeInitial = useMemo(
    () => ({ at: capture.at, place: capture.place, position: capture.position }),
    [capture.at, capture.place, capture.position],
  )
  const timeline = useTimeline(posts.map((p) => p.id))
  const [regen, setRegen] = useState<{ done: number; total: number } | null>(null)
  const regenStarted = useRef<string | null>(null)
  const editInitial = useMemo(() => {
    if (!editing) return undefined
    const point = points.find((p) => p.id === editing.checkin_id)
    return {
      // Titel, der nur den Ort wiederholt, nicht als eigenen Titel vorschlagen
      title: editing.title && editing.title !== editing.place_name && editing.title !== editing.place_name?.split(',')[0].trim() ? editing.title : '',
      text: editing.blocks.find((b) => b.kind === 'text')?.text ?? '',
      links: editing.blocks.filter((b) => b.kind === 'link' && b.url).map((b) => b.url!),
      at: new Date(editing.published_at),
      place: editing.place_name ? { name: editing.place_name, countryCode: null } : null,
      position: point ? { lat: point.lat, lon: point.lon, accuracy: 0 } : null,
      media: editing.blocks
        .filter((b) => b.id && b.mediaUrl && !b.route && ['photo', 'video', 'audio'].includes(b.kind))
        .map((b) => ({ blockId: b.id!, kind: b.kind, url: b.mediaUrl! })),
    }
  }, [editing, points])

  const refresh = useCallback(async () => {
    if (!trip) return
    try {
      setPosts(await loadUpdates(trip.id))
      loadRoute(trip.id).then(setPoints).catch(() => undefined)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoaded(true)
    }
  }, [trip])

  useIonViewWillEnter(() => {
    void refresh()
  }, [refresh])

  // andere Reise gewählt: deren gespeicherte Beiträge zeigen und neu laden
  const shownTrip = useRef(trip?.id)
  useEffect(() => {
    if (!trip || shownTrip.current === trip.id) return
    shownTrip.current = trip.id
    setPosts(peekCache<FeedPost[]>(`posts:${trip.id}`) ?? [])
    setLoaded(false)
    void refresh()
  }, [trip, refresh])

  const toast = (message: string, color: 'success' | 'danger' = 'success') =>
    presentToast({ message, duration: 2500, position: 'top', color })


  const openShare = useTripShare()
  /** Beitrag, für den gerade ein Instagram-Bild entsteht */
  const [imagePost, setImagePost] = useState<FeedPost | null>(null)
  const [exploring, setExploring] = useState(false)

  const act = (task: () => Promise<void>) =>
    task()
      .then(refresh)
      .catch((e: Error) => toast(e.message, 'danger'))

  const confirmDelete = (post: FeedPost) =>
    presentAlert({
      header: post.kind === 'story' ? 'Story löschen?' : 'Beitrag löschen?',
      message: 'Reaktionen und Antworten werden mitgelöscht. Fotos und Videos bleiben in der Galerie.',
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        { text: 'Löschen', role: 'destructive', handler: () => void act(() => deletePost(post.id)) },
      ],
    })

  /** Bearbeiten als iOS-Card-Modal (Titel, Text, Datum & Uhrzeit) */
  const editPost = (post: FeedPost) => setEditing(post)

  /** Beitrag teilen: nur diesen Beitrag (eigener Link) oder mit Link zur ganzen Reise */
  const shareAs = (post: FeedPost, scope: 'post' | 'trip') =>
    void sharePost(post, trip!.id, scope)
      .then((r) => {
        if (r === 'copied') void toast('Text mit Link kopiert – in WhatsApp einfügen')
      })
      .catch((e: Error) => toast(e.message, 'danger'))

  /** Teilen-Knopf: Link für WhatsApp & Co. oder Bild für Instagram */
  const openShareMenu = (post: FeedPost) =>
    presentSheet({
      header: 'Beitrag teilen',
      subHeader: '«Nur diesen Beitrag» zeigt der Gruppe genau diesen Beitrag – nicht die ganze Reise.',
      buttons: [
        // Teilen: nur dieser Beitrag (eigener Secret Link) oder mit Link zur ganzen Reise
        { text: 'Nur diesen Beitrag teilen', handler: () => shareAs(post, 'post') },
        { text: 'Mit Reise-Link teilen', handler: () => shareAs(post, 'trip') },
        { text: 'Bild für Instagram', handler: () => setImagePost(post) },
        { text: 'Abbrechen', role: 'cancel' },
      ],
    })

  /** «…»-Knopf: Bearbeiten, Links sperren, Löschen */
  const openMenu = (post: FeedPost) =>
    presentSheet({
      header: post.title ?? post.place_name?.split(',')[0] ?? 'Beitrag',
      buttons: [
        { text: 'Bearbeiten', handler: () => void editPost(post) },
        {
          text: 'Beitrags-Links sperren',
          handler: () =>
            void revokePostLinks(post.id)
              .then(() => toast('Links für diesen Beitrag gesperrt'))
              .catch((e: Error) => toast(e.message, 'danger')),
        },
        { text: 'Löschen', role: 'destructive', handler: () => void confirmDelete(post) },
        { text: 'Abbrechen', role: 'cancel' },
      ],
    })

  // ältere Routenbilder einmalig im Hintergrund neu zeichnen (näher am jeweiligen Ort)
  useEffect(() => {
    if (!trip || regenStarted.current === trip.id) return
    regenStarted.current = trip.id
    regenerateRouteImages(trip.id, (done, total) => setRegen({ done, total }))
      .then((n) => {
        if (n > 0) void refresh()
      })
      .catch((e: Error) => console.warn('Routenbilder nicht aktualisiert', e))
      .finally(() => setRegen(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id])

  // Links ohne gespeicherten Titel (ältere Beiträge) einmalig im Hintergrund ergänzen
  const titlesRunning = useRef(false)
  useEffect(() => {
    if (!posts?.length || titlesRunning.current) return
    titlesRunning.current = true
    void fillLinkTitles(posts)
      .then((n) => {
        if (n > 0) void refresh()
      })
      .catch(() => undefined)
      .finally(() => (titlesRunning.current = false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts])

  // fehlende Tage bis heute (bzw. Reiseende): Tipp setzt den Zeitpunkt auf diesen Tag und öffnet «Neues Update»
  const missingDays = useMemo(() => {
    const end = trip?.ends_on ? new Date(`${trip.ends_on}T23:59`) : null
    return {
      until: end && end < new Date() ? end : new Date(),
      onAdd: (day: Date) => {
        const noon = new Date(day)
        noon.setHours(12, 0, 0, 0)
        capture.setAt(noon > new Date() ? null : noon)
        openCreate()
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.ends_on, posts.length])

  /** «+»: eine Art, Neues zu erfassen – der Beitrag (Ort, Fotos, Text, Links; Rückblick über Claude im Dialog) */
  const openCreate = () => {
    setWriting(true)
  }

  // Reisetag ab Reisebeginn, sonst ab dem ältesten Update
  const tripStart = trip?.starts_on ?? posts.at(-1)?.published_at ?? null
  const card = (post: FeedPost) => (
    <div key={post.id} data-post-id={post.id}>
    <PostCard
      post={post}
      day={dayNumber(post.published_at, tripStart)}
      mode="owner"
      onReply={(postId, body) => act(() => addOwnerReply(postId, session!.user.id, body))}
      onHideReply={(id) => void act(() => hideReply(id))}
      onMenu={openMenu}
      onShare={openShareMenu}
      onPlace={(p) => router.push(`/karte?ort=${p.checkin_id}`, 'forward', 'replace')}
    />
    </div>
  )

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => setExploring(true)} aria-label="In der Nähe entdecken">
              <IonIcon slot="icon-only" icon={compassOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>{trip?.title ?? 'Feed'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => void openShare()} aria-label="Reise teilen">
              <IonIcon slot="icon-only" icon={shareSocialOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        {(posts.length > 0 || trip?.starts_on) && (
          <IonToolbar className="timeline-toolbar">
            <TimelineDots
              posts={posts}
              activeId={timeline.activeId}
              start={tripStart}
              onSelect={(p) => void timeline.jumpTo(p.id)}
              missingDays={loaded ? missingDays : undefined}
            />
          </IonToolbar>
        )}
      </IonHeader>
      <IonContent ref={timeline.contentRef} color="light" scrollEvents onIonScroll={timeline.onScroll}>
        <CamperRefresher onRefresh={() => refresh()} />
        <GeoPermissionBanner />
        {regen && (
          <p className="regen-note" role="status">
            Kartenausschnitte werden aktualisiert … {regen.done}/{regen.total}
          </p>
        )}

        {error && (
          <IonText color="danger">
            <p className="ion-padding">{error}</p>
          </IonText>
        )}

        {posts.length === 0 && !loaded && !error && <FeedSkeleton />}

        {posts.length === 0 && loaded && !error && (
          <IonCard>
            <IonCardHeader>
              <IonCardSubtitle>Noch keine Updates</IonCardSubtitle>
              <IonCardTitle>Eure Reise beginnt hier</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              Tippt auf «+» unten rechts: ein Check-in mit Fotos («ich bin hier») oder ein Beitrag mit Text. Mit dem Teilen-Symbol oben ladet ihr Familie und Freunde
              ein – sie brauchen weder App noch Konto.
            </IonCardContent>
          </IonCard>
        )}

        {posts.map(card)}

        <ComposeModal
          kind={editing ? 'edit' : null}
          tripId={trip?.id}
          initial={editInitial}
          onCancel={() => setEditing(null)}
          onSubmit={(_k, r) => {
            // Dialog bleibt offen, bis gespeichert ist – bei einem Fehler gehen keine Eingaben verloren
            const post = editing!
            return updatePost(post, trip!.id, session!.user.id, {
              title: r.title,
              text: r.text,
              links: r.links,
              at: r.at,
              location: r.location,
              files: r.files,
              removedBlockIds: r.removedBlockIds,
              mediaOrder: r.mediaOrder,
            })
              .then(() => {
                setEditing(null)
                toast('Beitrag aktualisiert')
                void refresh()
              })
              .catch((e: Error) => {
                toast(`Nicht gespeichert: ${e.message}`, 'danger')
                throw e
              })
          }}
        />
        <NearbyModal isOpen={exploring} tripId={trip?.id ?? null} onClose={() => setExploring(false)} />
        <ShareImageModal
          post={imagePost}
          day={imagePost ? dayNumber(imagePost.published_at, tripStart) : null}
          onClose={() => setImagePost(null)}
        />
        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton
            aria-label="Erfassen"
            onClick={() => {
              capture.setAt(null)
              void openCreate()
            }}
          >
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
        <ComposeModal
          kind={writing ? 'post' : null}
          tripId={trip?.id}
          initial={composeInitial}
          onCancel={() => setWriting(false)}
          onSubmit={(_k, r) => {
            setBusy(true)
            return (
              createPost(
                {
                  tripId: trip!.id,
                  userId: session!.user.id,
                  position: r.location?.position ?? r.autoLocation?.position ?? capture.position,
                  place: r.location?.place ?? r.autoLocation?.place ?? capture.place,
                  at: r.at,
                  source: r.location ? 'manual' : 'gps',
                  lockPlace: !!r.location,
                },
                { title: r.title, text: r.text, files: r.files, links: r.links, recap: r.recap },
              )
                .then(() => {
                  setWriting(false)
                  toast('Beitrag veröffentlicht')
                  void refresh()
                })
                .catch((e: Error) => {
                  toast(`Nicht veröffentlicht: ${e.message}`, 'danger')
                  throw e
                })
                .finally(() => setBusy(false))
            )
          }}
        />
        <IonLoading isOpen={busy} message="Beitrag wird veröffentlicht …" />
      </IonContent>
    </IonPage>
  )
}

export default FeedPage
