import {
  IonContent,
  IonHeader,
  IonIcon,
  IonNote,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import {
  barChart,
  bookOutline,
  camera,
  create,
  locate,
  mic,
  videocam,
} from 'ionicons/icons'

import './CapturePage.css'

/** Wohin ein Update gemäss Konzept-Grundregel landet. */
type Target = 'Feed' | 'Story' | 'Feed + Story' | 'Feed · Routenbild'

interface Action {
  id: string
  label: string
  icon: string
  target: Target
}

const singleActions: Action[] = [
  { id: 'photo', label: 'Foto', icon: camera, target: 'Story' },
  { id: 'location', label: 'Standort', icon: locate, target: 'Feed · Routenbild' },
  { id: 'decision', label: 'Entscheidung', icon: barChart, target: 'Feed + Story' },
  { id: 'background', label: 'Hintergrund', icon: bookOutline, target: 'Feed + Story' },
  { id: 'voice', label: 'Sprachnachricht', icon: mic, target: 'Story' },
  { id: 'video', label: 'Video-Update', icon: videocam, target: 'Story' },
]

const CapturePage = () => {
  const handleAction = (id: string) => {
    // TODO: Erfassungs-Flows je Aktion (Phase 1)
    console.info('Aktion gewählt:', id)
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Erfassen</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="location">
          <IonText>
            <strong>Standort wird ermittelt …</strong>
          </IonText>
          <IonNote>Tippen zum Korrigieren</IonNote>
        </div>

        <button type="button" className="tile tile--wide" onClick={() => handleAction('post')}>
          <IonIcon icon={create} aria-hidden="true" />
          <span className="tile__text">
            <span className="tile__label">Beitrag schreiben</span>
            <span className="tile__target">→ Feed · Text mit allen Medien</span>
          </span>
        </button>

        <div className="grid">
          {singleActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="tile"
              onClick={() => handleAction(action.id)}
            >
              <IonIcon icon={action.icon} aria-hidden="true" />
              <span className="tile__label">{action.label}</span>
              <span className="tile__target">→ {action.target}</span>
            </button>
          ))}
        </div>
      </IonContent>
    </IonPage>
  )
}

export default CapturePage
