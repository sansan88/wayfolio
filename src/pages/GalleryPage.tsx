import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonIcon,
  IonLoading,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonText,
  useIonActionSheet,
  useIonAlert,
  useIonToast,
  useIonViewWillEnter,
} from '@ionic/react'
import { addOutline, shareSocialOutline } from 'ionicons/icons'
import { useCallback, useRef, useState } from 'react'

import GalleryGrid from '../components/GalleryGrid'
import { LargeTitle, PageHeader } from '../components/PageHeader'
import { useAuth } from '../lib/auth'
import {
  deleteMedia,
  getOrCreateGalleryLink,
  loadGallery,
  rotateGalleryLink,
  uploadToGallery,
  type GalleryDay,
  type GalleryItem,
} from '../lib/gallery'
import { useTrip } from '../lib/trip'

/** Private Fotogalerie der Reise: alle Fotos und Videos nach Tagen. */
const GalleryPage = () => {
  const { session } = useAuth()
  const { trip } = useTrip()
  const [presentToast] = useIonToast()
  const [presentSheet] = useIonActionSheet()
  const [presentAlert] = useIonAlert()
  const fileInput = useRef<HTMLInputElement>(null)
  const [days, setDays] = useState<GalleryDay[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const toast = (message: string, color: 'success' | 'danger' = 'success') =>
    presentToast({ message, duration: 2500, position: 'top', color })

  const refresh = useCallback(async () => {
    if (!trip) return
    try {
      setDays(await loadGallery(trip.id))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [trip])

  useIonViewWillEnter(() => {
    void refresh()
  }, [refresh])

  const upload = async (files: File[]) => {
    if (!trip || !session || !files.length) return
    setBusy(`${files.length} ${files.length === 1 ? 'Datei' : 'Dateien'} werden hochgeladen …`)
    try {
      await uploadToGallery(trip.id, session.user.id, files)
      toast('Zur Galerie hinzugefügt')
      await refresh()
    } catch (e) {
      toast((e as Error).message, 'danger')
    } finally {
      setBusy(null)
    }
  }

  const remove = (item: GalleryItem) =>
    presentAlert({
      header: 'Endgültig löschen?',
      message: 'Das Foto bzw. Video verschwindet auch aus Beiträgen, in denen es vorkommt.',
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: 'Löschen',
          role: 'destructive',
          handler: () =>
            void deleteMedia(item)
              .then(refresh)
              .catch((e: Error) => toast(e.message, 'danger')),
        },
      ],
    })

  const share = async () => {
    if (!trip) return
    const send = async (url: string) => {
      if (navigator.share) await navigator.share({ title: `Fotos: ${trip.title}`, url }).catch(() => undefined)
      else {
        await navigator.clipboard.writeText(url)
        toast('Galerie-Link kopiert')
      }
    }
    try {
      const url = await getOrCreateGalleryLink(trip.id)
      await presentSheet({
        header: 'Galerie teilen',
        subHeader: 'Getrennt vom Follower-Link – z.B. nur für die engste Familie. Mit Download.',
        buttons: [
          { text: 'Link teilen', handler: () => void send(url) },
          { text: 'Neuen Link erzeugen (alter wird gesperrt)', role: 'destructive', handler: () => void rotateGalleryLink(trip.id).then(send) },
          { text: 'Abbrechen', role: 'cancel' },
        ],
      })
    } catch (e) {
      toast((e as Error).message, 'danger')
    }
  }

  const count = days?.reduce((n, d) => n + d.items.length, 0) ?? 0

  return (
    <IonPage>
      <PageHeader
        title={count ? `Galerie · ${count}` : 'Galerie'}
        end={
          <>
            <IonButton onClick={() => fileInput.current?.click()} aria-label="Fotos hinzufügen">
              <IonIcon slot="icon-only" icon={addOutline} />
            </IonButton>
            <IonButton onClick={() => void share()} aria-label="Galerie teilen">
              <IonIcon slot="icon-only" icon={shareSocialOutline} />
            </IonButton>
          </>
        }
      />
      <IonContent fullscreen>
        <LargeTitle title="Galerie" />
        <IonRefresher slot="fixed" onIonRefresh={(e) => void refresh().finally(() => e.detail.complete())}>
          <IonRefresherContent />
        </IonRefresher>
        {error && (
          <IonText color="danger">
            <p className="ion-padding">{error}</p>
          </IonText>
        )}
        {days && days.length === 0 && (
          <IonCard>
            <IonCardContent>
              Hier sammeln sich alle Fotos und Videos eurer Reise – aus Beiträgen und Stories. Mit «+» ladet ihr
              zusätzliche Bilder nur in die Galerie, ohne sie zu posten.
            </IonCardContent>
          </IonCard>
        )}
        {days && <GalleryGrid days={days} onDelete={(i) => void remove(i)} />}
        <input
          ref={fileInput}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            e.target.value = ''
            void upload(files)
          }}
        />
        <IonLoading isOpen={busy !== null} message={busy ?? ''} />
      </IonContent>
    </IonPage>
  )
}

export default GalleryPage
