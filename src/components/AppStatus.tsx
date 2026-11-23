import { IonIcon } from '@ionic/react'
import { cloudOfflineOutline } from 'ionicons/icons'

import { useOnline } from '../lib/offline'

/** Hinweis, solange keine Verbindung besteht (Inhalte kommen dann aus dem Speicher). */
const AppStatus = () => {
  const online = useOnline()
  if (online) return null
  return (
    <div className="offline-pill" role="status">
      <IonIcon icon={cloudOfflineOutline} aria-hidden="true" /> Offline – zuletzt geladene Inhalte
    </div>
  )
}

export default AppStatus
