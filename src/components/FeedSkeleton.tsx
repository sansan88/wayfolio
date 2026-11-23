import { IonCard, IonCardContent, IonCardHeader, IonSkeletonText } from '@ionic/react'

/** Platzhalter-Karten, solange die Beiträge laden (gleiche Form wie die echten Karten). */
const FeedSkeleton = ({ count = 2 }: { count?: number }) => (
  <div aria-busy="true" aria-label="Beiträge werden geladen">
    {Array.from({ length: count }, (_, i) => (
      <IonCard key={i} className="post skeleton-card">
        <IonSkeletonText animated className="skeleton-card__media" />
        <IonCardHeader>
          <IonSkeletonText animated style={{ width: '60%', height: 24 }} />
          <IonSkeletonText animated style={{ width: '40%', height: 14 }} />
          <IonSkeletonText animated style={{ width: '55%', height: 12 }} />
        </IonCardHeader>
        <IonCardContent>
          <IonSkeletonText animated style={{ width: '95%' }} />
          <IonSkeletonText animated style={{ width: '80%' }} />
        </IonCardContent>
      </IonCard>
    ))}
  </div>
)

export default FeedSkeleton
