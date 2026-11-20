import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react'
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'

import PostCard, { dayNumber } from '../components/PostCard'
import StoryBar from '../components/StoryBar'
import { followerApi, type FollowerFeed } from '../lib/follower'
import { useCardPresenter } from '../lib/modal'
import type { FeedPost } from '../lib/updates'
import './FeedPage.css'
import './LoginPage.css'
import PageSpinner from '../components/PageSpinner'
import LocationSheet from '../components/LocationSheet'
import type { RoutePoint } from '../lib/route'

const RouteMap = lazy(() => import('../components/RouteMap'))

const frequencyLabel = { instant: 'bei jedem Beitrag', weekly: 'wöchentlich', monthly: 'monatlich' } as const

/** Ansicht für Familie und Freunde – ohne Konto, nur über den Secret Link. */
const FollowerPage = ({ token }: { token: string }) => {
  const api = useMemo(() => followerApi(token), [token])
  const [presentToast] = useIonToast()
  const [data, setData] = useState<FollowerFeed | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'feed' | 'karte'>('feed')
  const [askName, setAskName] = useState(false)
  const namePresenter = useCardPresenter(askName)
  const [selected, setSelected] = useState<RoutePoint | null>(null)
  const [name, setName] = useState('')
  const [pending, setPending] = useState<(() => Promise<unknown>) | null>(null)
  const [email, setEmail] = useState('')
  const [frequency, setFrequency] = useState<'instant' | 'weekly' | 'monthly'>('weekly')

  const load = useCallback(async () => {
    try {
      setData(await api.feed())
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [api])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (data?.trip.title) document.title = `${data.trip.title} · Wayfolio`
  }, [data?.trip.title])

  const toast = (message: string, color: 'success' | 'danger' | 'medium' = 'success') =>
    presentToast({ message, duration: 2500, position: 'top', color })

  /** Führt eine Aktion aus; fragt beim ersten Mal nach dem Namen. */
  const withName = async (action: () => Promise<unknown>) => {
    if (!data?.follower) {
      setPending(() => action)
      setAskName(true)
      return
    }
    try {
      await action()
      await load()
    } catch (e) {
      toast((e as Error).message, 'danger')
    }
  }

  const join = async () => {
    try {
      await api.join(name.trim())
      setAskName(false)
      if (pending) await pending()
      setPending(null)
      await load()
    } catch (e) {
      toast((e as Error).message, 'danger')
    }
  }

  const subscribe = () =>
    withName(async () => {
      await api.subscribe(email, frequency)
      toast('Danke! Du bist für den Newsletter vorgemerkt.')
    })

  if (error && !data)
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="login">
            <h1>Wayfolio</h1>
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
            <p>Frag die Reisenden nach einem neuen Link.</p>
          </div>
        </IonContent>
      </IonPage>
    )

  if (!data)
    return (
      <IonPage>
        <IonContent>
          <PageSpinner />
        </IonContent>
      </IonPage>
    )

  const now = Date.now()
  const stories = data.posts.filter((p) => p.story_expires_at && Date.parse(p.story_expires_at) > now).reverse()
  const feed = data.posts.filter((p) => p.kind !== 'story')

  const card = (post: FeedPost) => (
    <PostCard
      key={post.id}
      post={post}
      day={dayNumber(post.published_at, data?.trip.starts_on ?? data?.posts.at(-1)?.published_at)}
      mode="follower"
      onReact={(postId, emoji) => void withName(() => api.react(postId, emoji))}
      onVote={(_pollId, optionId) => void withName(() => api.vote(optionId))}
      onReply={(postId, body, isPrivate) =>
        withName(async () => {
          await api.reply(postId, body, isPrivate)
          toast(isPrivate ? 'Antwort privat an die Reisenden gesendet' : 'Antwort gesendet')
        })
      }
    />
  )

  // pro Ort das neueste Foto als Marker (ohne Routenbilder)
  const photos: Record<string, string> = {}
  for (const p of data.posts) {
    const url = p.blocks.find((b) => b.kind === 'photo' && b.mediaUrl && !b.route)?.mediaUrl
    if (p.checkin_id && url && !photos[p.checkin_id]) photos[p.checkin_id] = url
  }

  const segment = (
    <IonSegment value={tab} onIonChange={(e) => setTab(e.detail.value as 'feed' | 'karte')}>
      <IonSegmentButton value="feed">
        <IonLabel>Tagebuch</IonLabel>
      </IonSegmentButton>
      <IonSegmentButton value="karte">
        <IonLabel>Route</IonLabel>
      </IonSegmentButton>
    </IonSegment>
  )

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>{data.trip.title}</IonTitle>
        </IonToolbar>
        {tab === 'karte' && <IonToolbar>{segment}</IonToolbar>}
      </IonHeader>
      <IonContent scrollY={tab === 'feed'} fullscreen={tab === 'feed'} color="light">
        {tab === 'feed' && (
          <IonHeader collapse="condense">
            <IonToolbar>
              <IonTitle size="large">{data.trip.title}</IonTitle>
            </IonToolbar>
            <IonToolbar>{segment}</IonToolbar>
          </IonHeader>
        )}
        {tab === 'karte' ? (
          <Suspense fallback={null}>
            <RouteMap points={data.route} photos={photos} onSelect={setSelected} focus={selected} />
          </Suspense>
        ) : (
          <>
            <IonRefresher slot="fixed" onIonRefresh={(e) => void load().finally(() => e.detail.complete())}>
              <IonRefresherContent />
            </IonRefresher>
            <StoryBar stories={stories} renderDetail={(p) => (p.kind !== 'story' ? card(p) : null)} />

            {feed.length === 0 && stories.length === 0 && (
              <IonCard>
                <IonCardContent>Noch keine Beiträge. Schau bald wieder vorbei!</IonCardContent>
              </IonCard>
            )}
            {feed.map(card)}

            <IonCard className="newsletter">
              <IonCardHeader>
                <IonCardTitle>Updates per E-Mail</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {data.subscription && data.subscription.status !== 'unsubscribed' ? (
                  <>
                    <p>
                      Du bekommst Updates {frequencyLabel[data.subscription.frequency]} an {data.subscription.email}
                      {data.subscription.status === 'pending' && ' (Bestätigung ausstehend)'}.
                    </p>
                    <IonButton size="small" fill="clear" color="medium" onClick={() => void withName(() => api.unsubscribe())}>
                      Abmelden
                    </IonButton>
                  </>
                ) : (
                  <>
                    <IonInput
                      type="email"
                      fill="outline"
                      label="E-Mail"
                      labelPlacement="floating"
                      value={email}
                      onIonInput={(e) => setEmail(String(e.detail.value ?? ''))}
                    />
                    <IonSelect
                      className="ion-margin-top"
                      fill="outline"
                      label="Wie oft?"
                      labelPlacement="floating"
                      value={frequency}
                      onIonChange={(e) => setFrequency(e.detail.value)}
                    >
                      <IonSelectOption value="instant">Bei jedem Beitrag</IonSelectOption>
                      <IonSelectOption value="weekly">Wöchentlich</IonSelectOption>
                      <IonSelectOption value="monthly">Monatlich</IonSelectOption>
                    </IonSelect>
                    <IonButton className="ion-margin-top" expand="block" disabled={!email.includes('@')} onClick={() => void subscribe()}>
                      Anmelden
                    </IonButton>
                    <IonNote>Jederzeit abbestellbar. Kein Konto nötig.</IonNote>
                  </>
                )}
              </IonCardContent>
            </IonCard>
            <p className="ion-text-center">
              <IonNote>
                Mit Wayfolio geteilt · privat per Link ·{' '}
                <a href={`${import.meta.env.BASE_URL}datenschutz`}>Datenschutz</a> ·{' '}
                <a href={`${import.meta.env.BASE_URL}impressum`}>Impressum</a>
              </IonNote>
            </p>
          </>
        )}

        <IonModal isOpen={askName} presentingElement={namePresenter} onDidDismiss={() => setAskName(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setAskName(false)}>Abbrechen</IonButton>
              </IonButtons>
              <IonTitle>Wie heisst du?</IonTitle>
              <IonButtons slot="end">
                <IonButton strong disabled={!name.trim()} onClick={() => void join()}>
                  Weiter
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent color="light">
            <IonList inset>
              <IonItem>
                <IonInput
                  label="Dein Name"
                  placeholder="Vorname"
                  maxlength={40}
                  value={name}
                  className="ion-text-end"
                  onIonInput={(e) => setName(String(e.detail.value ?? ''))}
                  onKeyDown={(e) => e.key === 'Enter' && name.trim() && void join()}
                />
              </IonItem>
            </IonList>
            <IonNote className="list-footnote">
              Damit die Reisenden wissen, wer reagiert. Ein Vorname genügt – kein Konto, kein Passwort.
            </IonNote>
          </IonContent>
        </IonModal>
        <LocationSheet
          point={selected}
          points={data.route}
          posts={data.posts}
          start={data.trip.starts_on}
          mode="follower"
          onClose={() => setSelected(null)}
          onNavigate={setSelected}
        />
      </IonContent>
    </IonPage>
  )
}

export default FollowerPage
