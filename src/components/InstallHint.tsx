import { IonButton, IonIcon } from '@ionic/react'
import { addCircleOutline } from 'ionicons/icons'
import { useState } from 'react'

import { installHelp, useInstall } from '../lib/pwa'

const DISMISS_KEY = 'wayfolio-install-dismissed'

/** Karte «Auf den Home-Bildschirm» – verschwindet, sobald Little Footnotes installiert ist. */
const InstallHint = ({ who = 'traveler' }: { who?: 'traveler' | 'follower' }) => {
  const { mode, install } = useInstall()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })
  if (mode === 'installed' || dismissed) return null
  return (
    <div className="geo-banner install-hint">
      <IonIcon icon={addCircleOutline} className="geo-banner__icon" aria-hidden="true" />
      <div className="geo-banner__body">
        <strong>Little Footnotes auf den Home-Bildschirm</strong>
        <p>
          {who === 'follower' ? 'So seid ihr mit einem Tipp bei der Reise – auch ohne Netz sind die letzten Beiträge da. ' : 'Startet wie eine App und funktioniert auch offline. '}
          {mode !== 'prompt' && installHelp()}
        </p>
        <div className="geo-banner__actions">
          {mode === 'prompt' && (
            <IonButton size="small" onClick={() => void install()}>
              Installieren
            </IonButton>
          )}
          <IonButton
            size="small"
            fill="clear"
            onClick={() => {
              try {
                localStorage.setItem(DISMISS_KEY, '1')
              } catch {
                /* egal */
              }
              setDismissed(true)
            }}
          >
            Ausblenden
          </IonButton>
        </div>
      </div>
    </div>
  )
}

export default InstallHint
