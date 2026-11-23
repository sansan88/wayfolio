import { IonIcon } from '@ionic/react'
import { refreshOutline } from 'ionicons/icons'

import { usePwaUpdate } from '../lib/pwaUpdate'

/** «Neue Version verfügbar» – ein Tipp lädt die App neu. */
const UpdateBanner = () => {
  const { needRefresh, applyUpdate } = usePwaUpdate()
  if (!needRefresh) return null
  return (
    <button type="button" className="update-pill" onClick={() => void applyUpdate()}>
      <IonIcon icon={refreshOutline} aria-hidden="true" /> Neue Version verfügbar · <strong>Aktualisieren</strong>
    </button>
  )
}

export default UpdateBanner
