import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonInput, IonNote, IonSegment, IonSegmentButton, IonLabel } from '@ionic/react'
import { useEffect, useState } from 'react'

import { appUrl } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { FREQUENCY_LABEL, mySubscriptions, requestSubscription, subscribeTrip, type Frequency, type MySubscription } from '../lib/subscriptions'

/**
 * Newsletter für die Community: mit einem eigenen Konto (E-Mail-Adresse wird per Link bestätigt).
 * Angemeldete abonnieren direkt; die Einstellungen liegen unter «Meine Abos».
 */
const NewsletterCard = ({ token, toast }: { token: string; toast: (m: string, c?: 'success' | 'danger' | 'medium') => void }) => {
  const [email, setEmail] = useState('')
  const [signedInAs, setSignedInAs] = useState<string | null>(null)
  const [frequency, setFrequency] = useState<Frequency>('weekly')
  const [mine, setMine] = useState<MySubscription | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const refresh = async () => {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user ?? null
      setSignedInAs(user?.email ?? null)
      if (!user) return setMine(null)
      try {
        const subs = await mySubscriptions()
        setMine(subs.find((s) => s.token === token && s.status !== 'unsubscribed') ?? null)
      } catch {
        setMine(null)
      }
    }
    void refresh()
    const { data } = supabase.auth.onAuthStateChange(() => void refresh())
    return () => data.subscription.unsubscribe()
  }, [token])

  const manage = `${appUrl()}abos`

  const subscribe = async () => {
    setBusy(true)
    try {
      if (signedInAs) {
        await subscribeTrip(token, frequency)
        const subs = await mySubscriptions()
        setMine(subs.find((s) => s.token === token) ?? null)
        toast('Abonniert – du bekommst die Updates per E-Mail.')
      } else {
        await requestSubscription(email, token, frequency)
        setSent(true)
      }
    } catch (e) {
      toast((e as Error).message, 'danger')
    } finally {
      setBusy(false)
    }
  }

  return (
    <IonCard className="newsletter">
      <IonCardHeader>
        <IonCardTitle>Updates per E-Mail</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {mine ? (
          <>
            <p>
              Du hast diese Reise abonniert: {mine.frequency === 'instant' ? 'bei jedem Beitrag' : 'wöchentlich'}
              {mine.status === 'paused' && ' (pausiert)'}.
            </p>
            <IonButton className="ion-margin-top" fill="outline" expand="block" href={manage}>
              Meine Abos verwalten
            </IonButton>
          </>
        ) : sent ? (
          <p>
            Fast geschafft: Wir haben dir eine E-Mail an <strong>{email}</strong> geschickt. Tippe auf den Link darin, um
            deine Adresse zu bestätigen – danach ist das Abo aktiv.
          </p>
        ) : (
          <>
            <IonSegment value={frequency} onIonChange={(e) => setFrequency(e.detail.value as Frequency)}>
              {(Object.keys(FREQUENCY_LABEL) as Frequency[]).map((f) => (
                <IonSegmentButton key={f} value={f}>
                  <IonLabel>{FREQUENCY_LABEL[f]}</IonLabel>
                </IonSegmentButton>
              ))}
            </IonSegment>
            {signedInAs ? (
              <IonNote className="newsletter__as">Angemeldet als {signedInAs}</IonNote>
            ) : (
              <IonInput
                className="ion-margin-top newsletter__email"
                type="email"
                inputmode="email"
                autocomplete="email"
                fill="outline"
                label="E-Mail"
                labelPlacement="floating"
                value={email}
                onIonInput={(e) => setEmail(String(e.detail.value ?? ''))}
              />
            )}
            <IonButton
              className="ion-margin-top"
              expand="block"
              disabled={busy || (!signedInAs && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))}
              onClick={() => void subscribe()}
            >
              {signedInAs ? 'Abonnieren' : 'Abonnieren und bestätigen'}
            </IonButton>
            <IonNote>
              {signedInAs
                ? 'Jederzeit änderbar unter «Meine Abos».'
                : 'Du bekommst ein kleines Konto: Nach der Bestätigung per Link kannst du Häufigkeit und Abos selbst verwalten – auch für mehrere Reisen.'}
            </IonNote>
          </>
        )}
      </IonCardContent>
    </IonCard>
  )
}

export default NewsletterCard
