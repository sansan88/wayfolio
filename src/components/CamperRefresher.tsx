import { IonRefresher, type RefresherEventDetail } from '@ionic/react'

import { CamperScene } from './PageSpinner'
import './PageSpinner.css'

/** Ziehen zum Aktualisieren – mit dem Camper statt des Standard-Spinners. */
const CamperRefresher = ({ onRefresh }: { onRefresh: () => Promise<unknown> }) => (
  <IonRefresher
    slot="fixed"
    className="camper-refresher"
    onIonRefresh={(e: CustomEvent<RefresherEventDetail>) => void onRefresh().finally(() => e.detail.complete())}
  >
    <div className="camper-refresher__content" role="status" aria-label="Wird aktualisiert">
      <CamperScene width={112} />
    </div>
  </IonRefresher>
)

export default CamperRefresher
