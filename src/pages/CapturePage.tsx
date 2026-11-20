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

import ComposeModal, { type ComposeKind, type ComposeResult } from '../components/ComposeModal'
import VoiceRecorder from '../components/VoiceRecorder'
import { useAuth } from '../lib/auth'
import { getPosition, reverseGeocode, type Place, type Position } from '../lib/location'
import { useTrip } from '../lib/trip'
import {
  createBackground,
  createFeedPost,
  createLocationUpdate,
  createMediaStory,
  createPoll,
  MAX_VIDEO_MB,
  type Context,
} from '../lib/updates'
import './CapturePage.css'

type ActionId = 'photo' | 'location' | 'decision' | 'background' | 'voice' | 'video'

const singleActions: { id: ActionId; label: string; icon: string; target: string }[] = [
  { id: 'photo', label: 'Foto', icon: camera, target: 'Story' },
  { id: 'location', label: 'Standort', icon: locate, target: 'Feed · Routenbild' },
  { id: 'decision', label: 'Entscheidung', icon: barChart, target: 'Feed + Story' },
  { id: 'background', label: 'Hintergrund', icon: bookOutline, target: 'Feed + Story' },
  { id: 'voice', label: 'Sprachnachricht', icon: mic, target: 'Story' },
  { id: 'video', label: 'Video-Update', icon: videocam, target: 'Story' },
]

const CapturePage = () => {
  const { session } = useAuth()
  const { trip } = useTrip()
  const router = useIonRouter()
  const [presentToast] = useIonToast()
  const photoInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)

  const [position, setPosition] = useState<Position | null>(null)
  const [place, setPlace] = useState<Place | null>(null)
  const [locError, setLocError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [compose, setCompose] = useState<ComposeKind | null>(null)
  const [recording, setRecording] = useState(false)

  const locateMe = useCallback(async () => {
    setLocError(null)
    try {
      const pos = await getPosition()
      const p = await reverseGeocode(pos)
      setPosition(pos)
      setPlace(p)
      return { pos, p }
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

  const ctx = (): Context | null =>
    trip && session ? { tripId: trip.id, userId: session.user.id, position, place } : null

  const run = async (label: string, task: (c: Context) => Promise<void>, done: string) => {
    const c = ctx()
    if (!c) return
    setBusy(label)
    try {
      await task(c)
      toast(done)
      router.push('/feed', 'none', 'replace')
    } catch (e) {
      toast((e as Error).message, 'danger')
    } finally {
      setBusy(null)
    }
  }

  const handleAction = async (id: ActionId | 'post') => {
    switch (id) {
      case 'location': {
        const fresh = await locateMe()
        if (!fresh) return toast('Ohne Standort kein Check-in. Bitte Standortzugriff erlauben.', 'danger')
        await run(
          'Standort und Routenbild …',
          (c) => createLocationUpdate({ ...c, position: fresh.pos, place: fresh.p }),
          `Standort gesetzt: ${fresh.p.name}`,
        )
        return
      }
      case 'photo':
        return photoInput.current?.click()
      case 'video':
        return videoInput.current?.click()
      case 'voice':
        return setRecording(true)
      case 'decision':
        return setCompose('poll')
      case 'background':
        return setCompose('background')
      case 'post':
        return setCompose('post')
    }
  }

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>, kind: 'photo' | 'video') => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (kind === 'video' && file.size > MAX_VIDEO_MB * 1024 * 1024)
      return toast(`Video ist zu gross (max. ${MAX_VIDEO_MB} MB). Bitte kürzer aufnehmen.`, 'danger')
    await run(
      kind === 'photo' ? 'Foto wird hochgeladen …' : 'Video wird hochgeladen …',
      (c) => createMediaStory(c, file, kind),
      kind === 'photo' ? 'Foto als Story veröffentlicht' : 'Video als Story veröffentlicht',
    )
  }

  const onCompose = async (kind: ComposeKind, r: ComposeResult) => {
    setCompose(null)
    if (kind === 'post')
      await run('Beitrag wird veröffentlicht …', (c) => createFeedPost(c, r.title, r.text, r.files, r.link), 'Beitrag veröffentlicht')
    if (kind === 'background')
      await run('Hintergrund-Story wird veröffentlicht …', (c) => createBackground(c, r.title, r.text, r.files), 'Hintergrund-Story veröffentlicht')
    if (kind === 'poll')
      await run('Abstimmung wird gestartet …', (c) => createPoll(c, r.title, r.text, r.options, r.closesInHours), 'Abstimmung gestartet')
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
            <button key={action.id} type="button" className="tile" onClick={() => void handleAction(action.id)}>
              <IonIcon icon={action.icon} aria-hidden="true" />
              <span className="tile__label">{action.label}</span>
              <span className="tile__target">→ {action.target}</span>
            </button>
          ))}
        </div>

        <input ref={photoInput} type="file" accept="image/*" hidden onChange={(e) => void onFile(e, 'photo')} />
        <input ref={videoInput} type="file" accept="video/*" capture="environment" hidden onChange={(e) => void onFile(e, 'video')} />

        <ComposeModal kind={compose} onCancel={() => setCompose(null)} onSubmit={(k, r) => void onCompose(k, r)} />
        <VoiceRecorder
          isOpen={recording}
          onCancel={() => setRecording(false)}
          onDone={(audio) => {
            setRecording(false)
            void run('Sprachnachricht wird gesendet …', (c) => createMediaStory(c, audio, 'audio'), 'Sprachnachricht als Story veröffentlicht')
          }}
        />
        <IonLoading isOpen={busy !== null} message={busy ?? ''} />
      </IonContent>
    </IonPage>
  )
}

export default CapturePage
