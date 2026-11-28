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
  IonReorder,
  IonReorderGroup,
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
  documentAttachOutline,
  imageOutline,
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
import { draftPost, draftRecap, type DraftAction } from '../lib/aiDraft'
import { readPhotoMeta } from '../lib/exif'
import { useGeoPermission } from '../lib/geoPermission'
import { getPosition, reverseGeocode } from '../lib/location'
import { formatWhen } from '../lib/datetime'
import { cleanLinks, normalizeUrl } from '../lib/links'
import type { Place, Position } from '../lib/location'
import { useCardPresenter } from '../lib/modal'
import { canvasToJpeg } from '../lib/updates'
import DateTimeSheet from './DateTimeSheet'
import LinksEditor from './LinksEditor'
import LocationPicker from './LocationPicker'

interface MediaItem {
  key: string
  existing?: ExistingMedia
  file?: File
}

const fileKeys = new WeakMap<File, string>()
let fileCounter = 0
/** stabiler Schlüssel pro gewählter Datei (für Reihenfolge und React-Keys) */
const fileKey = (f: File) => {
  let k = fileKeys.get(f)
  if (!k) {
    k = `file:${fileCounter++}`
    fileKeys.set(f, k)
  }
  return k
}

export type ComposeKind = 'post' | 'background' | 'edit'

export interface ComposeResult {
  title: string
  text: string
  files: File[]
  links: string[]
  /** Zeitpunkt; null = jetzt bzw. Aufnahmezeit der Fotos */
  at: Date | null
  /** nur gesetzt, wenn der Ort in diesem Dialog gewählt wurde – hat dann Vorrang vor Foto-GPS */
  location: { position: Position; place: Place } | null
  /** Bearbeiten: entfernte Medien-Bausteine */
  removedBlockIds: string[]
  /** Reihenfolge der Medien: Block-ID (vorhanden) oder «new:<Index in files>» */
  mediaOrder: string[]
  /** neuer Beitrag: Ort aus GPS oder Foto (nicht fix – ein Foto mit Ortsdaten darf ihn ersetzen) */
  autoLocation: { position: Position; place: Place } | null
  /** Text stammt aus «Rückblick mit Claude» */
  recap: boolean
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
  /** Gibt es ein Promise zurück, bleibt der Dialog bis zum erfolgreichen Speichern offen (bei Fehlern bleibt alles erhalten). */
  onSubmit: (kind: ComposeKind, result: ComposeResult) => void | Promise<unknown>
}

const heading: Record<ComposeKind, string> = {
  post: 'Neuer Beitrag',
  background: 'Hintergrund',
  edit: 'Bearbeiten',
}

/**
 * Kleine Vorschau eines gewählten Fotos. Nicht das Original als <img>: ein Kamerafoto (12–48 MP) belegt dekodiert
 * 50–200 MB, bei mehreren Fotos lädt iOS die Seite dann neu. Die Vorschauen entstehen nacheinander.
 */
let previewQueue: Promise<unknown> = Promise.resolve()
const PREVIEW_EDGE = 160
const makePreview = (file: File) => {
  const job = previewQueue.then(async () => {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, PREVIEW_EDGE / Math.min(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    return URL.createObjectURL(await canvasToJpeg(canvas, 0.7))
  })
  previewQueue = job.catch(() => undefined)
  return job
}

const FilePreview = ({ file }: { file: File }) => {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file.type.startsWith('image')) return
    let created: string | null = null
    let cancelled = false
    makePreview(file)
      .then((u) => {
        created = u
        if (cancelled) URL.revokeObjectURL(u)
        else setUrl(u)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      if (created) URL.revokeObjectURL(created)
    }
  }, [file])
  if (file.type.startsWith('image')) return url ? <img src={url} alt="" /> : <IonIcon icon={imageOutline} />
  return <IonIcon icon={file.type.startsWith('video') ? videocamOutline : file.type.startsWith('audio') ? micOutline : documentAttachOutline} />
}

/** iOS-Card-Modal für Beitrag, Hintergrund-Story und Bearbeiten – Formular als Inset-Listen. */
const ComposeModal = ({ kind, tripId, initial, onCancel, onSubmit }: Props) => {
  const presenter = useCardPresenter(kind !== null)
  const modal = useRef<HTMLIonModalElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [presentSheet] = useIonActionSheet()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [links, setLinks] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [at, setAt] = useState<Date | null>(null)
  const [choosingTime, setChoosingTime] = useState(false)
  const [location, setLocation] = useState<{ position: Position; place: Place } | null>(null)
  /** neuer Beitrag: Ort automatisch (GPS beim Öffnen, Foto mit Ortsdaten) */
  const [autoLoc, setAutoLoc] = useState<{ position: Position; place: Place; source: 'gps' | 'photo' } | null>(null)
  const [locating, setLocating] = useState(false)
  const [recap, setRecap] = useState(false)
  const geo = useGeoPermission()
  const [picking, setPicking] = useState(false)
  const [removed, setRemoved] = useState<string[]>([])
  const [order, setOrder] = useState<string[]>([])
  const [drafting, setDrafting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [presentToast] = useIonToast()
  const [presentAlert] = useIonAlert()
  const ai = useAiConsent()
  const submitted = useRef(false)
  /** Schliessen ist schon entschieden – keine zweite Nachfrage (z. B. wenn die Eltern-Seite isOpen nachzieht) */
  const closing = useRef(false)

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
    closing.current = false
    setTitle(initial?.title ?? '')
    setText(initial?.text ?? '')
    setLinks(initial?.links ?? [])
    setFiles([])
    setAt(initial?.at ?? null)
    setLocation(null)
    setAutoLoc(initial?.position && initial.place ? { position: initial.position, place: initial.place, source: 'gps' } : null)
    setRecap(false)
    setRemoved([])
    setOrder([])
    // neuer Beitrag: aktuellen Ort holen, wenn erlaubt (wie früher beim Check-in)
    if (kind === 'post' && geo.state === 'granted') {
      setLocating(true)
      void getPosition()
        .then(async (pos) => {
          const place = await reverseGeocode(pos)
          setAutoLoc((cur) => (cur?.source === 'photo' ? cur : { position: pos, place, source: 'gps' }))
        })
        .catch(() => undefined)
        .finally(() => setLocating(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, initial])

  /** Fotos mit Ortsdaten: Ort und Aufnahmezeit gleich im Formular zeigen (ausser Ort/Zeit sind gewählt) */
  const addFiles = async (added: File[]) => {
    setFiles((cur) => [...cur, ...added])
    if (kind !== 'post') return
    for (const f of added) {
      if (!f.type.startsWith('image')) continue
      const meta = await readPhotoMeta(f).catch(() => null)
      if (!meta) continue
      if (meta.takenAt) setAt((cur) => cur ?? meta.takenAt!)
      if (meta.position && !location) {
        const place = await reverseGeocode(meta.position).catch(() => null)
        if (place) setAutoLoc({ position: meta.position, place, source: 'photo' })
      }
      if (meta.position || meta.takenAt) break
    }
  }

  const placeName = location?.place.name ?? autoLoc?.place.name ?? initial?.place?.name ?? null
  const placeSource = location ? null : autoLoc?.source === 'photo' ? 'aus Foto' : autoLoc ? 'GPS' : null
  const existing = (initial?.media ?? []).filter((m) => !removed.includes(m.blockId))
  // Fotos, Videos und Audio in einer gemeinsamen, sortierbaren Liste
  const mediaItems = useMemo(() => {
    const all: MediaItem[] = [...existing.map((m) => ({ key: m.blockId, existing: m })), ...files.map((f) => ({ key: fileKey(f), file: f }))]
    const rank = (k: string) => {
      const i = order.indexOf(k)
      return i < 0 ? Number.MAX_SAFE_INTEGER : i
    }
    return all.map((it, i) => ({ it, i })).sort((a, b) => rank(a.it.key) - rank(b.it.key) || a.i - b.i).map((x) => x.it)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.media, removed, files, order])
  const orderChanged = existing.some((m, i) => mediaItems[i]?.key !== m.blockId)
  const sortedFiles = mediaItems.filter((m) => m.file).map((m) => m.file!)
  const mediaOrder = mediaItems.map((m) => (m.file ? `new:${sortedFiles.indexOf(m.file)}` : m.key))

  const dirty =
    kind === 'edit'
      ? title !== (initial?.title ?? '') ||
        text !== (initial?.text ?? '') ||
        cleanLinks(links).join('\n') !== cleanLinks(initial?.links ?? []).join('\n') ||
        at?.getTime() !== initial?.at?.getTime() ||
        !!location ||
        files.length > 0 ||
        removed.length > 0 ||
        orderChanged
      : !!(title || text || cleanLinks(links).length || files.length)
  const linksOk = links.every((l) => !l.trim() || normalizeUrl(l))
  const valid =
    !linksOk
      ? false
      : kind === 'background'
        ? title.trim().length > 0 && text.trim().length > 0
        : kind === 'edit'
          ? dirty
          : text.trim().length > 0 || files.length > 0

  /** iOS-Muster (Ionic-Doku «canDismiss»): bei ungespeicherten Eingaben per Action Sheet nachfragen. */
  const canDismiss = async () => {
    if (saving) return false
    if (closing.current || submitted.current || !dirty || !kind) {
      closing.current = true
      return true
    }
    return new Promise<boolean>((resolve) => {
      void presentSheet({
        header: 'Eingaben verwerfen?',
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

  /** Rückblick: Claude fasst die Beiträge seit dem letzten Rückblick zusammen und füllt Titel und Text. */
  const draftRecapHere = async () => {
    if (!tripId || drafting) return
    const before = { title, text }
    setDrafting(true)
    try {
      const d = await draftRecap(tripId)
      if (d.title) setTitle(d.title)
      setText(d.text)
      setRecap(true)
      void presentToast({
        message: 'Rückblick von Claude – passe ihn ruhig an.',
        duration: 6000,
        position: 'top',
        buttons: [
          {
            text: 'Rückgängig',
            handler: () => {
              setTitle(before.title)
              setText(before.text)
              setRecap(false)
            },
          },
        ],
      })
    } catch (e) {
      void presentToast({ message: (e as Error).message, duration: 4500, position: 'top', color: 'warning' })
    } finally {
      setDrafting(false)
    }
  }

  /** Mit Text: Auswahl, was Claude tun soll. Ohne Text: neu schreiben oder Rückblick. */
  const openClaude = async () => {
    // Beim ersten Mal: Hinweis zum Datenschutz, aktiv mit «Ja» bestätigen
    if (!(await ai.ensure())) return
    if (!text.trim()) {
      if (kind !== 'post') return void draftWithClaude()
      return void presentSheet({
        header: 'Mit Claude schreiben',
        buttons: [
          { text: 'Aus Stichworten und Fotos', handler: () => void draftWithClaude() },
          { text: 'Rückblick der letzten Tage', handler: () => void draftRecapHere() },
          { text: 'Abbrechen', role: 'cancel' },
        ],
      })
    }
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

  const submit = async () => {
    if (!kind || !valid || saving) return
    submitted.current = true
    const result = onSubmit(kind, {
      title,
      text,
      files: sortedFiles,
      links: cleanLinks(links),
      at,
      location,
      removedBlockIds: removed,
      mediaOrder,
      autoLocation: autoLoc ? { position: autoLoc.position, place: autoLoc.place } : null,
      recap,
    })
    if (!(result instanceof Promise)) return
    setSaving(true)
    try {
      await result
    } catch {
      // Fehler meldet die Eltern-Seite; Eingaben bleiben im offenen Dialog
      submitted.current = false
    } finally {
      setSaving(false)
    }
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
            <IonButton disabled={saving} onClick={() => void modal.current?.dismiss()}>
              Abbrechen
            </IonButton>
          </IonButtons>
          <IonTitle>{kind ? heading[kind] : ''}</IonTitle>
          <IonButtons slot="end">
            <IonButton strong disabled={!valid || saving} onClick={() => void submit()}>
              {saving ? <IonSpinner name="crescent" /> : kind === 'edit' ? 'Sichern' : 'Posten'}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent color="light">
        <IonList inset>
          <IonItem>
            <IonInput
              aria-label="Titel"
              placeholder={kind === 'background' ? 'Titel, z.B. Wie wir das Auto fanden' : 'Titel (optional – sonst der Ort)'}
              value={title}
              onIonInput={(e) => setTitle(String(e.detail.value ?? ''))}
            />
          </IonItem>
          <IonItem>
            <IonTextarea
              aria-label="Text"
              placeholder="Was ist passiert?"
              autoGrow
              rows={6}
              value={text}
              onIonInput={(e) => setText(String(e.detail.value ?? ''))}
            />
          </IonItem>
          {canDraft && (
            <IonItem button detail={false} disabled={drafting || (!draftInput && kind !== 'post')} onClick={() => void openClaude()}>
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
            Ein paar Stichworte oder Fotos genügen – oder ein Rückblick auf die letzten Tage. Claude macht daraus einen
            Beitrag; Stichworte und Fotos gehen dafür an Anthropic.
          </IonNote>
        )}

        <IonList inset>
          <IonItem button detail onClick={() => setPicking(true)}>
            <IonIcon slot="start" icon={locationOutline} color="primary" />
            <IonLabel>Ort</IonLabel>
            <IonNote slot="end" className="compose__value">
              {locating && !placeName
                ? 'Wird ermittelt …'
                : placeName
                  ? `${placeName.split(',')[0]}${placeSource ? ` (${placeSource})` : ''}`
                  : kind === 'edit'
                    ? 'Ohne Ort'
                    : 'Ort wählen'}
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
        {kind !== 'edit' && (
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
          initial={location?.position ?? autoLoc?.position ?? initial?.position ?? null}
          onClose={() => setPicking(false)}
          onPick={(position, place) => setLocation({ position, place })}
        />

        {(kind === 'post' || kind === 'background' || kind === 'edit') && (
          <IonList inset>
            <IonReorderGroup
              disabled={mediaItems.length < 2}
              onIonReorderEnd={(e) => setOrder(e.detail.complete(mediaItems.map((m) => m.key)) as string[])}
            >
              {mediaItems.map((m) => (
                <IonItem key={m.key}>
                  <IonThumbnail slot="start" className="compose__thumb">
                    {m.file ? (
                      <FilePreview file={m.file} />
                    ) : m.existing!.kind === 'photo' ? (
                      <img src={m.existing!.url} alt="" decoding="async" />
                    ) : (
                      <IonIcon icon={m.existing!.kind === 'video' ? videocamOutline : micOutline} />
                    )}
                  </IonThumbnail>
                  <IonLabel className="ion-text-nowrap">
                    {m.file ? m.file.name : m.existing!.kind === 'photo' ? 'Foto' : m.existing!.kind === 'video' ? 'Video' : 'Sprachnachricht'}
                  </IonLabel>
                  <IonButton
                    slot="end"
                    fill="clear"
                    color="danger"
                    aria-label="Entfernen"
                    onClick={() => (m.file ? setFiles(files.filter((f) => f !== m.file)) : setRemoved([...removed, m.key]))}
                  >
                    <IonIcon slot="icon-only" icon={removeCircle} />
                  </IonButton>
                  {mediaItems.length > 1 && <IonReorder slot="end" aria-label="Verschieben" />}
                </IonItem>
              ))}
            </IonReorderGroup>
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
                void addFiles(Array.from(e.target.files ?? []))
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
