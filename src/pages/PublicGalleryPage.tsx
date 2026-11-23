import { IonContent, IonNote, IonPage, IonText } from '@ionic/react'
import { useEffect, useState } from 'react'

import { LargeTitle, PageHeader } from '../components/PageHeader'
import GalleryGrid from '../components/GalleryGrid'
import { galleryApi } from '../lib/follower'
import type { GalleryDay } from '../lib/gallery'
import './LoginPage.css'
import PageSpinner from '../components/PageSpinner'

/** Galerie für Familie per eigenem Link – ohne Konto, mit Download. */
const PublicGalleryPage = ({ token }: { token: string }) => {
  const [data, setData] = useState<{ trip: { title: string }; days: GalleryDay[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    galleryApi(token)
      .then((d) => {
        setData(d)
        document.title = `Fotos: ${d.trip.title} · Little Footnotes`
      })
      .catch((e: Error) => setError(e.message))
  }, [token])

  if (error)
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="login">
            <h1>Little Footnotes</h1>
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    )

  return (
    <IonPage>
      <PageHeader title={data ? data.trip.title : 'Galerie'} />
      <IonContent fullscreen>
        <LargeTitle title={data ? data.trip.title : 'Galerie'} />
        {!data ? (
          <PageSpinner />
        ) : (
          <>
            {data.days.length === 0 && <p className="ion-padding">Noch keine Fotos.</p>}
            <GalleryGrid days={data.days} />
            <p className="ion-text-center ion-padding">
              <IonNote>
                Privat geteilt mit Little Footnotes · <a href={`${import.meta.env.BASE_URL}datenschutz`}>Datenschutz</a>
              </IonNote>
            </p>
          </>
        )}
      </IonContent>
    </IonPage>
  )
}

export default PublicGalleryPage
