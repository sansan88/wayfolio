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
  IonIcon,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonText,
  useIonActionSheet,
  useIonAlert,
  useIonToast,
  useIonViewWillEnter,
} from '@ionic/react'
import { add, shareSocialOutline } from 'ionicons/icons'
import { useCallback, useMemo, useState } from 'react'

import CaptureModal from '../components/CaptureModal'
import ComposeModal from '../components/ComposeModal'
import { LargeTitle, PageHeader } from '../components/PageHeader'
import PostCard, { dayNumber } from '../components/PostCard'
import StoryBar from '../components/StoryBar'
import { useAuth } from '../lib/auth'
import { loadRoute, type RoutePoint } from '../lib/route'
import { useTrip } from '../lib/trip'
import {
  addOwnerReply,
  deletePost,
  getOrCreateShareLink,
  hideReply,
  loadUpdates,
  resolvePoll,
  rotateShareLink,
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
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [error, setError] = useState<string | null>(null)
  const [points, setPoints] = useState<RoutePoint[]>([])
  const [editing, setEditing] = useState<FeedPost | null>(null)
  const [capturing, setCapturing] = useState(false)
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
    }
  }, [trip])

  useIonViewWillEnter(() => {
    void refresh()
  }, [refresh])

  const toast = (message: string, color: 'success' | 'danger' = 'success') =>
    presentToast({ message, duration: 2500, position: 'top', color })

  const shareUrl = async (url: string) => {
    const text = `Folgt unserer Reise «${trip?.title}» – ohne App und ohne Konto:`
    if (navigator.share) {
      await navigator.share({ title: trip?.title, text, url }).catch(() => undefined)
    } else {
      await navigator.clipboard.writeText(url)
      toast('Follower-Link kopiert')
    }
  }

  const openShare = async () => {
    if (!trip) return
    try {
      const url = await getOrCreateShareLink(trip.id)
      await presentSheet({
        header: 'Follower einladen',
        subHeader: url,
        buttons: [
          { text: 'Link teilen', handler: () => void shareUrl(url) },
          {
            text: 'Link kopieren',
            handler: () => void navigator.clipboard.writeText(url).then(() => toast('Follower-Link kopiert')),
          },
          {
            text: 'Neuen Link erzeugen (alter wird gesperrt)',
            role: 'destructive',
            handler: () => void rotateShareLink(trip.id).then((u) => shareUrl(u)),
          },
          { text: 'Abbrechen', role: 'cancel' },
        ],
      })
    } catch (e) {
      toast((e as Error).message, 'danger')
    }
  }

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
        ...(post.kind !== 'poll' ? [{ text: 'Bearbeiten', handler: () => void editPost(post) }] : []),
        { text: 'Löschen', role: 'destructive', handler: () => void confirmDelete(post) },
        { text: 'Abbrechen', role: 'cancel' },
      ],
    })

  const now = Date.now()
  const stories = posts.filter((p) => p.story_expires_at && Date.parse(p.story_expires_at) > now).reverse()
  const feed = posts.filter((p) => p.kind !== 'story')

  // Reisetag ab Reisebeginn, sonst ab dem ältesten Update
  const tripStart = trip?.starts_on ?? posts.at(-1)?.published_at ?? null
  const card = (post: FeedPost) => (
    <PostCard
      key={post.id}
      post={post}
      day={dayNumber(post.published_at, tripStart)}
      mode="owner"
      onReply={(postId, body) => act(() => addOwnerReply(postId, session!.user.id, body))}
      onResolve={(pollId, optionId, text) => act(() => resolvePoll(pollId, optionId, text))}
      onHideReply={(id) => void act(() => hideReply(id))}
      onMenu={openMenu}
    />
  )

  return (
    <IonPage>
      <PageHeader
        title={trip?.title ?? 'Feed'}
        end={
          <IonButton onClick={() => void openShare()} aria-label="Follower einladen">
            <IonIcon slot="icon-only" icon={shareSocialOutline} />
          </IonButton>
        }
      />
      <IonContent fullscreen color="light">
        <LargeTitle title={trip?.title ?? 'Feed'} />
        <IonRefresher slot="fixed" onIonRefresh={(e) => void refresh().finally(() => e.detail.complete())}>
          <IonRefresherContent />
        </IonRefresher>

        <StoryBar
          stories={stories}
          renderDetail={(p) => (p.kind !== 'story' ? card(p) : null)}
          onDelete={(p) => void confirmDelete(p)}
        />

        {error && (
          <IonText color="danger">
            <p className="ion-padding">{error}</p>
          </IonText>
        )}

        {feed.length === 0 && stories.length === 0 && !error && (
          <IonCard>
            <IonCardHeader>
              <IonCardSubtitle>Noch keine Updates</IonCardSubtitle>
              <IonCardTitle>Eure Reise beginnt hier</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              Tippt auf «+» unten rechts und erfasst euer erstes Update. Mit dem Teilen-Symbol oben ladet ihr Familie und Freunde
              ein – sie brauchen weder App noch Konto.
            </IonCardContent>
          </IonCard>
        )}

        {feed.map(card)}

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
          <IonFabButton aria-label="Erfassen" onClick={() => setCapturing(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
        <CaptureModal isOpen={capturing} onClose={() => setCapturing(false)} onPosted={() => void refresh()} />
      </IonContent>
    </IonPage>
  )
}

export default FeedPage
