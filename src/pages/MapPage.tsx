import {
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react'

const MapPage = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Karte</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent className="ion-padding">
      <IonText color="medium">
        <p>Hier erscheinen Route und Pins (MapLibre mit MapTiler- oder Mapbox-Kacheln, folgt in Phase 1).</p>
      </IonText>
    </IonContent>
  </IonPage>
)

export default MapPage
