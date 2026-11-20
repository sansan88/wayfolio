import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonLoading,
  IonModal,
  IonNote,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react'
import { barChart, bookOutline, camera, create, locate, locationOutline, mic, timeOutline, videocam } from 'ionicons/icons'
import { useCallback, useEffect, useRef, useState } from 'react'

import ComposeModal, { type ComposeKind, type ComposeResult } from './ComposeModal'
import DateTimeSheet from './DateTimeSheet'
import LocationPicker from './LocationPicker'
import VoiceRecorder from './VoiceRecorder'
import { useAuth } from '../lib/auth'
import { useCapture } from '../lib/capture'
import { formatWhen } from '../lib/datetime'
import { useCardPresenter } from '../lib/modal'
import { getPosition, reverseGeocode } from '../lib/location'
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
import './CaptureModal.css'

type ActionId = 'photo' | 'location' | 'decision' | 'background' | 'voice' | 'video'

const singleActions: { id: ActionId; label: string; icon: string; target: string }[] = [
  { id: 'photo', label: 'Foto', icon: camera, target: 'Story' },
  { id: 'location', label: 'Standort', icon: locate, target: 'Feed · Routenbild' },
  { id: 'decision', label: 'Entscheidung', icon: barChart, target: 'Feed + Story' },
  { id: 'background', label: 'Hintergrund', icon: bookOutline, target: 'Feed + Story' },
  { id: 'voice', label: 'Sprachnachricht', icon: mic, target: 'Story' },
  { id: 'video', label: 'Video-Update', icon: videocam, target: 'Story' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
  /** nach erfolgreichem Veröffentlichen (Feed neu laden) */
  onPosted: () => void
}

/** «Erfassen» als iOS-Card-Modal über dem Feed. */
const CaptureModal = ({ isOpen, onClose, onPosted }: Props) => {
  const { session } = useAuth()
  const { trip } = useTrip()
  const [presentToast] = useIonToast()
  const presenter = useCardPresenter(isOpen)
  const modal = useRef<HTMLIonModalElement>(null)
  const photoInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)

  const { position, place, source, at, setLocation, setAt } = useCapture()
  const [locError, setLocError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [compose, setCompose] = useState<ComposeKind | null>(null)
  const [recording, setRecording] = useState(false)
  const [picking, setPicking] = useState(false)
  const [choosingTime, setChoosingTime] = useState(false)

  const locateMe = useCallback(async () => {
    setLocError(null)
    try {
      const pos = await getPosition()
      const p = await reverseGeocode(pos)
      setLocation(pos, p, 'gps')
      return { pos, p }
    } catch (e) {
      setLocError((e as Error).message)
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Beim Öffnen GPS holen – ein manuell gesetzter Ort bleibt bestehen
  useEffect(() => {
    if (isOpen && source === 'gps') void locateMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const toast = (message: string, color: 'success' | 'danger' | 'medium' = 'success') =>
    presentToast({ message, duration: 2500, position: 'top', color })

  const ctx = (): Context | null =>
    trip && session ? { tripId: trip.id, userId: session.user.id, position, place, at } : null

  const run = async (label: string, task: (c: Context) => Promise<void>, done: string) => {
    const c = ctx()
    if (!c) return
    setBusy(label)
    try {
      await task(c)
      toast(done)
      onPosted()
      await modal.current?.dismiss()
    } catch (e) {
      toast((e as Error).message, 'danger')
    } finally {
      setBusy(null)
    }
  }

  const handleAction = async (id: ActionId | 'post') => {
    switch (id) {
      case 'location': {
        // Manuell gesetzter Ort hat Vorrang; sonst frische GPS-Position
        const fresh = source === 'manual' && position && place ? { pos: position, p: place } : await locateMe()
        if (!fresh) {
          toast('Kein GPS – setze den Ort oben manuell auf der Karte.', 'danger')
          return setPicking(true)
        }
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
    <IonModal ref={modal} isOpen={isOpen} presentingElement={presenter} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Erfassen</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => void modal.current?.dismiss()}>Fertig</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent color="light">
        {trip && <p className="capture__trip">{trip.title}</p>}
        {at && (
          <div className="capture__backdated">
            Neue Updates werden auf <strong>{formatWhen(at)}</strong> datiert.{' '}
            <button type="button" onClick={() => setAt(null)}>
              Auf jetzt zurücksetzen
            </button>
          </div>
        )}

        <IonList inset className="capture__context">
          <IonItem button detail onClick={() => setPicking(true)}>
            <IonIcon slot="start" icon={locationOutline} color="primary" />
            <IonLabel>
              <h3>Ort</h3>
              <p>{place?.name ?? (locError ? 'Unbekannt – tippen, um zu wählen' : 'Wird ermittelt …')}</p>
            </IonLabel>
            {place && <IonNote slot="end">{source === 'gps' ? 'GPS' : 'Manuell'}</IonNote>}
          </IonItem>
          <IonItem button detail onClick={() => setChoosingTime(true)}>
            <IonIcon slot="start" icon={timeOutline} color={at ? 'warning' : 'primary'} />
            <IonLabel>
              <h3>Zeitpunkt</h3>
              <p>{formatWhen(at)}</p>
            </IonLabel>
            {at && <IonNote slot="end">rückdatiert</IonNote>}
          </IonItem>
        </IonList>

        <div className="capture__tiles">
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
        </div>

        <input ref={photoInput} type="file" accept="image/*" hidden onChange={(e) => void onFile(e, 'photo')} />
        <input ref={videoInput} type="file" accept="video/*" hidden onChange={(e) => void onFile(e, 'video')} />

        <ComposeModal
          kind={compose}
          onCancel={() => setCompose(null)}
          onSubmit={(k, r) => void onCompose(k, r)}
        />
        <LocationPicker
          isOpen={picking}
          initial={position}
          onClose={() => setPicking(false)}
          onPick={setLocation}
        />
        <DateTimeSheet isOpen={choosingTime} value={at} onClose={() => setChoosingTime(false)} onChange={setAt} />
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
    </IonModal>
  )
}

export default CaptureModal
