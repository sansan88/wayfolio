import { IonSpinner } from '@ionic/react'

/** Ladeanzeige genau in der Mitte des sichtbaren Inhalts. */
const PageSpinner = () => (
  <div className="page-spinner" role="status" aria-label="Wird geladen">
    <IonSpinner name="crescent" />
  </div>
)

export default PageSpinner
