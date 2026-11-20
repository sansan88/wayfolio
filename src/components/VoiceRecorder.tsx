import { IonButton, IonContent, IonHeader, IonIcon, IonModal, IonText, IonTitle, IonToolbar, IonButtons } from '@ionic/react'
import { mic, stop } from 'ionicons/icons'
import { useEffect, useRef, useState } from 'react'

import { useCardPresenter } from '../lib/modal'

interface Props {
  isOpen: boolean
  onCancel: () => void
  onDone: (audio: Blob) => void
}

const MAX_SECONDS = 180

/** Sprachnachricht aufnehmen (MediaRecorder; Safari liefert mp4/aac, Chrome webm/opus). */
const VoiceRecorder = ({ isOpen, onCancel, onDone }: Props) => {
  const presenter = useCardPresenter(isOpen)
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!recording) return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [recording])

  useEffect(() => {
    if (seconds >= MAX_SECONDS) recorder.current?.stop()
  }, [seconds])

  const start = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunks.current = []
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data)
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        setRecording(false)
        const blob = new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' })
        if (blob.size) onDone(blob)
      }
      recorder.current = rec
      rec.start()
      setSeconds(0)
      setRecording(true)
    } catch {
      setError('Kein Zugriff aufs Mikrofon. Bitte im Browser erlauben.')
    }
  }

  const cancel = () => {
    if (recorder.current?.state === 'recording') {
      recorder.current.onstop = () => recorder.current?.stream.getTracks().forEach((t) => t.stop())
      recorder.current.stop()
    }
    setRecording(false)
    onCancel()
  }

  const mm = String(Math.floor(seconds / 60)).padStart(1, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <IonModal isOpen={isOpen} presentingElement={presenter} onDidDismiss={cancel}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={cancel}>Abbrechen</IonButton>
          </IonButtons>
          <IonTitle>Sprachnachricht</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding ion-text-center">
        <p style={{ fontSize: '2.4rem', fontVariantNumeric: 'tabular-nums', margin: '16px 0' }}>
          {mm}:{ss}
        </p>
        {recording ? (
          <IonButton color="danger" shape="round" size="large" onClick={() => recorder.current?.stop()}>
            <IonIcon slot="start" icon={stop} /> Stopp &amp; senden
          </IonButton>
        ) : (
          <IonButton shape="round" size="large" onClick={() => void start()}>
            <IonIcon slot="start" icon={mic} /> Aufnahme starten
          </IonButton>
        )}
        <IonText color="medium">
          <p>Max. {MAX_SECONDS / 60} Minuten. Erscheint als Story.</p>
        </IonText>
        {error && (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        )}
      </IonContent>
    </IonModal>
  )
}

export default VoiceRecorder
