import { IonButton, IonIcon } from '@ionic/react'
import { locationOutline } from 'ionicons/icons'
import { useState } from 'react'

import { geoDeniedHelp, useGeoPermission } from '../lib/geoPermission'

const DISMISS_KEY = 'wayfolio-geo-banner-dismissed'

/** Einmaliger Hinweis im Feed: Standort freigeben, damit der Browser die Erlaubnis speichert. */
const GeoPermissionBanner = () => {
  const { state, request } = useGeoPermission()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === state
    } catch {
      return false
    }
  })
  const [busy, setBusy] = useState(false)

  if (state === 'granted' || dismissed) return null
  if (state !== 'prompt' && state !== 'denied' && state !== 'unknown') return null

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, state)
    } catch {
      /* egal */
    }
    setDismissed(true)
  }

  return (
    <div className="geo-banner" role="region" aria-label="Standort-Freigabe">
      <IonIcon icon={locationOutline} className="geo-banner__icon" aria-hidden="true" />
      <div className="geo-banner__body">
        {state === 'denied' ? (
          <>
            <strong>Standortzugriff ist gesperrt</strong>
            <p>{geoDeniedHelp()}</p>
          </>
        ) : (
          <>
            <strong>Standort freigeben</strong>
            <p>Damit Wayfolio Orte und Route automatisch setzt. Euer Browser merkt sich die Freigabe für diese Seite.</p>
          </>
        )}
        <div className="geo-banner__actions">
          {state !== 'denied' && (
            <IonButton
              size="small"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                await request()
                setBusy(false)
              }}
            >
              {busy ? 'Wird abgefragt …' : 'Freigeben'}
            </IonButton>
          )}
          <IonButton size="small" fill="clear" onClick={dismiss}>
            {state === 'denied' ? 'Ausblenden' : 'Später'}
          </IonButton>
        </div>
      </div>
    </div>
  )
}

export default GeoPermissionBanner
