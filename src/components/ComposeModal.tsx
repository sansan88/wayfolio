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
  IonSpinner,
  IonThumbnail,
  IonTitle,
  IonToolbar,
  useIonActionSheet,
  useIonAlert,
  useIonToast,
} from '@ionic/react'
import {
  addCircle,
  documentAttachOutline,
  images,
  locationOutline,
  micOutline,
  removeCircle,
  sparklesOutline,
  timeOutline,
  videocamOutline,
} from 'ionicons/icons'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useAiConsent } from '../lib/aiConsent'
import { draftPost, type DraftAction } from '../lib/aiDraft'
import { formatWhen } from '../lib/datetime'
import { cleanLinks, normalizeUrl } from '../lib/links'
import type { Place, Position } from '../lib/location'
import { useCardPresenter } from '../lib/modal'
import DateTimeSheet from './DateTimeSheet'
import LinksEditor from './LinksEditor'
import LocationPicker from './LocationPicker'

export type ComposeKind = 'post' | 'background' | 'poll' | 'edit'

export interface ComposeResult {
  title: string
  text: string
  files: File[]
  links: string[]
  options: string[]
  closesInHours: number | null
  /** Zeitpunkt; null = jetzt bzw. Aufnahmezeit der Fotos */
  at: Date | null
  /** nur gesetzt, wenn der Ort in diesem Dialog gewählt wurde – hat dann Vorrang vor Foto-GPS */
  location: { position: Position; place: Place } | null
  /** Bearbeiten: entfernte Medien-Bausteine */
  removedBlockIds: string[]
}

export interface ExistingMedia {
  blockId: string
  kind: string
  url: string
}

interface Props {
  kind: ComposeKind | null
  /** Reise – nötig für Entwürfe mit Claude */
  tripId?: string
  /** Startwerte: beim Erfassen Ort/Zeit aus «Erfassen», beim Bearbeiten der ganze Beitrag */
  initial?: {
    title?: string
    text?: string
    links?: string[]
    at?: Date | null
    place?: Place | null
    position?: Position | null
    media?: ExistingMedia[]
  }
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
const ComposeModal = ({ kind, tripId, initial, onCancel, onSubmit }: Props) => {
  const presenter = useCardPresenter(kind !== null)
  const modal = useRef<HTMLIonModalElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [presentSheet] = useIonActionSheet()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [links, setLinks] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [options, setOptions] = useState(['', ''])
  const [closesInHours, setClosesInHours] = useState<number | null>(48)
  const [at, setAt] = useState<Date | null>(null)
  const [choosingTime, setChoosingTime] = useState(false)
  const [location, setLocation] = useState<{ position: Position; place: Place } | null>(null)
  const [picking, setPicking] = useState(false)
  const [removed, setRemoved] = useState<string[]>([])
  const [drafting, setDrafting] = useState(false)
  const [presentToast] = useIonToast()
  const [presentAlert] = useIonAlert()
  const ai = useAiConsent()
  const submitted = useRef(false)

  // Nur beim Öffnen zurücksetzen bzw. mit den Werten zum Bearbeiten füllen – nicht, wenn sich
  // im Hintergrund Daten aktualisieren (sonst gingen Eingaben während des Tippens verloren)
  const openedFor = useRef<ComposeKind | null>(null)
  useEffect(() => {
    if (!kind) {
      openedFor.current = null
      return
    }
    if (openedFor.current === kind) return
    openedFor.current = kind
    submitted.current = false
    setTitle(initial?.title ?? '')
    setText(initial?.text ?? '')
    setLinks(initial?.links ?? [])
    setFiles([])
    setOptions(['', ''])
    setClosesInHours(48)
    setAt(initial?.at ?? null)
    setLocation(null)
    setRemoved([])
  }, [kind, initial])

  const placeName = location?.place.name ?? initial?.place?.name ?? null
  const existing = (initial?.media ?? []).filter((m) => !removed.includes(m.blockId))

  const filledOptions = options.map((o) => o.trim()).filter(Boolean)
  const dirty =
    kind === 'edit'
      ? title !== (initial?.title ?? '') ||
        text !== (initial?.text ?? '') ||
        cleanLinks(links).join('\n') !== cleanLinks(initial?.links ?? []).join('\n') ||
        at?.getTime() !== initial?.at?.getTime() ||
        !!location ||
        files.length > 0 ||
        removed.length > 0
      : !!(title || text || cleanLinks(links).length || files.length || filledOptions.length)
  const linksOk = links.every((l) => !l.trim() || normalizeUrl(l))
  const valid =
    !linksOk
      ? false
      : kind === 'poll'
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

  const canDraft = !!tripId && (kind === 'post' || kind === 'edit' || kind === 'background')
  const draftInput = !!(
    text.trim() ||
    title.trim() ||
    files.some((f) => f.type.startsWith('image')) ||
    existing.some((m) => m.kind === 'photo')
  )

  /** Stichworte, Ort, Zeit und Fotos an Claude – Ergebnis ersetzt Titel und Text, mit «Rückgängig». */
  const draftWithClaude = async (action?: DraftAction, instruction?: string) => {
    if (!tripId || drafting) return
    const before = { title, text }
    setDrafting(true)
    try {
      const d = await draftPost({
        tripId,
        notes: text,
        title,
        action,
        instruction,
        place: placeName,
        when: formatWhen(at ?? initial?.at ?? new Date()),
        files,
        urls: existing.filter((m) => m.kind === 'photo').map((m) => m.url),
      })
      if (d.title) setTitle(d.title)
      setText(d.text)
      void presentToast({
        message: action === 'proofread' ? 'Korrigiert von Claude.' : 'Entwurf von Claude – passe ihn ruhig an.',
        duration: 6000,
        position: 'top',
        buttons: [
          {
            text: 'Rückgängig',
            handler: () => {
              setTitle(before.title)
              setText(before.text)
            },
          },
        ],
      })
    } catch (e) {
      void presentToast({ message: (e as Error).message, duration: 4000, position: 'top', color: 'danger' })
    } finally {
      setDrafting(false)
    }
  }

  /** «Umformulieren»: Wunsch eingeben, dann überarbeiten */
  const askRewrite = () =>
    presentAlert({
      header: 'Umformulieren',
      message: 'Was soll Claude ändern?',
      inputs: [
        {
          name: 'wish',
          type: 'textarea',
          placeholder: 'z. B. lockerer, mehr über das Essen, ohne Emojis',
          attributes: { maxlength: 500, rows: 3 },
        },
      ],
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: 'Umformulieren',
          handler: (v: { wish?: string }) => {
            const wish = v.wish?.trim()
            if (!wish) return false
            void draftWithClaude('rewrite', wish)
          },
        },
      ],
    })

  /** Mit Text: Auswahl, was Claude tun soll. Ohne Text: direkt aus Stichworten/Fotos schreiben. */
  const openClaude = async () => {
    // Beim ersten Mal: Hinweis zum Datenschutz, aktiv mit «Ja» bestätigen
    if (!(await ai.ensure())) return
    if (!text.trim()) return void draftWithClaude()
    void presentSheet({
      header: 'Mit Claude überarbeiten',
      buttons: [
        { text: 'Korrekturlesen', handler: () => void draftWithClaude('proofread') },
        { text: 'Kürzen', handler: () => void draftWithClaude('shorten') },
        { text: 'Länger', handler: () => void draftWithClaude('lengthen') },
        { text: 'Umformulieren …', handler: () => void askRewrite() },
        { text: 'Aus Stichworten neu schreiben', handler: () => void draftWithClaude() },
        { text: 'Abbrechen', role: 'cancel' },
      ],
    })
  }

  const submit = () => {
    if (!kind || !valid) return
    submitted.current = true
    onSubmit(kind, { title, text, files, links: cleanLinks(links), options: filledOptions, closesInHours, at, location, removedBlockIds: removed })
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
          {canDraft && (
            <IonItem button detail={false} disabled={drafting || !draftInput} onClick={() => void openClaude()}>
              {drafting ? (
                <IonSpinner slot="start" name="crescent" color="primary" />
              ) : (
                <IonIcon slot="start" icon={sparklesOutline} color="primary" />
              )}
              <IonLabel color="primary">
                {drafting ? 'Claude schreibt …' : text.trim() ? 'Mit Claude überarbeiten …' : 'Mit Claude schreiben'}
              </IonLabel>
            </IonItem>
          )}
        </IonList>
        {canDraft && !text.trim() && (
          <IonNote className="compose__note">
            Ein paar Stichworte oder Fotos genügen – Claude macht daraus einen Beitrag. Stichworte und Fotos gehen dafür
            an Anthropic.
          </IonNote>
        )}

        <IonList inset>
          <IonItem button detail onClick={() => setPicking(true)}>
            <IonIcon slot="start" icon={locationOutline} color="primary" />
            <IonLabel>Ort</IonLabel>
            <IonNote slot="end" className="compose__value">
              {placeName?.split(',')[0] ?? (kind === 'edit' ? 'Ohne Ort' : 'Aus Fotos oder GPS')}
            </IonNote>
          </IonItem>
          <IonItem button detail onClick={() => setChoosingTime(true)}>
            <IonIcon slot="start" icon={timeOutline} color={at && kind !== 'edit' ? 'warning' : 'primary'} />
            <IonLabel>Zeitpunkt</IonLabel>
            <IonNote slot="end" className="compose__value">
              {at ? formatWhen(at) : kind === 'edit' ? '–' : 'Jetzt / Aufnahmezeit'}
            </IonNote>
          </IonItem>
        </IonList>
        {kind !== 'edit' && kind !== 'poll' && (
          <IonNote className="compose__note">Fotos mit Ortsdaten setzen Ort und Zeit automatisch – ausser du wählst sie hier.</IonNote>
        )}
        <DateTimeSheet
          isOpen={choosingTime}
          value={at}
          allowNow={kind !== 'edit'}
          onClose={() => setChoosingTime(false)}
          onChange={(d) => (d || kind !== 'edit') && setAt(d)}
        />
        <LocationPicker
          isOpen={picking}
          initial={location?.position ?? initial?.position ?? null}
          onClose={() => setPicking(false)}
          onPick={(position, place) => setLocation({ position, place })}
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

        {(kind === 'post' || kind === 'background' || kind === 'edit') && (
          <IonList inset>
            {existing.map((m) => (
              <IonItem key={m.blockId}>
                <IonThumbnail slot="start" className="compose__thumb">
                  {m.kind === 'photo' ? <img src={m.url} alt="" /> : <IonIcon icon={m.kind === 'video' ? videocamOutline : micOutline} />}
                </IonThumbnail>
                <IonLabel>{m.kind === 'photo' ? 'Foto' : m.kind === 'video' ? 'Video' : 'Sprachnachricht'}</IonLabel>
                <IonButton slot="end" fill="clear" color="danger" aria-label="Entfernen" onClick={() => setRemoved([...removed, m.blockId])}>
                  <IonIcon slot="icon-only" icon={removeCircle} />
                </IonButton>
              </IonItem>
            ))}
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
              <IonLabel color="primary">{kind === 'background' ? 'Fotos hinzufügen' : 'Fotos, Videos, Audio hinzufügen'}</IonLabel>
            </IonItem>
            <input
              ref={fileInput}
              type="file"
              multiple
              hidden
              accept={kind === 'background' ? 'image/*' : 'image/*,video/*,audio/*'}
              onChange={(e) => {
                setFiles([...files, ...Array.from(e.target.files ?? [])])
                e.target.value = ''
              }}
            />
          </IonList>
        )}
        {(kind === 'post' || kind === 'edit') && <LinksEditor links={links} onChange={setLinks} />}
      </IonContent>
    </IonModal>
  )
}

export default ComposeModal
