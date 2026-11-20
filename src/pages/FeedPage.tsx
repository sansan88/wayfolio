import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react'

import './FeedPage.css'

const placeholderStories = ['Heute', 'Hoi An', 'Hué', 'Essen', 'Auto']

const FeedPage = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Feed</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div className="stories" aria-label="Stories">
        {placeholderStories.map((name) => (
          <div key={name} className="story">
            <div className="story__ring">
              <div className="story__image" />
            </div>
            <span className="story__label">{name}</span>
          </div>
        ))}
      </div>

      <IonCard>
        <IonCardHeader>
          <IonCardSubtitle>Noch keine Beiträge</IonCardSubtitle>
          <IonCardTitle>Eure Reise beginnt hier</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          Beiträge, Hintergrund-Stories, Abstimmungen und Routenbilder erscheinen in diesem Feed.
        </IonCardContent>
      </IonCard>
    </IonContent>
  </IonPage>
)

export default FeedPage
