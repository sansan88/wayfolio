import {
  IonContent,
  IonHeader,
  IonIcon,
  IonLoading,
  IonNote,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
  useIonRouter,
  useIonToast,
} from '@ionic/react'
import { barChart, bookOutline, camera, create, locate, mic, videocam } from 'ionicons/icons'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useAuth } from '../lib/auth'
import { getPosition, reverseGeocode, type Place, type Position } from '../lib/location'
import { useTrip } from '../lib/trip'
import { createLocationUpdate, createPhotoStory } from '../lib/updates'
import './CapturePage.css'

/** Wohin ein Update gemäss Konzept-Grundregel landet. */
type Target = 'Feed' | 'Story' | 'Feed + Story' | 'Feed · Routenbild'

interface Action {
  id: 'photo' | 'location' | 'decision' | 'background' | 'voice' | 'video'
  label: string
  icon: string
  target: Target
  ready: boolean
}

const singleActions: Action[] = [
  { id: 'photo', label: 'Foto', icon: camera, target: 'Story', ready: true },
  { id: 'location', label: 'Standort', icon: locate, target: 'Feed · Routenbild', ready: true },
  { id: 'decision', label: 'Entscheidung', icon: barChart, target: 'Feed + Story', ready: false },
  { id: 'background', label: 'Hintergrund', icon: bookOutline, target: 'Feed + Story', ready: false },
  { id: 'voice', label: 'Sprachnachricht', icon: mic, target: 'Story', ready: false },
  { id: 'video', label: 'Video-Update', icon: videocam, target: 'Story', ready: false },
]

const CapturePage = () => {
  const { session } = useAuth()
  const { trip } = useTrip()
  const router = useIonRouter()
  const [presentToast] = useIonToast()
  const fileInput = useRef<HTMLInputElement>(null)

  const [position, setPosition] = useState<Position | null>(null)
  const [place, setPlace] = useState<Place | null>(null)
  const [locError, setLocError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const locateMe = useCallback(async () => {
    setLocError(null)
    try {
      const pos = await getPosition()
      setPosition(pos)
      setPlace(await reverseGeocode(pos))
      return pos
    } catch (e) {
      setLocError((e as Error).message)
      return null
    }
  }, [])

  useEffect(() => {
    void locateMe()
  }, [locateMe])

  const toast = (message: string, color: 'success' | 'danger' | 'medium' = 'success') =>
    presentToast({ message, duration: 2500, position: 'top', color })

  const run = async (label: string, task: () => Promise<void>, done: string) => {
    if (!trip || !session) return
    setBusy(label)
    try {
      await task()
      toast(done)
      router.push('/feed', 'none', 'replace')
    } catch (e) {
      toast((e as Error).message, 'danger')
    } finally {
      setBusy(null)
    }
  }

  const handleAction = async (id: Action['id'] | 'post') => {
    if (!trip || !session) return
    const userId = session.user.id
    if (id === 'location') {
      const pos = position ?? (await locateMe())
      if (!pos) return toast('Ohne Standort kein Check-in. Bitte Standortzugriff erlauben.', 'danger')
      const p = place ?? (await reverseGeocode(pos))
      await run('Standort wird gesetzt …', () => createLocationUpdate(trip.id, userId, pos, p), `Standort gesetzt: ${p.name}`)
      return
    }
    if (id === 'photo') {
      fileInput.current?.click()
      return
    }
    toast('Kommt in einer nächsten Version.', 'medium')
  }

  const onPhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !trip || !session) return
    await run(
      'Foto wird hochgeladen …',
      () => createPhotoStory(trip.id, session.user.id, file, position, place),
      'Foto als Story veröffentlicht',
    )
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{trip?.title ?? 'Erfassen'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <button type="button" className="location" onClick={() => void locateMe()}>
          <IonText>
            <strong>{place?.name ?? (locError ? 'Standort unbekannt' : 'Standort wird ermittelt …')}</strong>
          </IonText>
          <IonNote>{locError ?? 'Tippen zum Aktualisieren'}</IonNote>
        </button>

        <button type="button" className="tile tile--wide" onClick={() => void handleAction('post')}>
          <IonIcon icon={create} aria-hidden="true" />
          <span className="tile__text">
            <span className="tile__label">Beitrag schreiben</span>
            <span className="tile__target">→ Feed · Text mit allen Medien</span>
          </span>
        </button>

        <div className="grid">
          {singleActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className={`tile${action.ready ? '' : ' tile--soon'}`}
              onClick={() => void handleAction(action.id)}
            >
              <IonIcon icon={action.icon} aria-hidden="true" />
              <span className="tile__label">{action.label}</span>
              <span className="tile__target">{action.ready ? `→ ${action.target}` : 'bald verfügbar'}</span>
            </button>
          ))}
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => void onPhotoSelected(e)}
        />
        <IonLoading isOpen={busy !== null} message={busy ?? ''} />
      </IonContent>
    </IonPage>
  )
}

export default CapturePage
