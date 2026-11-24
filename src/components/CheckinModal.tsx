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
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  useIonActionSheet,
  useIonToast,
} from '@ionic/react'
import { add, close, location as locationIcon, timeOutline } from 'ionicons/icons'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useAuth } from '../lib/auth'
import { useCapture } from '../lib/capture'
import { formatWhen } from '../lib/datetime'
import { cleanLinks, normalizeUrl } from '../lib/links'
import { useGeoPermission } from '../lib/geoPermission'
import { getPosition, reverseGeocode } from '../lib/location'
import { useCardPresenter } from '../lib/modal'
import { useTrip } from '../lib/trip'
import { createCheckin } from '../lib/updates'
import DateTimeSheet from './DateTimeSheet'
import LinksEditor from './LinksEditor'
import LocationPicker from './LocationPicker'
import './CheckinModal.css'

interface Props {
  isOpen: boolean
  onClose: () => void
  onPosted: () => void
}

const Thumb = ({ file, onRemove }: { file: File; onRemove: () => void }) => {
  const url = useMemo(() => URL.createObjectURL(file), [file])
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  return (
    <div className="checkin__thumb">
      <img src={url} alt="" />
      <button type="button" aria-label="Foto entfernen" onClick={onRemove}>
        <IonIcon icon={close} />
      </button>
    </div>
  )
}

/** Check-in «Ich bin jetzt hier»: Ort, optional Fotos und Bildtext – wie ein Instagram-Post. */
const CheckinModal = ({ isOpen, onClose, onPosted }: Props) => {
  const { session } = useAuth()
  const { trip } = useTrip()
  const { position, place, source, at, setLocation, setAt } = useCapture()
  const geo = useGeoPermission()
  const presenter = useCardPresenter(isOpen)
  const modal = useRef<HTMLIonModalElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [presentSheet] = useIonActionSheet()
  const [presentToast] = useIonToast()
  const [files, setFiles] = useState<File[]>([])
  const [caption, setCaption] = useState('')
  const [links, setLinks] = useState<string[]>([])
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [choosingTime, setChoosingTime] = useState(false)
  const [busy, setBusy] = useState(false)
  const submitted = useRef(false)
  /** Schliessen ist schon entschieden – keine zweite Nachfrage (z. B. wenn die Eltern-Seite isOpen nachzieht) */
  const closing = useRef(false)

  const locate = async () => {
    setLocating(true)
    setLocError(null)
    try {
      const pos = await getPosition()
      setLocation(pos, await reverseGeocode(pos), 'gps')
    } catch (e) {
      setLocError((e as Error).message)
    } finally {
      setLocating(false)
    }
  }

  // Beim Öffnen: Felder leeren; aktuellen Ort holen, wenn erlaubt und kein Pin gesetzt ist
  useEffect(() => {
    if (!isOpen) return
    submitted.current = false
    closing.current = false
    setFiles([])
    setCaption('')
    setLinks([])
    setLocError(null)
    if (source === 'gps' && geo.state === 'granted') void locate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, geo.state])

  const dirty = files.length > 0 || caption.trim().length > 0 || cleanLinks(links).length > 0
  const linksOk = links.every((l) => !l.trim() || normalizeUrl(l))
  const canDismiss = async () => {
    if (closing.current || submitted.current || !dirty || !isOpen) {
      closing.current = true
      return true
    }
    return new Promise<boolean>((resolve) => {
      void presentSheet({
        header: 'Check-in verwerfen?',
        buttons: [
          { text: 'Verwerfen', role: 'confirm' },
          { text: 'Weiter bearbeiten', role: 'cancel' },
        ],
        onWillDismiss: (e) => {
          const ok = e.detail.role === 'confirm'
          if (ok) closing.current = true
          resolve(ok)
        },
      })
    })
  }

  const post = async () => {
    if (!trip || !session || !position) return
    setBusy(true)
    try {
      await createCheckin({ tripId: trip.id, userId: session.user.id, position, place, at, source, lockPlace: true }, files, caption, links)
      submitted.current = true
      presentToast({ message: `Check-in: ${place?.name.split(',')[0] ?? 'Ort'}`, duration: 2000, position: 'top', color: 'success' })
      onPosted()
      await modal.current?.dismiss()
    } catch (e) {
      presentToast({ message: (e as Error).message, duration: 3500, position: 'top', color: 'danger' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <IonModal ref={modal} isOpen={isOpen} presentingElement={presenter} canDismiss={canDismiss} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => void modal.current?.dismiss()}>Abbrechen</IonButton>
          </IonButtons>
          <IonTitle>Check-in</IonTitle>
          <IonButtons slot="end">
            <IonButton strong disabled={!position || busy || !linksOk} onClick={() => void post()}>
              Posten
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent color="light">
        {/* Ort gross oben – «Ich bin jetzt hier» */}
        <IonList inset>
          <IonItem button detail onClick={() => setPicking(true)}>
            <IonIcon slot="start" icon={locationIcon} color="danger" />
            <IonLabel>
              <h2 className="checkin__place">{locating ? 'Standort wird ermittelt …' : (place?.name.split(',')[0] ?? 'Ort wählen')}</h2>
              <p>{place?.name.split(',').slice(1).join(',').trim() || (source === 'manual' ? 'Manuell gesetzt' : 'GPS')}</p>
            </IonLabel>
            {locating && <IonSpinner slot="end" name="dots" />}
          </IonItem>
          <IonItem button detail onClick={() => setChoosingTime(true)}>
            <IonIcon slot="start" icon={timeOutline} color={at ? 'warning' : 'primary'} />
            <IonLabel>Zeitpunkt</IonLabel>
            <IonNote slot="end">{formatWhen(at)}</IonNote>
          </IonItem>
        </IonList>
        {locError && (
          <IonNote className="compose__note checkin__error">
            {locError}{' '}
            <button type="button" onClick={() => void locate()}>
              Erneut versuchen
            </button>
          </IonNote>
        )}
        {geo.state !== 'granted' && !position && !locError && (
          <IonNote className="compose__note">
            Ort auf der Karte wählen oder{' '}
            <button type="button" className="checkin__link" onClick={async () => (await geo.request()) === 'granted' && void locate()}>
              Standort freigeben
            </button>
          </IonNote>
        )}

        {/* Fotos */}
        <div className="checkin__photos">
          {files.map((f, i) => (
            <Thumb key={`${f.name}-${i}`} file={f} onRemove={() => setFiles(files.filter((_, j) => j !== i))} />
          ))}
          <button type="button" className="checkin__add" onClick={() => fileInput.current?.click()}>
            <IonIcon icon={add} />
            <span>{files.length ? 'Mehr' : 'Fotos'}</span>
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              setFiles([...files, ...Array.from(e.target.files ?? [])])
              e.target.value = ''
            }}
          />
        </div>

        <IonList inset>
          <IonItem>
            <IonTextarea
              aria-label="Bildtext"
              placeholder={files.length ? 'Bildtext schreiben …' : 'Was ist hier los? (optional)'}
              autoGrow
              rows={3}
              value={caption}
              onIonInput={(e) => setCaption(String(e.detail.value ?? ''))}
            />
          </IonItem>
        </IonList>
        <IonNote className="compose__note">
          {files.length ? `${files.length} Foto${files.length > 1 ? 's' : ''} · werden fürs Handy verkleinert.` : 'Ohne Fotos zeigt der Check-in eure Route.'}
        </IonNote>

        <LinksEditor links={links} onChange={setLinks} />

        <LocationPicker
          isOpen={picking}
          initial={position}
          onClose={() => setPicking(false)}
          onPick={(pos, p, src) => setLocation(pos, p, src)}
        />
        <DateTimeSheet isOpen={choosingTime} value={at} onClose={() => setChoosingTime(false)} onChange={setAt} />
        <IonLoading isOpen={busy} message={files.length ? 'Fotos werden hochgeladen …' : 'Check-in …'} />
      </IonContent>
    </IonModal>
  )
}

export default CheckinModal
