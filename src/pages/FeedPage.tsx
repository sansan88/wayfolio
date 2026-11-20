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
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonText,
  IonTitle,
  IonToolbar,
  IonPage,
  useIonViewWillEnter,
} from '@ionic/react'
import { close, location, logOutOutline } from 'ionicons/icons'
import { useCallback, useState } from 'react'

import { useAuth } from '../lib/auth'
import { useTrip } from '../lib/trip'
import { loadUpdates, type FeedPost } from '../lib/updates'
import './FeedPage.css'

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('de-CH', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const firstImage = (post: FeedPost) => post.blocks.find((b) => b.imageUrl)?.imageUrl ?? null

const FeedPage = () => {
  const { signOut } = useAuth()
  const { trip } = useTrip()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [error, setError] = useState<string | null>(null)
  const [openStory, setOpenStory] = useState<FeedPost | null>(null)

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

  const now = Date.now()
  const stories = posts.filter((p) => p.kind === 'story' && p.story_expires_at && Date.parse(p.story_expires_at) > now)
  const feed = posts.filter((p) => p.kind !== 'story')

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{trip?.title ?? 'Feed'}</IonTitle>
          <IonButtons slot="end">
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

        {stories.length > 0 && (
          <div className="stories" aria-label="Stories">
            {stories.map((story) => (
              <button key={story.id} type="button" className="story" onClick={() => setOpenStory(story)}>
                <div className="story__ring">
                  {firstImage(story) ? (
                    <img className="story__image" src={firstImage(story)!} alt="" />
                  ) : (
                    <div className="story__image" />
                  )}
                </div>
                <span className="story__label">{story.title?.split(',')[0] ?? 'Story'}</span>
              </button>
            ))}
          </div>
        )}

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
              Setzt im Tab «Erfassen» euren ersten Standort oder ladet ein Foto hoch. Standorte erscheinen hier im
              Feed, einzelne Fotos oben als Story.
            </IonCardContent>
          </IonCard>
        )}

        {feed.map((post) => (
          <IonCard key={post.id}>
            {firstImage(post) && <img src={firstImage(post)!} alt="" />}
            <IonCardHeader>
              <IonCardSubtitle>{formatTime(post.published_at)}</IonCardSubtitle>
              <IonCardTitle className="feed__title">
                {post.kind === 'route_update' && <IonIcon icon={location} color="primary" aria-hidden="true" />}
                {post.title ?? post.checkin?.place_name ?? 'Update'}
              </IonCardTitle>
            </IonCardHeader>
            {post.kind === 'route_update' && (
              <IonCardContent>Neuer Standort auf der Route. Das Routenbild folgt in einer nächsten Version.</IonCardContent>
            )}
            {post.blocks
              .filter((b) => b.text_content)
              .map((b) => (
                <IonCardContent key={b.position}>{b.text_content}</IonCardContent>
              ))}
          </IonCard>
        ))}

        <IonModal isOpen={openStory !== null} onDidDismiss={() => setOpenStory(null)} className="story-modal">
          {openStory && (
            <div className="story-view" onClick={() => setOpenStory(null)}>
              {firstImage(openStory) && <img src={firstImage(openStory)!} alt={openStory.title ?? 'Story'} />}
              <div className="story-view__meta">
                <strong>{openStory.title ?? 'Story'}</strong>
                <span>{formatTime(openStory.published_at)}</span>
              </div>
              <IonButton fill="clear" color="light" className="story-view__close" aria-label="Schliessen">
                <IonIcon slot="icon-only" icon={close} />
              </IonButton>
            </div>
          )}
        </IonModal>
      </IonContent>
    </IonPage>
  )
}

export default FeedPage
