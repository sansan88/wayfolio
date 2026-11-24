import { IonButton, IonIcon, IonInput, IonItem, IonLabel, IonList, IonListHeader, IonNote } from '@ionic/react'
import { addCircle, linkOutline, removeCircle } from 'ionicons/icons'

import { normalizeUrl } from '../lib/links'

interface Props {
  links: string[]
  onChange: (links: string[]) => void
}

/** Ein oder mehrere Links (Unterkunft, Museum, Google-Maps-Ort …) für Check-ins und Beiträge. */
const LinksEditor = ({ links, onChange }: Props) => {
  const rows = links.length ? links : []
  const invalid = (v: string) => v.trim().length > 0 && !normalizeUrl(v)

  return (
    <>
      <IonList inset>
        <IonListHeader>
          <IonLabel>Links</IonLabel>
        </IonListHeader>
        {rows.map((l, i) => (
          <IonItem key={i}>
            <IonIcon slot="start" icon={linkOutline} color={invalid(l) ? 'danger' : 'medium'} />
            <IonInput
              aria-label={`Link ${i + 1}`}
              type="url"
              inputmode="url"
              autocapitalize="off"
              placeholder="z. B. Airbnb, Museum, Google Maps, Instagram"
              value={l}
              onIonInput={(e) => onChange(links.map((x, j) => (j === i ? String(e.detail.value ?? '') : x)))}
            />
            <IonButton
              slot="end"
              fill="clear"
              color="danger"
              aria-label={`Link ${i + 1} entfernen`}
              onClick={() => onChange(links.filter((_, j) => j !== i))}
            >
              <IonIcon slot="icon-only" icon={removeCircle} />
            </IonButton>
          </IonItem>
        ))}
        {rows.length < 8 && (
          <IonItem button detail={false} onClick={() => onChange([...links, ''])}>
            <IonIcon slot="start" icon={addCircle} color="primary" />
            <IonLabel color="primary">{rows.length ? 'Weiteren Link hinzufügen' : 'Link hinzufügen'}</IonLabel>
          </IonItem>
        )}
      </IonList>
      {rows.some(invalid) && <IonNote className="compose__note checkin__error">Ein Link ist keine gültige Web-Adresse.</IonNote>}
    </>
  )
}

export default LinksEditor
