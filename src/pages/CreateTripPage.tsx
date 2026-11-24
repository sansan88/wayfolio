import { IonButton, IonContent, IonInput, IonItem, IonLabel, IonList, IonPage, IonSpinner, IonText } from '@ionic/react'
import { useEffect, useState, type FormEvent } from 'react'

import { useAuth } from '../lib/auth'
import { mySubscriptions } from '../lib/subscriptions'
import { useTrip } from '../lib/trip'
import './LoginPage.css'

const CreateTripPage = () => {
  const { createTrip } = useTrip()
  const { signOut } = useAuth()
  const [title, setTitle] = useState('')
  const [startsOn, setStartsOn] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Community-Mitglieder mit Abos: Weg zu «Meine Abos»
  const [subCount, setSubCount] = useState(0)
  useEffect(() => {
    void mySubscriptions()
      .then((s) => setSubCount(s.filter((x) => x.status !== 'unsubscribed').length))
      .catch(() => undefined)
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await createTrip(title.trim(), startsOn || null)
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  return (
    <IonPage>
      <IonContent color="light">
        <div className="login">
          {subCount > 0 && (
            <IonButton expand="block" fill="outline" href={`${import.meta.env.BASE_URL}abos`} className="ion-margin-bottom">
              Meine Abos ({subCount})
            </IonButton>
          )}
          <h1>Eure erste Reise</h1>
          <p className="login__claim">Gib ihr einen Namen – den sehen später auch eure Follower.</p>
          <form onSubmit={submit}>
            <IonList inset className="login__list">
              <IonItem>
                <IonInput
                  aria-label="Name der Reise"
                  placeholder="Name, z.B. Vietnam mit dem Camper"
                  required
                  value={title}
                  onIonInput={(e) => setTitle(String(e.detail.value ?? ''))}
                />
              </IonItem>
              <IonItem>
                <IonLabel>Start</IonLabel>
                <input
                  slot="end"
                  type="date"
                  className="login__date"
                  value={startsOn}
                  onChange={(e) => setStartsOn(e.target.value)}
                />
              </IonItem>
            </IonList>
            <IonButton type="submit" expand="block" className="ion-margin-top" disabled={saving || !title.trim()}>
              {saving ? <IonSpinner name="dots" /> : 'Reise anlegen'}
            </IonButton>
            {error && (
              <IonText color="danger">
                <p>{error}</p>
              </IonText>
            )}
          </form>
          <IonButton fill="clear" size="small" onClick={signOut}>
            Abmelden
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default CreateTripPage
