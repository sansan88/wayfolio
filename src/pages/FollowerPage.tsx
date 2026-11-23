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
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import PostCard, { dayNumber } from '../components/PostCard'
import InstallHint from '../components/InstallHint'
import TimelineDots from '../components/TimelineDots'
import { useTimeline } from '../lib/useTimeline'
import '../pages/FeedPage.css'
import { followerApi, galleryApi, type FollowerFeed } from '../lib/follower'
import type { GalleryDay } from '../lib/gallery'
import GalleryGrid from '../components/GalleryGrid'
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
  const [tab, setTab] = useState<'feed' | 'karte' | 'fotos'>(() =>
    window.location.hash === '#fotos' ? 'fotos' : window.location.hash === '#route' ? 'karte' : 'feed',
  )
  const [gallery, setGallery] = useState<GalleryDay[] | null>(null)
  const [askName, setAskName] = useState(false)
  const namePresenter = useCardPresenter(askName)
  const [selected, setSelected] = useState<RoutePoint | null>(null)
  const timeline = useTimeline((data?.posts ?? []).map((p) => p.id))

  // Fotos erst laden, wenn der Bereich geöffnet wird
  useEffect(() => {
    if (tab !== 'fotos' || gallery) return
    galleryApi(token)
      .then((g) => setGallery(g.days))
      .catch(() => setGallery([]))
  }, [tab, gallery, token])
  // geteilter Link (…#p-<id>): einmal zum Beitrag springen
  const jumped = useRef(false)
  useEffect(() => {
    const id = window.location.hash.match(/^#p-([0-9a-f-]{36})$/)?.[1]
    if (!data || !id || jumped.current) return
    jumped.current = true
    setTimeout(() => void timeline.jumpTo(id), 400)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])
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

  const start = data.trip.starts_on ?? data.posts.at(-1)?.published_at
  const card = (post: FeedPost) => (
    <div key={post.id} data-post-id={post.id}>
    <PostCard
      post={post}
      onPlace={(p) => {
        const point = data.route.find((r) => r.id === p.checkin_id)
        if (!point) return
        setTab('karte')
        setSelected(point)
      }}
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
    </div>
  )

  // pro Ort das neueste Foto als Marker (ohne Routenbilder)
  const photos: Record<string, string> = {}
  for (const p of data.posts) {
    const hit = p.blocks.find((b) => b.kind === 'photo' && b.mediaUrl && !b.route)
      const url = hit?.thumbUrl ?? hit?.mediaUrl
    if (p.checkin_id && url && !photos[p.checkin_id]) photos[p.checkin_id] = url
  }

  const segment = (
    <IonSegment value={tab} onIonChange={(e) => setTab(e.detail.value as 'feed' | 'karte' | 'fotos')}>
      <IonSegmentButton value="feed">
        <IonLabel>Tagebuch</IonLabel>
      </IonSegmentButton>
      <IonSegmentButton value="karte">
        <IonLabel>Route</IonLabel>
      </IonSegmentButton>
      <IonSegmentButton value="fotos">
        <IonLabel>Fotos</IonLabel>
      </IonSegmentButton>
    </IonSegment>
  )

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{data.trip.title}</IonTitle>
        </IonToolbar>
        <IonToolbar>{segment}</IonToolbar>
        {tab === 'feed' && data.posts.length > 0 && (
          <IonToolbar className="timeline-toolbar">
            <TimelineDots posts={data.posts} activeId={timeline.activeId} start={start} onSelect={(p) => void timeline.jumpTo(p.id)} />
          </IonToolbar>
        )}
      </IonHeader>
      <IonContent ref={timeline.contentRef} scrollY={tab !== 'karte'} scrollEvents onIonScroll={timeline.onScroll} color="light">
        {tab === 'fotos' ? (
          gallery === null ? (
            <PageSpinner />
          ) : gallery.length === 0 ? (
            <IonCard>
              <IonCardContent>Noch keine Fotos.</IonCardContent>
            </IonCard>
          ) : (
            <GalleryGrid days={gallery} />
          )
        ) : tab === 'karte' ? (
          <Suspense fallback={null}>
            <RouteMap points={data.route} photos={photos} onSelect={setSelected} focus={selected} />
          </Suspense>
        ) : (
          <>
            <IonRefresher slot="fixed" onIonRefresh={(e) => void load().finally(() => e.detail.complete())}>
              <IonRefresherContent />
            </IonRefresher>
            <InstallHint who="follower" />
            {data.posts.length === 0 && (
              <IonCard>
                <IonCardContent>Noch keine Beiträge. Schau bald wieder vorbei!</IonCardContent>
              </IonCard>
            )}
            {data.posts.map(card)}

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
