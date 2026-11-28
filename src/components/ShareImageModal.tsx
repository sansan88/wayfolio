import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonLabel,
  IonModal,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react'
import { logoInstagram } from 'ionicons/icons'
import { useEffect, useState } from 'react'

import { useCardPresenter } from '../lib/modal'
import {
  renderShareImage,
  SHARE_IMAGE_SIZE,
  SHARE_IMAGE_THEMES,
  shareImageFile,
  sharePhotos,
  type ShareImageFormat,
  type ShareImageTheme,
} from '../lib/shareImage'
import type { FeedPost } from '../lib/updates'
import './ShareImageModal.css'

interface Props {
  /** Beitrag, für den das Bild entsteht; null = geschlossen */
  post: FeedPost | null
  day?: number | null
  onClose: () => void
}

const THEME_KEY = 'lf-share-theme'
/** Zuletzt gewähltes Design merken (nur Komfort; ohne Speicher gilt «Sand»). */
const savedTheme = (): ShareImageTheme => {
  try {
    const t = localStorage.getItem(THEME_KEY) as ShareImageTheme | null
    return t && t in SHARE_IMAGE_THEMES ? t : 'sand'
  } catch {
    return 'sand'
  }
}

/** Vorschau und Teilen des Instagram-Bildes zu einem Beitrag (Story 9:16 oder Beitrag 4:5). */
const ShareImageModal = ({ post, day, onClose }: Props) => {
  const isOpen = post !== null
  const presenter = useCardPresenter(isOpen)
  const [presentToast] = useIonToast()
  const [format, setFormat] = useState<ShareImageFormat>('story')
  const [photoIndex, setPhotoIndex] = useState(0)
  const [theme, setTheme] = useState<ShareImageTheme>(savedTheme)
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (isOpen) setPhotoIndex(0)
  }, [isOpen, post?.id])

  // Bild neu zeichnen, wenn Format oder Foto wechselt
  useEffect(() => {
    if (!post) return
    let cancelled = false
    let url: string | null = null
    setImage(null)
    setError(null)
    renderShareImage(post, { format, photoIndex, day, theme })
      .then((blob) => {
        if (cancelled) return
        url = URL.createObjectURL(blob)
        setImage({ blob, url })
      })
      .catch((e: Error) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [post, format, photoIndex, day, theme])

  const photos = post ? sharePhotos(post) : []
  const { w, h } = SHARE_IMAGE_SIZE[format]

  const share = async () => {
    if (!image) return
    setSharing(true)
    try {
      const r = await shareImageFile(image.blob, format)
      if (r === 'saved') void presentToast({ message: 'Bild gespeichert – in Instagram auswählen', duration: 2400, position: 'top', color: 'success' })
    } finally {
      setSharing(false)
    }
  }

  return (
    <IonModal isOpen={isOpen} presentingElement={presenter} onDidDismiss={onClose} className="share-image">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>Abbrechen</IonButton>
          </IonButtons>
          <IonTitle>Bild für Instagram</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={format} onIonChange={(e) => setFormat((e.detail.value as ShareImageFormat) ?? 'story')}>
            <IonSegmentButton value="story">
              <IonLabel>Story</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="post">
              <IonLabel>Beitrag</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" color="light">
        <div className="share-image__preview" style={{ aspectRatio: `${w} / ${h}` }}>
          {image ? (
            <img src={image.url} alt={`Vorschau ${format === 'story' ? 'Story' : 'Beitrag'}`} />
          ) : error ? (
            <p className="share-image__error">{error}</p>
          ) : (
            <IonSpinner name="crescent" aria-label="Bild wird erstellt" />
          )}
        </div>
        <div className="share-image__themes" role="radiogroup" aria-label="Design wählen">
          {(Object.keys(SHARE_IMAGE_THEMES) as ShareImageTheme[]).map((key) => {
            const t = SHARE_IMAGE_THEMES[key]
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={key === theme}
                className={key === theme ? 'active' : ''}
                onClick={() => {
                  setTheme(key)
                  try {
                    localStorage.setItem(THEME_KEY, key)
                  } catch {
                    // ohne Speicher: Wahl gilt nur für diesen Dialog
                  }
                }}
              >
                <span className="share-image__swatch" style={{ background: t.bg, color: t.accent, borderColor: t.line }} aria-hidden="true">
                  Aa
                </span>
                {t.label}
              </button>
            )
          })}
        </div>
        {photos.length > 1 && (
          <div className="share-image__photos" role="radiogroup" aria-label="Foto wählen">
            {photos.map((p, i) => (
              <button
                key={p.position}
                type="button"
                role="radio"
                aria-checked={i === photoIndex}
                aria-label={`Foto ${i + 1}`}
                className={i === photoIndex ? 'active' : ''}
                onClick={() => setPhotoIndex(i)}
              >
                <img src={p.mediaUrl!} alt="" />
              </button>
            ))}
          </div>
        )}
        <p className="share-image__hint">
          {format === 'story' ? '1080 × 1920 px für eure Story.' : '1080 × 1350 px für den Feed.'} Datum und Ort kommen aus dem Beitrag.
        </p>
        <p className="share-image__hint">
          Erscheint das Bild in Instagram nicht: im Teilen-Menü «Bild sichern» wählen (oder das Bild oben gedrückt halten
          → «Zu Fotos hinzufügen») und es in Instagram aus den Fotos auswählen.
        </p>
      </IonContent>
      <IonFooter>
        <IonToolbar>
          <IonButton expand="block" className="ion-margin-horizontal" disabled={!image || sharing} onClick={() => void share()}>
            <IonIcon slot="start" icon={logoInstagram} />
            Teilen
          </IonButton>
        </IonToolbar>
      </IonFooter>
    </IonModal>
  )
}

export default ShareImageModal
