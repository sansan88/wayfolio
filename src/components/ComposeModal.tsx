import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonModal,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonThumbnail,
  IonTitle,
  IonToolbar,
  useIonActionSheet,
} from '@ionic/react'
import { addCircle, documentAttachOutline, images, micOutline, removeCircle, timeOutline, videocamOutline } from 'ionicons/icons'
import { useEffect, useMemo, useRef, useState } from 'react'

import { formatWhen } from '../lib/datetime'
import DateTimeSheet from './DateTimeSheet'
import { useCardPresenter } from '../lib/modal'

export type ComposeKind = 'post' | 'background' | 'poll' | 'edit'

export interface ComposeResult {
  title: string
  text: string
  files: File[]
  link: string
  options: string[]
  closesInHours: number | null
  /** nur beim Bearbeiten: neuer Zeitpunkt */
  at?: Date
}

interface Props {
  kind: ComposeKind | null
  /** Seite hinter dem Modal (iOS-Card-Effekt) */
  /** Startwerte beim Bearbeiten */
  initial?: { title: string; text: string; at?: Date }
  onCancel: () => void
  onSubmit: (kind: ComposeKind, result: ComposeResult) => void
}

const heading: Record<ComposeKind, string> = {
  post: 'Beitrag',
  background: 'Hintergrund',
  poll: 'Entscheidung',
  edit: 'Bearbeiten',
}

const FilePreview = ({ file }: { file: File }) => {
  const url = useMemo(() => (file.type.startsWith('image') ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => (url ? URL.revokeObjectURL(url) : undefined), [url])
  if (url) return <img src={url} alt="" />
  return <IonIcon icon={file.type.startsWith('video') ? videocamOutline : file.type.startsWith('audio') ? micOutline : documentAttachOutline} />
}

/** iOS-Card-Modal für Beitrag, Hintergrund-Story, Abstimmung und Bearbeiten – Formular als Inset-Listen. */
const ComposeModal = ({ kind, initial, onCancel, onSubmit }: Props) => {
  const presenter = useCardPresenter(kind !== null)
  const modal = useRef<HTMLIonModalElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [presentSheet] = useIonActionSheet()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [link, setLink] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [options, setOptions] = useState(['', ''])
  const [closesInHours, setClosesInHours] = useState<number | null>(48)
  const [at, setAt] = useState<Date | undefined>()
  const [choosingTime, setChoosingTime] = useState(false)
  const submitted = useRef(false)

  // Beim Öffnen zurücksetzen bzw. mit den Werten zum Bearbeiten füllen
  useEffect(() => {
    if (!kind) return
    submitted.current = false
    setTitle(initial?.title ?? '')
    setText(initial?.text ?? '')
    setLink('')
    setFiles([])
    setOptions(['', ''])
    setClosesInHours(48)
    setAt(initial?.at)
  }, [kind, initial])

  const filledOptions = options.map((o) => o.trim()).filter(Boolean)
  const dirty =
    kind === 'edit'
      ? title !== (initial?.title ?? '') || text !== (initial?.text ?? '') || at?.getTime() !== initial?.at?.getTime()
      : !!(title || text || link || files.length || filledOptions.length)
  const valid =
    kind === 'poll'
      ? title.trim().length > 0 && filledOptions.length >= 2
      : kind === 'background'
        ? title.trim().length > 0 && text.trim().length > 0
        : kind === 'edit'
          ? dirty
          : text.trim().length > 0 || files.length > 0

  /** iOS-Muster (Ionic-Doku «canDismiss»): bei ungespeicherten Eingaben per Action Sheet nachfragen. */
  const canDismiss = async () => {
    if (submitted.current || !dirty) return true
    return new Promise<boolean>((resolve) => {
      void presentSheet({
        header: 'Eingaben verwerfen?',
        buttons: [
          { text: 'Verwerfen', role: 'confirm' },
          { text: 'Weiter bearbeiten', role: 'cancel' },
        ],
        onWillDismiss: (e) => resolve(e.detail.role === 'confirm'),
      })
    })
  }

  const submit = () => {
    if (!kind || !valid) return
    submitted.current = true
    onSubmit(kind, { title, text, files, link, options: filledOptions, closesInHours, at })
  }

  return (
    <IonModal
      ref={modal}
      isOpen={kind !== null}
      presentingElement={presenter}
      canDismiss={canDismiss}
      onDidDismiss={onCancel}
    >
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => void modal.current?.dismiss()}>Abbrechen</IonButton>
          </IonButtons>
          <IonTitle>{kind ? heading[kind] : ''}</IonTitle>
          <IonButtons slot="end">
            <IonButton strong disabled={!valid} onClick={submit}>
              {kind === 'edit' ? 'Sichern' : 'Posten'}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent color="light">
        <IonList inset>
          <IonItem>
            <IonInput
              aria-label={kind === 'poll' ? 'Frage' : 'Titel'}
              placeholder={kind === 'poll' ? 'Welches Auto sollen wir kaufen?' : kind === 'background' ? 'Titel, z.B. Wie wir das Auto fanden' : 'Titel (optional)'}
              value={title}
              onIonInput={(e) => setTitle(String(e.detail.value ?? ''))}
            />
          </IonItem>
          <IonItem>
            <IonTextarea
              aria-label={kind === 'poll' ? 'Beschreibung' : 'Text'}
              placeholder={kind === 'poll' ? 'Kurze Beschreibung (optional)' : 'Was ist passiert?'}
              autoGrow
              rows={kind === 'poll' ? 2 : 6}
              value={text}
              onIonInput={(e) => setText(String(e.detail.value ?? ''))}
            />
          </IonItem>
        </IonList>

        {kind === 'edit' && (
          <IonList inset>
            <IonItem button detail onClick={() => setChoosingTime(true)}>
              <IonIcon slot="start" icon={timeOutline} color="primary" />
              <IonLabel>Zeitpunkt</IonLabel>
              <IonNote slot="end">{formatWhen(at ?? null)}</IonNote>
            </IonItem>
          </IonList>
        )}
        <DateTimeSheet
          isOpen={choosingTime}
          value={at ?? null}
          allowNow={false}
          onClose={() => setChoosingTime(false)}
          onChange={(d) => d && setAt(d)}
        />

        {kind === 'poll' && (
          <>
            <IonList inset>
              <IonListHeader>
                <IonLabel>Optionen</IonLabel>
              </IonListHeader>
              {options.map((o, i) => (
                <IonItem key={i}>
                  {options.length > 2 && (
                    <IonButton
                      slot="start"
                      fill="clear"
                      color="danger"
                      className="compose__remove"
                      aria-label={`Option ${i + 1} entfernen`}
                      onClick={() => setOptions(options.filter((_, j) => j !== i))}
                    >
                      <IonIcon slot="icon-only" icon={removeCircle} />
                    </IonButton>
                  )}
                  <IonInput
                    aria-label={`Option ${i + 1}`}
                    placeholder={`Option ${i + 1}`}
                    value={o}
                    onIonInput={(e) => setOptions(options.map((x, j) => (j === i ? String(e.detail.value ?? '') : x)))}
                  />
                </IonItem>
              ))}
              {options.length < 4 && (
                <IonItem button detail={false} onClick={() => setOptions([...options, ''])}>
                  <IonIcon slot="start" icon={addCircle} color="success" />
                  <IonLabel>Option hinzufügen</IonLabel>
                </IonItem>
              )}
            </IonList>
            <IonList inset>
              <IonItem>
                <IonSelect label="Abstimmung offen" interface="action-sheet" value={closesInHours} onIonChange={(e) => setClosesInHours(e.detail.value)}>
                  <IonSelectOption value={24}>24 Stunden</IonSelectOption>
                  <IonSelectOption value={48}>48 Stunden</IonSelectOption>
                  <IonSelectOption value={168}>1 Woche</IonSelectOption>
                  <IonSelectOption value={null}>bis wir entscheiden</IonSelectOption>
                </IonSelect>
              </IonItem>
            </IonList>
            <IonNote className="compose__note">Follower sehen das Resultat, sobald sie abgestimmt haben.</IonNote>
          </>
        )}

        {(kind === 'post' || kind === 'background') && (
          <IonList inset>
            {kind === 'post' && (
              <IonItem>
                <IonInput label="Link" type="url" placeholder="optional" value={link} onIonInput={(e) => setLink(String(e.detail.value ?? ''))} />
              </IonItem>
            )}
            {files.map((f, i) => (
              <IonItem key={`${f.name}-${i}`}>
                <IonThumbnail slot="start" className="compose__thumb">
                  <FilePreview file={f} />
                </IonThumbnail>
                <IonLabel className="ion-text-nowrap">{f.name}</IonLabel>
                <IonButton slot="end" fill="clear" color="danger" aria-label="Entfernen" onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                  <IonIcon slot="icon-only" icon={removeCircle} />
                </IonButton>
              </IonItem>
            ))}
            <IonItem button detail={false} onClick={() => fileInput.current?.click()}>
              <IonIcon slot="start" icon={images} color="primary" />
              <IonLabel color="primary">{kind === 'post' ? 'Fotos, Videos, Audio hinzufügen' : 'Fotos hinzufügen'}</IonLabel>
            </IonItem>
            <input
              ref={fileInput}
              type="file"
              multiple
              hidden
              accept={kind === 'post' ? 'image/*,video/*,audio/*' : 'image/*'}
              onChange={(e) => {
                setFiles([...files, ...Array.from(e.target.files ?? [])])
                e.target.value = ''
              }}
            />
          </IonList>
        )}
      </IonContent>
    </IonModal>
  )
}

export default ComposeModal
