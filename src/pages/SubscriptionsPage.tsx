import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
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
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToggle,
  IonToolbar,
  useIonAlert,
  useIonToast,
} from '@ionic/react'
import { chevronBack, mailOutline } from 'ionicons/icons'
import { useCallback, useEffect, useState } from 'react'

import CamperRefresher from '../components/CamperRefresher'
import PageSpinner from '../components/PageSpinner'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import {
  deleteSubscription,
  FREQUENCY_LABEL,
  mySubscriptions,
  subscribeTrip,
  takePending,
  updateSubscription,
  type Frequency,
  type MySubscription,
} from '../lib/subscriptions'
import './FeedPage.css'

const base = import.meta.env.BASE_URL

/** «Meine Abos»: Newsletter-Abos des Kontos verwalten – auch für Community-Mitglieder ohne eigene Reise. */
const SubscriptionsPage = () => {
  const { session, signOut } = useAuth()
  const [subs, setSubs] = useState<MySubscription[] | null>(null)
  const [name, setName] = useState('')
  const [presentToast] = useIonToast()
  const [presentAlert] = useIonAlert()
  const userId = session!.user.id

  const toast = (message: string, color: 'success' | 'danger' = 'success') =>
    void presentToast({ message, duration: 2500, position: 'top', color })

  const load = useCallback(async () => {
    try {
      setSubs(await mySubscriptions())
    } catch (e) {
      toast((e as Error).message, 'danger')
      setSubs([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Nach dem Bestätigungs-Link: das vorgemerkte Abo abschliessen
  useEffect(() => {
    const pending = takePending()
    window.history.replaceState(null, '', `${base}abos`)
    void (async () => {
      if (pending) {
        try {
          await subscribeTrip(pending.token, pending.frequency)
          toast('E-Mail-Adresse bestätigt – dein Abo ist aktiv.')
        } catch (e) {
          toast((e as Error).message, 'danger')
        }
      }
      await load()
    })()
    void supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => setName(data?.display_name ?? ''))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const change = async (s: MySubscription, patch: Partial<{ frequency: Frequency; status: 'active' | 'paused' }>) => {
    setSubs((list) => list?.map((x) => (x.id === s.id ? { ...x, ...patch } : x)) ?? null)
    try {
      await updateSubscription(s.id, patch)
    } catch (e) {
      toast((e as Error).message, 'danger')
      void load()
    }
  }

  const cancel = (s: MySubscription) =>
    presentAlert({
      header: 'Abo beenden?',
      message: `Du bekommst keine E-Mails mehr zu «${s.trip_title}».`,
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: 'Beenden',
          role: 'destructive',
          handler: () => {
            void deleteSubscription(s.id)
              .then(() => {
                setSubs((list) => list?.filter((x) => x.id !== s.id) ?? null)
                toast('Abo beendet')
              })
              .catch((e: Error) => toast(e.message, 'danger'))
          },
        },
      ],
    })

  const saveName = async () => {
    const { error } = await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', userId)
    toast(error ? 'Name konnte nicht gespeichert werden.' : 'Name gespeichert', error ? 'danger' : 'success')
  }

  const active = (subs ?? []).filter((s) => s.status !== 'unsubscribed')

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton href={`${base}feed`}>
              <IonIcon slot="start" icon={chevronBack} />
              App
            </IonButton>
          </IonButtons>
          <IonTitle>Meine Abos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent color="light">
        <CamperRefresher onRefresh={load} />
        {subs === null ? (
          <PageSpinner />
        ) : (
          <>
            {active.length === 0 && (
              <IonCard>
                <IonCardContent>
                  Du hast noch keine Reise abonniert. Öffne den Reise-Link, den du bekommen hast, und tippe unten auf
                  «Updates per E-Mail».
                </IonCardContent>
              </IonCard>
            )}
            {active.map((s) => (
              <IonCard key={s.id}>
                <IonCardHeader>
                  <IonCardSubtitle>
                    <IonIcon icon={mailOutline} /> Newsletter
                  </IonCardSubtitle>
                  <IonCardTitle>{s.trip_title}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonSegment
                    value={s.frequency}
                    disabled={s.status === 'paused'}
                    onIonChange={(e) => void change(s, { frequency: e.detail.value as Frequency })}
                  >
                    {(Object.keys(FREQUENCY_LABEL) as Frequency[]).map((f) => (
                      <IonSegmentButton key={f} value={f}>
                        <IonLabel>{FREQUENCY_LABEL[f]}</IonLabel>
                      </IonSegmentButton>
                    ))}
                  </IonSegment>
                  <IonList lines="none" className="ion-margin-top">
                    <IonItem>
                      <IonToggle
                        checked={s.status === 'paused'}
                        onIonChange={(e) => void change(s, { status: e.detail.checked ? 'paused' : 'active' })}
                      >
                        Pausieren
                      </IonToggle>
                    </IonItem>
                  </IonList>
                  <div className="ion-margin-top" style={{ display: 'flex', gap: 8 }}>
                    {s.token && (
                      <IonButton fill="outline" href={`${base}t/${s.token}`}>
                        Reise lesen
                      </IonButton>
                    )}
                    <IonButton fill="clear" color="danger" onClick={() => void cancel(s)}>
                      Abo beenden
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}

            <IonList inset>
              <IonListHeader>
                <IonLabel>Dein Konto</IonLabel>
              </IonListHeader>
              <IonItem>
                <IonInput
                  label="Name"
                  placeholder="So sehen dich die Reisenden"
                  value={name}
                  onIonInput={(e) => setName(String(e.detail.value ?? ''))}
                  onIonBlur={() => void saveName()}
                />
              </IonItem>
              <IonItem>
                <IonLabel>E-Mail</IonLabel>
                <IonNote slot="end">{session?.user.email}</IonNote>
              </IonItem>
              <IonItem button detail={false} onClick={() => void signOut()}>
                <IonLabel color="danger">Abmelden</IonLabel>
              </IonItem>
            </IonList>
            <IonNote className="list-footnote">
              Die Reisenden sehen deinen Namen, deine E-Mail-Adresse und wie oft du Updates bekommst.
            </IonNote>
          </>
        )}
      </IonContent>
    </IonPage>
  )
}

export default SubscriptionsPage
