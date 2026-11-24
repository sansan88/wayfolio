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
  IonTitle,
  IonToolbar,
  useIonAlert,
  useIonToast,
} from '@ionic/react'
import { logOutOutline, mailOutline, openOutline, personAddOutline, trashOutline } from 'ionicons/icons'
import { useEffect, useRef, useState } from 'react'

import { useAuth } from '../lib/auth'
import { createInvite, loadMembers, removeMember, type Member } from '../lib/members'
import { FREQUENCY_LABEL, removeSubscriber, tripSubscribers, type Subscriber } from '../lib/subscriptions'
import { useTrip, type Trip } from '../lib/trip'
import { useCardPresenter } from '../lib/modal'
import { toLocalIso } from '../lib/datetime'
import DateTimeSheet from './DateTimeSheet'

const toDay = (d: Date) => toLocalIso(d).slice(0, 10)
const fromDay = (day: string) => (day ? new Date(`${day}T12:00`) : new Date())
const showDay = (day: string) =>
  new Date(`${day}T12:00`).toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' })

interface Props {
  trip: Trip | null
  onClose: () => void
}


/** Eine Reise bearbeiten: Details, Standort-Verzögerung und Mitreisende in einem iOS-Card-Modal. */
const TripEditorModal = ({ trip, onClose }: Props) => {
  const presenter = useCardPresenter(trip !== null)
  const [pickingDate, setPickingDate] = useState<'start' | 'end' | null>(null)
  const { session } = useAuth()
  const userId = session!.user.id
  const { trip: current, selectTrip, updateTrip, reload } = useTrip()
  const [presentToast] = useIonToast()
  const [presentAlert] = useIonAlert()
  const modal = useRef<HTMLIonModalElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startsOn, setStartsOn] = useState('')
  const [endsOn, setEndsOn] = useState('')
  const [delay, setDelay] = useState(0)
  const [members, setMembers] = useState<Member[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[] | null>(null)
  const [saving, setSaving] = useState(false)

  const isOwner = trip?.owner_id === userId
  const toast = (message: string, color: 'success' | 'danger' = 'success') =>
    presentToast({ message, duration: 2500, position: 'top', color })

  const refreshMembers = (id: string) => loadMembers(id).then(setMembers).catch(() => setMembers([]))

  useEffect(() => {
    if (!trip) return
    setTitle(trip.title)
    setDescription(trip.description ?? '')
    setStartsOn(trip.starts_on ?? '')
    setEndsOn(trip.ends_on ?? '')
    setDelay(trip.location_delay_minutes ?? 0)
    void refreshMembers(trip.id)
    setSubscribers(null)
    void tripSubscribers(trip.id)
      .then(setSubscribers)
      .catch(() => setSubscribers([]))
  }, [trip])

  const subStatus = (s: Subscriber) =>
    s.status === 'unconfirmed'
      ? 'E-Mail nicht bestätigt'
      : s.status === 'paused'
        ? 'pausiert'
        : s.frequency === 'instant' || s.frequency === 'weekly'
          ? FREQUENCY_LABEL[s.frequency]
          : 'monatlich'

  const confirmRemoveSubscriber = (s: Subscriber) =>
    presentAlert({
      header: `${s.name} entfernen?`,
      message: `${s.email} bekommt keine Updates dieser Reise mehr per E-Mail.`,
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: 'Entfernen',
          role: 'destructive',
          handler: () =>
            void removeSubscriber(s)
              .then(() => setSubscribers((l) => l?.filter((x) => x.id !== s.id) ?? null))
              .catch((e: Error) => toast(e.message, 'danger')),
        },
      ],
    })

  const save = async () => {
    if (!trip) return
    setSaving(true)
    try {
      await updateTrip(trip.id, {
        title: title.trim(),
        description: description.trim() || null,
        starts_on: startsOn || null,
        ends_on: endsOn || null,
        location_delay_minutes: delay,
      })
      toast('Reise gespeichert')
      await modal.current?.dismiss()
    } catch (e) {
      toast((e as Error).message, 'danger')
    } finally {
      setSaving(false)
    }
  }

  const invite = async () => {
    if (!trip) return
    try {
      const url = await createInvite(trip.id, userId)
      const text = `Reist du mit? Hier kannst du bei unserer Reise «${trip.title}» mitschreiben:`
      if (navigator.share) await navigator.share({ title: 'Einladung zu Little Footnotes', text, url }).catch(() => undefined)
      else {
        await navigator.clipboard.writeText(url)
        toast('Einladungslink kopiert (7 Tage gültig)')
      }
    } catch (e) {
      toast((e as Error).message, 'danger')
    }
  }

  const confirmRemove = (m: Member) =>
    presentAlert({
      header: m.profile_id === userId ? 'Reise verlassen?' : `${m.display_name ?? 'Mitreisende'} entfernen?`,
      message: 'Die bisherigen Beiträge bleiben in der Reise.',
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: m.profile_id === userId ? 'Verlassen' : 'Entfernen',
          role: 'destructive',
          handler: () =>
            void removeMember(trip!.id, m.profile_id)
              .then(async () => {
                if (m.profile_id === userId) {
                  await modal.current?.dismiss()
                  await reload()
                } else await refreshMembers(trip!.id)
              })
              .catch((e: Error) => toast(e.message, 'danger')),
        },
      ],
    })

  return (
    <IonModal ref={modal} isOpen={trip !== null} presentingElement={presenter} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => void modal.current?.dismiss()}>Abbrechen</IonButton>
          </IonButtons>
          <IonTitle>Reise bearbeiten</IonTitle>
          <IonButtons slot="end">
            <IonButton strong disabled={saving || !title.trim()} onClick={() => void save()}>
              Sichern
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent color="light">
        {trip && trip.id !== current?.id && (
          <IonList inset>
            <IonItem
              button
              detail={false}
              onClick={() => {
                selectTrip(trip.id)
                void modal.current?.dismiss()
              }}
            >
              <IonIcon slot="start" icon={openOutline} color="primary" />
              <IonLabel color="primary">Diese Reise öffnen</IonLabel>
            </IonItem>
          </IonList>
        )}

        <IonList inset>
          <IonListHeader>
            <IonLabel>Details</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonInput label="Name" className="ion-text-end" value={title} onIonInput={(e) => setTitle(String(e.detail.value ?? ''))} />
          </IonItem>
          <IonItem>
            <IonTextarea
              aria-label="Beschreibung"
              placeholder="Beschreibung (sehen auch Follower)"
              autoGrow
              rows={2}
              value={description}
              onIonInput={(e) => setDescription(String(e.detail.value ?? ''))}
            />
          </IonItem>
          <IonItem button detail={false} onClick={() => setPickingDate('start')}>
            <IonLabel>Start</IonLabel>
            <IonNote slot="end" color={startsOn ? 'dark' : 'medium'}>
              {startsOn ? showDay(startsOn) : 'Festlegen'}
            </IonNote>
          </IonItem>
          <IonItem button detail={false} onClick={() => setPickingDate('end')}>
            <IonLabel>Ende</IonLabel>
            <IonNote slot="end" color={endsOn ? 'dark' : 'medium'}>
              {endsOn ? showDay(endsOn) : 'Festlegen'}
            </IonNote>
          </IonItem>
          <IonItem>
            <IonSelect label="Standort für Follower" interface="action-sheet" value={delay} onIonChange={(e) => setDelay(Number(e.detail.value))}>
              <IonSelectOption value={0}>sofort</IonSelectOption>
              <IonSelectOption value={60}>1 h verzögert</IonSelectOption>
              <IonSelectOption value={360}>6 h verzögert</IonSelectOption>
              <IonSelectOption value={1440}>24 h verzögert</IonSelectOption>
            </IonSelect>
          </IonItem>
        </IonList>
        <IonNote className="list-footnote">
          Mit Verzögerung sehen Follower neue Orte, Route-Updates und Routenpunkte erst später.
        </IonNote>

        <IonList inset>
          <IonListHeader>
            <IonLabel>Mitreisende</IonLabel>
          </IonListHeader>
          {members.map((m) => (
            <IonItem key={m.profile_id}>
              <IonLabel>
                {m.display_name ?? 'Ohne Namen'}
                {m.profile_id === userId && ' (du)'}
                <p>{m.role === 'owner' ? 'hat die Reise angelegt' : 'schreibt mit'}</p>
              </IonLabel>
              {m.role !== 'owner' && (isOwner || m.profile_id === userId) && (
                <IonButton slot="end" fill="clear" color="danger" onClick={() => void confirmRemove(m)} aria-label="Entfernen">
                  <IonIcon slot="icon-only" icon={m.profile_id === userId ? logOutOutline : trashOutline} />
                </IonButton>
              )}
            </IonItem>
          ))}
          <IonItem button detail={false} onClick={() => void invite()}>
            <IonIcon slot="start" icon={personAddOutline} color="primary" />
            <IonLabel color="primary">Mitreisende einladen</IonLabel>
          </IonItem>
        </IonList>
        <IonNote className="list-footnote">
          Gilt nur für diese Reise. Der Einladungslink ist 7 Tage gültig; Mitreisende melden sich mit ihrer eigenen
          E-Mail an und können danach alles erfassen und bearbeiten.
        </IonNote>

        <IonList inset>
          <IonListHeader>
            <IonLabel>Newsletter-Abos{subscribers?.length ? ` (${subscribers.length})` : ''}</IonLabel>
          </IonListHeader>
          {subscribers === null && (
            <IonItem>
              <IonLabel color="medium">Wird geladen …</IonLabel>
            </IonItem>
          )}
          {subscribers?.length === 0 && (
            <IonItem>
              <IonLabel color="medium">Noch niemand hat die Updates per E-Mail abonniert.</IonLabel>
            </IonItem>
          )}
          {subscribers?.map((s) => (
            <IonItem key={s.id}>
              <IonIcon slot="start" icon={mailOutline} color={s.status === 'active' ? 'primary' : 'medium'} />
              <IonLabel>
                {s.name}
                <p>{s.email}</p>
                <p>{subStatus(s)}</p>
              </IonLabel>
              <IonButton slot="end" fill="clear" color="danger" onClick={() => void confirmRemoveSubscriber(s)} aria-label={`${s.name} entfernen`}>
                <IonIcon slot="icon-only" icon={trashOutline} />
              </IonButton>
            </IonItem>
          ))}
        </IonList>
        <IonNote className="list-footnote">
          Abonnieren geht über den Reise-Link («Updates per E-Mail»). Die Adresse wird per Link bestätigt; danach
          verwalten Abonnent:innen Häufigkeit und Pausen selbst.
        </IonNote>

        <DateTimeSheet
          isOpen={pickingDate !== null}
          presentation="date"
          title={pickingDate === 'end' ? 'Ende' : 'Start'}
          allowNow={false}
          max={null}
          min={pickingDate === 'end' ? startsOn || undefined : undefined}
          value={fromDay(pickingDate === 'end' ? endsOn || startsOn : startsOn)}
          onClose={() => setPickingDate(null)}
          onChange={(d) => d && (pickingDate === 'end' ? setEndsOn(toDay(d)) : setStartsOn(toDay(d)))}
        />
      </IonContent>
    </IonModal>
  )
}

export default TripEditorModal
