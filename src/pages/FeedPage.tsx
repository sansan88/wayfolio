import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonText,
  IonTitle,
  IonToolbar,
  useIonActionSheet,
  useIonToast,
  useIonViewWillEnter,
} from '@ionic/react'
import { logOutOutline, shareSocialOutline } from 'ionicons/icons'
import { useCallback, useState } from 'react'

import PostCard from '../components/PostCard'
import StoryBar from '../components/StoryBar'
import { useAuth } from '../lib/auth'
import { useTrip } from '../lib/trip'
import {
  addOwnerReply,
  getOrCreateShareLink,
  hideReply,
  loadUpdates,
  resolvePoll,
  rotateShareLink,
  type FeedPost,
} from '../lib/updates'
import './FeedPage.css'

const FeedPage = () => {
  const { session, signOut } = useAuth()
  const { trip } = useTrip()
  const [presentToast] = useIonToast()
  const [presentSheet] = useIonActionSheet()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!trip) return
    try {
      setPosts(await loadUpdates(trip.id))
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

  const now = Date.now()
  const stories = posts.filter((p) => p.story_expires_at && Date.parse(p.story_expires_at) > now).reverse()
  const feed = posts.filter((p) => p.kind !== 'story')

  const card = (post: FeedPost) => (
    <PostCard
      key={post.id}
      post={post}
      mode="owner"
      onReply={(postId, body) => act(() => addOwnerReply(postId, session!.user.id, body))}
      onResolve={(pollId, optionId, text) => act(() => resolvePoll(pollId, optionId, text))}
      onHideReply={(id) => void act(() => hideReply(id))}
    />
  )

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{trip?.title ?? 'Feed'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => void openShare()} aria-label="Follower einladen">
              <IonIcon slot="icon-only" icon={shareSocialOutline} />
            </IonButton>
            <IonButton onClick={signOut} aria-label="Abmelden">
              <IonIcon slot="icon-only" icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={(e) => void refresh().finally(() => e.detail.complete())}>
          <IonRefresherContent />
        </IonRefresher>

        <StoryBar stories={stories} renderDetail={(p) => (p.kind !== 'story' ? card(p) : null)} />

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
              Erfasst im Tab «Erfassen» euer erstes Update. Mit dem Teilen-Symbol oben ladet ihr Familie und Freunde
              ein – sie brauchen weder App noch Konto.
            </IonCardContent>
          </IonCard>
        )}

        {feed.map(card)}
      </IonContent>
    </IonPage>
  )
}

export default FeedPage
