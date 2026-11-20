import { IonButtons, IonHeader, IonTitle, IonToolbar } from '@ionic/react'
import type { ReactNode } from 'react'

/**
 * iOS-Kopfzeile: durchscheinende Toolbar, deren kleiner Titel erst erscheint,
 * wenn der grosse Titel (LargeTitle) aus dem Bild scrollt.
 * Die Seite braucht dafür <IonContent fullscreen>.
 */
export const PageHeader = ({ title, start, end }: { title: string; start?: ReactNode; end?: ReactNode }) => (
  <IonHeader translucent>
    <IonToolbar>
      {start && <IonButtons slot="start">{start}</IonButtons>}
      <IonTitle>{title}</IonTitle>
      {end && <IonButtons slot="end">{end}</IonButtons>}
    </IonToolbar>
  </IonHeader>
)

/** Grosser Titel am Anfang des Inhalts (iOS «Large Title»). */
export const LargeTitle = ({ title }: { title: string }) => (
  <IonHeader collapse="condense">
    <IonToolbar>
      <IonTitle size="large">{title}</IonTitle>
    </IonToolbar>
  </IonHeader>
)
