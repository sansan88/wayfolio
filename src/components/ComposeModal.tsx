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
  IonModal,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { addOutline, closeCircle, images } from 'ionicons/icons'
import { useRef, useState } from 'react'

export type ComposeKind = 'post' | 'background' | 'poll'

export interface ComposeResult {
  title: string
  text: string
  files: File[]
  link: string
  options: string[]
  closesInHours: number | null
}

interface Props {
  kind: ComposeKind | null
  onCancel: () => void
  onSubmit: (kind: ComposeKind, result: ComposeResult) => void
}

const heading: Record<ComposeKind, string> = {
  post: 'Beitrag schreiben',
  background: 'Hintergrund-Story',
  poll: 'Entscheidung teilen',
}

/** Formular für Beitrag, Hintergrund-Story und Abstimmung. */
const ComposeModal = ({ kind, onCancel, onSubmit }: Props) => {
  const fileInput = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [link, setLink] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [options, setOptions] = useState(['', ''])
  const [closesInHours, setClosesInHours] = useState<number | null>(48)

  const reset = () => {
    setTitle('')
    setText('')
    setLink('')
    setFiles([])
    setOptions(['', ''])
    setClosesInHours(48)
  }

  const filledOptions = options.map((o) => o.trim()).filter(Boolean)
  const valid =
    kind === 'poll'
      ? title.trim().length > 0 && filledOptions.length >= 2
      : kind === 'background'
        ? title.trim().length > 0 && text.trim().length > 0
        : text.trim().length > 0 || files.length > 0

  const submit = () => {
    if (!kind || !valid) return
    onSubmit(kind, { title, text, files, link, options: filledOptions, closesInHours })
    reset()
  }

  return (
    <IonModal isOpen={kind !== null} onDidDismiss={onCancel}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onCancel}>Abbrechen</IonButton>
          </IonButtons>
          <IonTitle>{kind ? heading[kind] : ''}</IonTitle>
          <IonButtons slot="end">
            <IonButton strong disabled={!valid} onClick={submit}>
              Posten
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonInput
          fill="outline"
          label={kind === 'poll' ? 'Frage an die Community' : 'Titel'}
          labelPlacement="floating"
          placeholder={kind === 'poll' ? 'Welches Auto sollen wir kaufen?' : kind === 'background' ? 'Wie wir das Auto fanden' : 'Tag 12: Ankunft in Hoi An'}
          value={title}
          onIonInput={(e) => setTitle(String(e.detail.value ?? ''))}
        />
        <IonTextarea
          className="ion-margin-top"
          fill="outline"
          label={kind === 'poll' ? 'Kurze Beschreibung (optional)' : 'Text'}
          labelPlacement="floating"
          autoGrow
          rows={kind === 'poll' ? 2 : 6}
          value={text}
          onIonInput={(e) => setText(String(e.detail.value ?? ''))}
        />

        {kind === 'poll' && (
          <IonList className="ion-margin-top">
            {options.map((o, i) => (
              <IonItem key={i}>
                <IonInput
                  label={`Option ${i + 1}`}
                  value={o}
                  onIonInput={(e) => setOptions(options.map((x, j) => (j === i ? String(e.detail.value ?? '') : x)))}
                />
                {options.length > 2 && (
                  <IonButton slot="end" fill="clear" color="medium" onClick={() => setOptions(options.filter((_, j) => j !== i))}>
                    <IonIcon slot="icon-only" icon={closeCircle} />
                  </IonButton>
                )}
              </IonItem>
            ))}
            {options.length < 4 && (
              <IonButton fill="clear" size="small" onClick={() => setOptions([...options, ''])}>
                <IonIcon slot="start" icon={addOutline} /> Option hinzufügen
              </IonButton>
            )}
            <IonItem>
              <IonSelect label="Abstimmung offen" value={closesInHours} onIonChange={(e) => setClosesInHours(e.detail.value)}>
                <IonSelectOption value={24}>24 Stunden</IonSelectOption>
                <IonSelectOption value={48}>48 Stunden</IonSelectOption>
                <IonSelectOption value={168}>1 Woche</IonSelectOption>
                <IonSelectOption value={null}>bis wir entscheiden</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonNote>Follower sehen das Resultat, sobald sie abgestimmt haben.</IonNote>
          </IonList>
        )}

        {kind !== 'poll' && (
          <>
            {kind === 'post' && (
              <IonInput
                className="ion-margin-top"
                fill="outline"
                type="url"
                label="Link (optional)"
                labelPlacement="floating"
                value={link}
                onIonInput={(e) => setLink(String(e.detail.value ?? ''))}
              />
            )}
            <IonButton className="ion-margin-top" fill="outline" onClick={() => fileInput.current?.click()}>
              <IonIcon slot="start" icon={images} />
              {kind === 'post' ? 'Fotos, Videos, Audio' : 'Fotos'}
            </IonButton>
            {files.length > 0 && (
              <IonList>
                {files.map((f, i) => (
                  <IonItem key={`${f.name}-${i}`}>
                    <IonLabel>{f.name}</IonLabel>
                    <IonButton slot="end" fill="clear" color="medium" onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                      <IonIcon slot="icon-only" icon={closeCircle} />
                    </IonButton>
                  </IonItem>
                ))}
              </IonList>
            )}
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
          </>
        )}
      </IonContent>
    </IonModal>
  )
}

export default ComposeModal
