import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonTextarea,
  IonTitle,
  IonToolbar,
  useIonAlert,
  useIonToast,
  useIonViewWillEnter,
} from '@ionic/react'
import { addOutline, checkmark, logOutOutline, personAddOutline, trashOutline } from 'ionicons/icons'
import { useEffect, useState } from 'react'

import { useAuth } from '../lib/auth'
import { createInvite, loadMembers, loadOwnName, removeMember, saveOwnName, type Member } from '../lib/members'
import { useTrip } from '../lib/trip'

const TripSettingsPage = () => {
  const { session, signOut } = useAuth()
  const userId = session!.user.id
  const { trip, trips, selectTrip, createTrip, updateTrip, reload } = useTrip()
  const [presentToast] = useIonToast()
  const [presentAlert] = useIonAlert()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startsOn, setStartsOn] = useState('')
  const [endsOn, setEndsOn] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [myName, setMyName] = useState('')
  const [saving, setSaving] = useState(false)

  const isOwner = trip?.owner_id === userId
  const toast = (message: string, color: 'success' | 'danger' = 'success') =>
    presentToast({ message, duration: 2500, position: 'top', color })

  useEffect(() => {
    setTitle(trip?.title ?? '')
    setDescription(trip?.description ?? '')
    setStartsOn(trip?.starts_on ?? '')
    setEndsOn(trip?.ends_on ?? '')
  }, [trip])

  const refreshMembers = () => {
    if (trip) loadMembers(trip.id).then(setMembers).catch(() => setMembers([]))
  }

  useIonViewWillEnter(() => {
    refreshMembers()
    void loadOwnName(userId).then(setMyName)
  }, [trip?.id])

  const save = async () => {
    setSaving(true)
    try {
      await updateTrip({
        title: title.trim(),
        description: description.trim() || null,
        starts_on: startsOn || null,
        ends_on: endsOn || null,
      })
      toast('Reise gespeichert')
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
      if (navigator.share) await navigator.share({ title: 'Einladung zu Wayfolio', text, url }).catch(() => undefined)
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
                if (m.profile_id === userId) await reload()
                else refreshMembers()
              })
              .catch((e: Error) => toast(e.message, 'danger')),
        },
      ],
    })

  const newTrip = () =>
    presentAlert({
      header: 'Neue Reise',
      inputs: [{ name: 'title', placeholder: 'Name der Reise' }],
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: 'Anlegen',
          handler: (v: { title: string }) => {
            if (!v.title?.trim()) return false
            void createTrip(v.title.trim(), new Date().toISOString().slice(0, 10))
              .then(() => toast('Neue Reise angelegt'))
              .catch((e: Error) => toast(e.message, 'danger'))
          },
        },
      ],
    })

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Reise</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList inset>
          <IonListHeader>
            <IonLabel>Details</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonInput label="Name" labelPlacement="stacked" value={title} onIonInput={(e) => setTitle(String(e.detail.value ?? ''))} />
          </IonItem>
          <IonItem>
            <IonTextarea
              label="Beschreibung (sehen auch Follower)"
              labelPlacement="stacked"
              autoGrow
              value={description}
              onIonInput={(e) => setDescription(String(e.detail.value ?? ''))}
            />
          </IonItem>
          <IonItem>
            <IonInput type="date" label="Start" labelPlacement="stacked" value={startsOn} onIonInput={(e) => setStartsOn(String(e.detail.value ?? ''))} />
          </IonItem>
          <IonItem>
            <IonInput type="date" label="Ende" labelPlacement="stacked" value={endsOn} onIonInput={(e) => setEndsOn(String(e.detail.value ?? ''))} />
          </IonItem>
        </IonList>
        <div className="ion-padding-horizontal">
          <IonButton expand="block" disabled={saving || !title.trim()} onClick={() => void save()}>
            Speichern
          </IonButton>
        </div>

        <IonList inset>
          <IonListHeader>
            <IonLabel>Mitreisende</IonLabel>
          </IonListHeader>
          {members.map((m) => (
            <IonItem key={m.profile_id}>
              <IonLabel>
                {m.display_name ?? 'Ohne Namen'}
                {m.profile_id === userId && ' (du)'}
                <IonNote className="ion-display-block">{m.role === 'owner' ? 'hat die Reise angelegt' : 'schreibt mit'}</IonNote>
              </IonLabel>
              {m.role !== 'owner' && (isOwner || m.profile_id === userId) && (
                <IonButton slot="end" fill="clear" color="medium" onClick={() => void confirmRemove(m)} aria-label="Entfernen">
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
        <IonNote className="ion-padding-horizontal ion-display-block">
          Der Einladungslink ist 7 Tage gültig. Mitreisende melden sich mit ihrer eigenen E-Mail an und können danach
          alles erfassen und bearbeiten.
        </IonNote>

        <IonList inset>
          <IonListHeader>
            <IonLabel>Deine Reisen</IonLabel>
          </IonListHeader>
          {trips.map((t) => (
            <IonItem key={t.id} button detail={false} onClick={() => selectTrip(t.id)}>
              <IonLabel>
                {t.title}
                {t.owner_id !== userId && <IonNote className="ion-display-block">als Mitreisende</IonNote>}
              </IonLabel>
              {t.id === trip?.id && <IonIcon slot="end" icon={checkmark} color="primary" />}
            </IonItem>
          ))}
          <IonItem button detail={false} onClick={() => void newTrip()}>
            <IonIcon slot="start" icon={addOutline} color="primary" />
            <IonLabel color="primary">Neue Reise anlegen</IonLabel>
          </IonItem>
        </IonList>

        <IonList inset>
          <IonListHeader>
            <IonLabel>Dein Profil</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonInput
              label="Dein Name (steht an deinen Beiträgen)"
              labelPlacement="stacked"
              value={myName}
              onIonInput={(e) => setMyName(String(e.detail.value ?? ''))}
              onIonBlur={() =>
                myName.trim() &&
                void saveOwnName(userId, myName)
                  .then(() => toast('Name gespeichert'))
                  .catch((e: Error) => toast(e.message, 'danger'))
              }
            />
          </IonItem>
          <IonItem button detail={false} onClick={signOut}>
            <IonIcon slot="start" icon={logOutOutline} />
            <IonLabel>Abmelden ({session?.user.email})</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  )
}

export default TripSettingsPage
