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
  IonRefresher,
  IonRefresherContent,
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
import { add, shareSocialOutline } from 'ionicons/icons'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import CheckinModal from '../components/CheckinModal'
import ComposeModal from '../components/ComposeModal'
import FeedSkeleton from '../components/FeedSkeleton'
import GeoPermissionBanner from '../components/GeoPermissionBanner'
import PostCard, { dayNumber } from '../components/PostCard'
import TimelineDots from '../components/TimelineDots'
import { useAuth } from '../lib/auth'
import { useCapture } from '../lib/capture'
import { peekCache } from '../lib/offline'
import { sharePost } from '../lib/share'
import { useTimeline } from '../lib/useTimeline'
import { useTripShare } from '../lib/useTripShare'
import { loadRoute, type RoutePoint } from '../lib/route'
import { useTrip } from '../lib/trip'
import {
  addOwnerReply,
  createFeedPost,
  deletePost,
  hideReply,
  loadUpdates,
  regenerateRouteImages,
  resolvePoll,
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
  const [checkingIn, setCheckingIn] = useState(false)
  const [writing, setWriting] = useState(false)
  const [busy, setBusy] = useState(false)
  const capture = useCapture()
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
      title: editing.title ?? '',
      text: editing.blocks.find((b) => b.kind === 'text')?.text ?? '',
      link: editing.blocks.find((b) => b.kind === 'link')?.url ?? '',
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

  const openMenu = (post: FeedPost) =>
    presentSheet({
      header: post.title ?? 'Beitrag',
      buttons: [
        {
          text: 'Teilen (WhatsApp …)',
          handler: () =>
            void sharePost(post, trip!.id)
              .then((r) => {
                if (r === 'copied') void toast('Text mit Link kopiert – in WhatsApp einfügen')
              })
              .catch((e: Error) => toast(e.message, 'danger')),
        },
        ...(post.kind !== 'poll' ? [{ text: 'Bearbeiten', handler: () => void editPost(post) }] : []),
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

  // fehlende Tage bis heute (bzw. Reiseende): Tipp setzt den Zeitpunkt auf diesen Tag und öffnet «Neues Update»
  const missingDays = useMemo(() => {
    const end = trip?.ends_on ? new Date(`${trip.ends_on}T23:59`) : null
    return {
      until: end && end < new Date() ? end : new Date(),
      onAdd: (day: Date) => {
        const noon = new Date(day)
        noon.setHours(12, 0, 0, 0)
        capture.setAt(noon > new Date() ? null : noon)
        void openCreate(`Update für ${day.toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' })}`)
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.ends_on, posts.length])

  /** «+»: die zwei Arten von Updates */
  const openCreate = (header = 'Neues Update') =>
    presentSheet({
      header,
      buttons: [
        { text: 'Check-in – ich bin hier (mit Fotos)', handler: () => setCheckingIn(true) },
        { text: 'Beitrag – Text mit Fotos', handler: () => setWriting(true) },
        { text: 'Abbrechen', role: 'cancel' },
      ],
    })

  // Reisetag ab Reisebeginn, sonst ab dem ältesten Update
  const tripStart = trip?.starts_on ?? posts.at(-1)?.published_at ?? null
  const card = (post: FeedPost) => (
    <div key={post.id} data-post-id={post.id}>
    <PostCard
      post={post}
      day={dayNumber(post.published_at, tripStart)}
      mode="owner"
      onReply={(postId, body) => act(() => addOwnerReply(postId, session!.user.id, body))}
      onResolve={(pollId, optionId, text) => act(() => resolvePoll(pollId, optionId, text))}
      onHideReply={(id) => void act(() => hideReply(id))}
      onMenu={openMenu}
      onPlace={(p) => router.push(`/karte?ort=${p.checkin_id}`, 'forward', 'replace')}
    />
    </div>
  )

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
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
        <IonRefresher slot="fixed" onIonRefresh={(e) => void refresh().finally(() => e.detail.complete())}>
          <IonRefresherContent />
        </IonRefresher>
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
          initial={editInitial}
          onCancel={() => setEditing(null)}
          onSubmit={(_k, r) => {
            const post = editing!
            setEditing(null)
            void act(() =>
              updatePost(post, trip!.id, session!.user.id, {
                title: r.title,
                text: r.text,
                link: r.link,
                at: r.at,
                location: r.location,
                files: r.files,
                removedBlockIds: r.removedBlockIds,
              }),
            ).then(() => toast('Beitrag aktualisiert'))
          }}
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
        <CheckinModal isOpen={checkingIn} onClose={() => setCheckingIn(false)} onPosted={() => void refresh()} />
        <ComposeModal
          kind={writing ? 'post' : null}
          initial={composeInitial}
          onCancel={() => setWriting(false)}
          onSubmit={(_k, r) => {
            setWriting(false)
            setBusy(true)
            void act(() =>
              createFeedPost(
                {
                  tripId: trip!.id,
                  userId: session!.user.id,
                  position: r.location?.position ?? capture.position,
                  place: r.location?.place ?? capture.place,
                  at: r.at,
                  source: r.location ? 'manual' : capture.source,
                  lockPlace: !!r.location,
                },
                r.title,
                r.text,
                r.files,
                r.link,
              ),
            )
              .then(() => toast('Beitrag veröffentlicht'))
              .finally(() => setBusy(false))
          }}
        />
        <IonLoading isOpen={busy} message="Beitrag wird veröffentlicht …" />
      </IonContent>
    </IonPage>
  )
}

export default FeedPage
