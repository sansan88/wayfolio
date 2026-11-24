import {
  IonBadge,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonToggle,
  useIonAlert,
  useIonToast,
  useIonViewWillEnter,
} from '@ionic/react'
import { addCircle, locationOutline, logOutOutline, phonePortraitOutline, mailOutline, refreshOutline, sparklesOutline } from 'ionicons/icons'
import { useState } from 'react'

import { LargeTitle, PageHeader } from '../components/PageHeader'
import TripEditorModal from '../components/TripEditorModal'
import { useAiConsent } from '../lib/aiConsent'
import { useAuth } from '../lib/auth'
import { geoDeniedHelp, useGeoPermission } from '../lib/geoPermission'
import { installHelp, useInstall } from '../lib/pwa'
import { APP_BUILD, usePwaUpdate } from '../lib/pwaUpdate'
import { loadOwnName, saveOwnName } from '../lib/members'
import { useTrip, type Trip } from '../lib/trip'

const formatRange = (t: Trip) => {
  const f = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' })
  if (!t.starts_on) return null
  return t.ends_on ? `${f(t.starts_on)} – ${f(t.ends_on)}` : `seit ${f(t.starts_on)}`
}

/** Tab «Reisen»: alle Reisen (je mit Details und Mitreisenden) und das eigene Profil. */
const TripSettingsPage = () => {
  const { session, signOut } = useAuth()
  const ai = useAiConsent()
  const userId = session!.user.id
  const { trip: current, trips, createTrip } = useTrip()
  const [presentToast] = useIonToast()
  const [presentAlert] = useIonAlert()
  const [editing, setEditing] = useState<Trip | null>(null)
  const [myName, setMyName] = useState('')
  const geo = useGeoPermission()
  const app = useInstall()
  const update = usePwaUpdate()
  const [checking, setChecking] = useState(false)

  const toast = (message: string, color: 'success' | 'danger' = 'success') =>
    presentToast({ message, duration: 2500, position: 'top', color })

  useIonViewWillEnter(() => {
    void loadOwnName(userId).then(setMyName)
  }, [userId])

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
              .then(() => toast('Neue Reise angelegt und geöffnet'))
              .catch((e: Error) => toast(e.message, 'danger'))
          },
        },
      ],
    })

  return (
    <IonPage>
      <PageHeader title="Reisen" />
      <IonContent fullscreen color="light">
        <LargeTitle title="Reisen" />

        <IonList inset>
          {trips.map((t) => (
            <IonItem key={t.id} button detail onClick={() => setEditing(t)}>
              <IonLabel>
                <h2>{t.title}</h2>
                <p>
                  {[formatRange(t), t.owner_id !== userId ? 'als Mitreisende' : null].filter(Boolean).join(' · ') ||
                    'Details, Mitreisende'}
                </p>
              </IonLabel>
              {t.id === current?.id && (
                <IonBadge slot="end" color="primary">
                  Aktuell
                </IonBadge>
              )}
            </IonItem>
          ))}
          <IonItem button detail={false} onClick={() => void newTrip()}>
            <IonIcon slot="start" icon={addCircle} color="success" />
            <IonLabel>Neue Reise anlegen</IonLabel>
          </IonItem>
        </IonList>
        <IonNote className="list-footnote">
          Tippe auf eine Reise, um Details, Standort-Verzögerung und Mitreisende dieser Reise zu bearbeiten.
        </IonNote>

        <IonList inset>
          <IonListHeader>
            <IonLabel>Dein Profil</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonInput
              label="Dein Name"
              className="ion-text-end"
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
          <IonItem>
            <IonLabel>E-Mail</IonLabel>
            <IonNote slot="end">{session?.user.email}</IonNote>
          </IonItem>
          <IonItem button href={`${import.meta.env.BASE_URL}abos`} detail>
            <IonIcon slot="start" icon={mailOutline} color="primary" />
            <IonLabel>Meine Abos</IonLabel>
          </IonItem>
          <IonItem>
            <IonIcon slot="start" icon={sparklesOutline} color="primary" />
            <IonToggle
              checked={!!ai.enabled}
              onIonChange={async (e) => {
                const on = e.detail.checked
                try {
                  if (on) {
                    // Einschalten nur mit bestätigtem Hinweis
                    if (!(await ai.ensure())) e.target.checked = false
                    else toast('KI-Funktionen aktiviert')
                  } else {
                    await ai.disable()
                    toast('KI-Funktionen ausgeschaltet')
                  }
                } catch (err) {
                  e.target.checked = !on
                  toast((err as Error).message, 'danger')
                }
              }}
            >
              KI-Funktionen (Claude)
            </IonToggle>
          </IonItem>
        </IonList>
        <IonNote className="list-footnote">
          Dein Name steht an deinen Beiträgen. Mit den KI-Funktionen schreibt und überarbeitet Claude Beiträge; dafür gehen
          Text, Ort, Datum und Fotos an Anthropic.
        </IonNote>

        <IonList inset>
          <IonListHeader>
            <IonLabel>Berechtigungen</IonLabel>
          </IonListHeader>
          <IonItem
            button
            detail={geo.state !== 'granted'}
            onClick={async () => {
              if (geo.state === 'granted') return toast('Standort ist freigegeben')
              if (geo.state === 'denied')
                return presentAlert({ header: 'Standortzugriff gesperrt', message: geoDeniedHelp(), buttons: ['OK'] })
              const s = await geo.request()
              if (s === 'granted') toast('Standort freigegeben – der Browser merkt sich das')
              else if (s === 'denied') presentAlert({ header: 'Standortzugriff gesperrt', message: geoDeniedHelp(), buttons: ['OK'] })
            }}
          >
            <IonIcon slot="start" icon={locationOutline} color="primary" />
            <IonLabel>Standort</IonLabel>
            <IonNote slot="end" color={geo.state === 'granted' ? 'success' : geo.state === 'denied' ? 'danger' : 'medium'}>
              {geo.state === 'granted' ? 'Erlaubt' : geo.state === 'denied' ? 'Gesperrt' : 'Freigeben'}
            </IonNote>
          </IonItem>
        </IonList>
        <IonNote className="list-footnote">Für Standort-Updates und Fotos ohne Ortsdaten.</IonNote>

        <IonList inset>
          <IonItem
            button
            detail={app.mode !== 'installed'}
            onClick={async () => {
              if (app.mode === 'installed') return toast('Little Footnotes ist installiert')
              if (app.mode === 'prompt') return void (await app.install())
              presentAlert({ header: 'Auf den Home-Bildschirm', message: installHelp(), buttons: ['OK'] })
            }}
          >
            <IonIcon slot="start" icon={phonePortraitOutline} color="primary" />
            <IonLabel>Als App installieren</IonLabel>
            <IonNote slot="end" color={app.mode === 'installed' ? 'success' : 'medium'}>
              {app.mode === 'installed' ? 'Installiert' : 'Anleitung'}
            </IonNote>
          </IonItem>
        </IonList>
        <IonNote className="list-footnote">Startet vom Home-Bildschirm und zeigt die zuletzt geladenen Beiträge auch offline.</IonNote>

        <IonList inset>
          <IonItem
            button
            detail={false}
            disabled={checking}
            onClick={async () => {
              if (update.needRefresh) return void update.applyUpdate()
              setChecking(true)
              const found = await update.checkForUpdate()
              setChecking(false)
              if (found) void update.applyUpdate()
              else toast('Du hast die neueste Version')
            }}
          >
            <IonIcon slot="start" icon={refreshOutline} color="primary" />
            <IonLabel>{update.needRefresh ? 'Jetzt aktualisieren' : checking ? 'Suche nach Updates …' : 'Nach Updates suchen'}</IonLabel>
            <IonNote slot="end">{APP_BUILD}</IonNote>
          </IonItem>
        </IonList>

        <IonList inset>
          <IonItem button detail={false} onClick={signOut}>
            <IonIcon slot="start" icon={logOutOutline} color="danger" />
            <IonLabel color="danger">Abmelden</IonLabel>
          </IonItem>
        </IonList>

        <TripEditorModal trip={editing} onClose={() => setEditing(null)} />
      </IonContent>
    </IonPage>
  )
}

export default TripSettingsPage
