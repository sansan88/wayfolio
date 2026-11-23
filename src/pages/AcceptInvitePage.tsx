import { IonButton, IonContent, IonPage, IonSpinner, IonText } from '@ionic/react'
import { useEffect, useState } from 'react'

import { acceptInvite } from '../lib/members'
import { rememberTrip } from '../lib/trip'
import './LoginPage.css'

/** Nimmt einen Einladungslink an und öffnet danach die gemeinsame Reise. */
const AcceptInvitePage = ({ token }: { token: string }) => {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    acceptInvite(token)
      .then((tripId) => {
        rememberTrip(tripId)
        window.location.replace(import.meta.env.BASE_URL)
      })
      .catch((e: Error) => setError(e.message))
  }, [token])

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="login">
          <h1>Einladung</h1>
          {error ? (
            <>
              <IonText color="danger">
                <p>{error}</p>
              </IonText>
              <p>Bitte um einen neuen Einladungslink.</p>
              <IonButton fill="outline" onClick={() => window.location.replace(import.meta.env.BASE_URL)}>
                Zu Little Footnotes
              </IonButton>
            </>
          ) : (
            <p>
              <IonSpinner name="dots" /> Du wirst zur Reise hinzugefügt …
            </p>
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}

export default AcceptInvitePage
