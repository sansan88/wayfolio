import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { addCircle, map, newspaper } from 'ionicons/icons'
import { Navigate, Route } from 'react-router-dom'

import CapturePage from './pages/CapturePage'
import FeedPage from './pages/FeedPage'
import MapPage from './pages/MapPage'

const App = () => (
  <IonApp>
    <IonReactRouter>
      <IonTabs>
        <IonRouterOutlet>
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/karte" element={<MapPage />} />
          <Route path="/erfassen" element={<CapturePage />} />
          <Route path="/" element={<Navigate to="/erfassen" replace />} />
        </IonRouterOutlet>

        <IonTabBar slot="bottom">
          <IonTabButton tab="feed" href="/feed">
            <IonIcon aria-hidden="true" icon={newspaper} />
            <IonLabel>Feed</IonLabel>
          </IonTabButton>
          <IonTabButton tab="erfassen" href="/erfassen">
            <IonIcon aria-hidden="true" icon={addCircle} />
            <IonLabel>Erfassen</IonLabel>
          </IonTabButton>
          <IonTabButton tab="karte" href="/karte">
            <IonIcon aria-hidden="true" icon={map} />
            <IonLabel>Karte</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonReactRouter>
  </IonApp>
)

export default App
