import { IonButton, IonContent, IonInput, IonItem, IonLabel, IonList, IonPage, IonSpinner, IonText } from '@ionic/react'
import { useState, type FormEvent } from 'react'

import { useAuth } from '../lib/auth'
import { useTrip } from '../lib/trip'
import './LoginPage.css'

const CreateTripPage = () => {
  const { createTrip } = useTrip()
  const { signOut } = useAuth()
  const [title, setTitle] = useState('')
  const [startsOn, setStartsOn] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
