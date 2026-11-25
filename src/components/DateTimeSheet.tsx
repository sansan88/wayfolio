import { IonButton, IonButtons, IonContent, IonDatetime, IonHeader, IonModal, IonTitle, IonToolbar } from '@ionic/react'
import { useEffect, useState } from 'react'

import { toLocalIso } from '../lib/datetime'
import { useCardPresenter } from '../lib/modal'

interface Props {
  isOpen: boolean
  /** null = «Jetzt» */
  value: Date | null
  allowNow?: boolean
  /** «date» für reine Tagesauswahl (z.B. Reisebeginn) */
  presentation?: 'date-time' | 'date'
  title?: string
  min?: string
  /** Standard: jetzt (keine Zukunft); null = ohne Grenze */
  max?: string | null
  onClose: () => void
  onChange: (value: Date | null) => void
}

/** Minuten in 5er-Schritten: auf den letzten Schritt abrunden (nie in die Zukunft) */
const snap = (d: Date) => {
  const r = new Date(d)
  r.setMinutes(r.getMinutes() - (r.getMinutes() % 5), 0, 0)
  return r
}

/** iOS-Sheet mit Kalender und Uhrzeit, um ein Update rückzudatieren. */
const DateTimeSheet = ({ isOpen, value, allowNow = true, presentation = 'date-time', title, min, max, onClose, onChange }: Props) => {
  const presenter = useCardPresenter(isOpen)
  const [draft, setDraft] = useState(toLocalIso(snap(value ?? new Date())))

  useEffect(() => {
    if (isOpen) setDraft(toLocalIso(snap(value ?? new Date())))
  }, [isOpen, value])

  return (
    <IonModal isOpen={isOpen} presentingElement={presenter} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            {allowNow && (
              <IonButton
                onClick={() => {
                  onChange(null)
                  onClose()
                }}
              >
                Jetzt
              </IonButton>
            )}
          </IonButtons>
          <IonTitle>{title ?? (presentation === 'date' ? 'Datum' : 'Zeitpunkt')}</IonTitle>
          <IonButtons slot="end">
            <IonButton
              strong
              onClick={() => {
                onChange(new Date(draft))
                onClose()
              }}
            >
              Fertig
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" color="light">
        <IonDatetime
          presentation={presentation}
          locale="de-CH"
          firstDayOfWeek={1}
          min={min}
          max={max === null ? undefined : (max ?? toLocalIso(new Date()))}
          value={draft}
          minuteValues="0,5,10,15,20,25,30,35,40,45,50,55"
          preferWheel={false}
          onIonChange={(e) => typeof e.detail.value === 'string' && setDraft(e.detail.value)}
          style={{ margin: '0 auto', borderRadius: 12 }}
        >
          <span slot="time-label">Uhrzeit</span>
        </IonDatetime>
      </IonContent>
    </IonModal>
  )
}

export default DateTimeSheet
