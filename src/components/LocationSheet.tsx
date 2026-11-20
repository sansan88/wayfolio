import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonModal, IonNote, IonTitle, IonToolbar } from '@ionic/react'
import { chevronBack, chevronForward } from 'ionicons/icons'

import { distanceKm } from '../lib/geo'
import type { RoutePoint } from '../lib/route'
import type { FeedPost } from '../lib/updates'
import PostCard, { dayNumber } from './PostCard'
import './LocationSheet.css'

interface Props {
  point: RoutePoint | null
  points: RoutePoint[]
  posts: FeedPost[]
  /** Reisebeginn für «Tag N» */
  start: string | null | undefined
  mode: 'owner' | 'follower'
  onClose: () => void
  onNavigate: (point: RoutePoint) => void
}

/** Details zu einem Ort auf der Karte: Datum, Strecke, Fotos und alle Updates von dort (iOS-Sheet). */
const LocationSheet = ({ point, points, posts, start, mode, onClose, onNavigate }: Props) => {
  const index = point ? points.findIndex((p) => p.id === point.id) : -1
  const prev = index > 0 ? points[index - 1] : null
  const next = index >= 0 && index < points.length - 1 ? points[index + 1] : null
  const here = point ? posts.filter((p) => p.checkin_id === point.id).sort((a, b) => a.published_at.localeCompare(b.published_at)) : []
  const photos = here.flatMap((p) => p.blocks.filter((b) => b.kind === 'photo' && b.mediaUrl && !b.route).map((b) => b.mediaUrl!))
  const day = point ? dayNumber(point.recorded_at, start ?? points[0]?.recorded_at) : null
  const leg = point && prev ? Math.round(distanceKm(prev, point)) : null
  const name = point?.place_name?.split(',')[0] ?? 'Standort'
  const country = point?.place_name?.split(',').slice(1).join(',').trim()

  return (
    <IonModal
      isOpen={point !== null}
      onDidDismiss={onClose}
      initialBreakpoint={0.45}
      breakpoints={[0, 0.45, 0.92]}
      backdropBreakpoint={0.45}
      handleBehavior="cycle"
      className="location-sheet"
    >
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton disabled={!prev} onClick={() => prev && onNavigate(prev)} aria-label="Vorheriger Ort">
              <IonIcon slot="icon-only" icon={chevronBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>{name}</IonTitle>
          <IonButtons slot="end">
            <IonButton disabled={!next} onClick={() => next && onNavigate(next)} aria-label="Nächster Ort">
              <IonIcon slot="icon-only" icon={chevronForward} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent color="light">
        {point && (
          <>
            <div className="loc__facts">
              {day && <span className="loc__day">Tag {day}</span>}
              <span>
                {new Date(point.recorded_at).toLocaleString('de-CH', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {country && <span>{country}</span>}
              {leg !== null && (
                <span>
                  {leg} km seit {prev?.place_name?.split(',')[0] ?? 'dem letzten Ort'}
                </span>
              )}
              <span>
                Ort {index + 1} von {points.length}
              </span>
            </div>

            {photos.length > 0 && (
              <div className="loc__photos">
                {photos.map((url) => (
                  <img key={url} src={url} alt="" loading="lazy" />
                ))}
              </div>
            )}

            {here.length === 0 ? (
              <IonNote className="list-footnote">Zu diesem Ort gibt es noch keine Beiträge.</IonNote>
            ) : (
              here.map((p) => <PostCard key={p.id} post={p} mode={mode} day={dayNumber(p.published_at, start ?? points[0]?.recorded_at)} />)
            )}
          </>
        )}
      </IonContent>
    </IonModal>
  )
}

export default LocationSheet
