import { IonCard, IonCardContent, IonContent, IonHeader, IonNote, IonPage, IonTitle, IonToolbar } from '@ionic/react'
import { useEffect, useState } from 'react'

import PageSpinner from '../components/PageSpinner'
import PostCard from '../components/PostCard'
import { sharedPostApi } from '../lib/follower'
import type { FeedPost } from '../lib/updates'

/** Einzelner Beitrag über einen Beitrags-Link – ohne Zugang zur ganzen Reise. */
const SharedPostPage = ({ token }: { token: string }) => {
  const [data, setData] = useState<{ trip: { title: string }; post: FeedPost } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    sharedPostApi(token)
      .then((d) => {
        setData(d)
        document.title = `${d.post.title ?? d.post.place_name?.split(',')[0] ?? 'Beitrag'} · Little Footnotes`
      })
      .catch((e: Error) => setError(e.message))
  }, [token])

  return (
    <IonPage className="no-save">
      <IonHeader>
        <IonToolbar>
          <IonTitle>{data?.trip.title || 'Little Footnotes'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent color="light">
        {!data && !error && <PageSpinner />}
        {error && (
          <IonCard>
            <IonCardContent>{error}</IonCardContent>
          </IonCard>
        )}
        {data && <PostCard post={data.post} mode="follower" />}
        <p className="ion-text-center">
          <IonNote>
            Mit Little Footnotes geteilt · privat per Link ·{' '}
            <a href={`${import.meta.env.BASE_URL}datenschutz`}>Datenschutz</a>
          </IonNote>
        </p>
      </IonContent>
    </IonPage>
  )
}

export default SharedPostPage
