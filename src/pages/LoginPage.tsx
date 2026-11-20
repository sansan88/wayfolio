import {
  IonButton,
  IonContent,
  IonInput,
  IonNote,
  IonPage,
  IonSpinner,
  IonText,
} from '@ionic/react'
import { useState, type FormEvent } from 'react'

import { appUrl } from '../lib/auth'
import { supabase } from '../lib/supabase'
import './LoginPage.css'

const LoginPage = ({ invite = false }: { invite?: boolean }) => {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSending(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      // Bei Einladungen zurück auf den Einladungslink, sonst an den Anfang der App
      options: { emailRedirectTo: invite ? window.location.href : appUrl() },
    })
    setSending(false)
    if (err) setError(err.message)
    else setSent(true)
  }

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="login">
          <a className="login__back" href={import.meta.env.BASE_URL}>
            ← Wayfolio
          </a>
          <h1>{invite ? 'Du bist eingeladen' : 'Anmelden'}</h1>
          <p className="login__claim">
            {invite
              ? 'Melde dich mit deiner E-Mail an, um bei der Reise mitzuschreiben.'
              : 'Nehmt eure Liebsten mit auf die Reise.'}
          </p>

          {sent ? (
            <IonText>
              <h2>Schau in dein Postfach</h2>
              <p>
                Wir haben einen Anmeldelink an <strong>{email}</strong> geschickt. Öffne ihn auf diesem Gerät.
              </p>
              <IonButton fill="clear" onClick={() => setSent(false)}>
                Andere E-Mail verwenden
              </IonButton>
            </IonText>
          ) : (
            <form onSubmit={submit}>
              <IonInput
                type="email"
                label="E-Mail"
                labelPlacement="floating"
                fill="outline"
                autocomplete="email"
                required
                value={email}
                onIonInput={(e) => setEmail(String(e.detail.value ?? ''))}
              />
              <IonButton type="submit" expand="block" disabled={sending || !email} className="ion-margin-top">
                {sending ? <IonSpinner name="dots" /> : 'Anmeldelink senden'}
              </IonButton>
              <IonNote>
                Kein Passwort nötig – du bekommst einen Link per E-Mail. Mit der Anmeldung gilt die{' '}
                <a href={`${import.meta.env.BASE_URL}datenschutz`}>Datenschutzerklärung</a>.
              </IonNote>
              {error && (
                <IonText color="danger">
                  <p>{error}</p>
                </IonText>
              )}
            </form>
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}

export default LoginPage
