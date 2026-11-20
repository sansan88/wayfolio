import { IonButton, IonIcon, IonModal } from '@ionic/react'
import { barChart, bookOutline, close, mic, videocam } from 'ionicons/icons'
import { useState, type ReactNode } from 'react'

import type { FeedPost } from '../lib/updates'
import { formatTime, MediaBlocks } from './PostCard'
import '../pages/FeedPage.css'

const thumb = (post: FeedPost): ReactNode => {
  const photo = post.blocks.find((b) => b.kind === 'photo' && b.mediaUrl)
  if (photo) return <img className="story__image" src={photo.mediaUrl!} alt="" />
  const icon = post.kind === 'poll' ? barChart : post.kind === 'background' ? bookOutline : post.blocks.some((b) => b.kind === 'audio') ? mic : post.blocks.some((b) => b.kind === 'video') ? videocam : null
  return <div className="story__image story__image--icon">{icon && <IonIcon icon={icon} />}</div>
}

interface Props {
  stories: FeedPost[]
  /** Inhalt unter dem Medium in der Vollbild-Ansicht (z.B. Abstimmung, Hintergrundtext) */
  renderDetail?: (post: FeedPost) => ReactNode
}

/** Story-Kreise mit Vollbild-Ansicht. Ein Tipp auf die Story schaltet zur nächsten. */
const StoryBar = ({ stories, renderDetail }: Props) => {
  const [index, setIndex] = useState<number | null>(null)
  const open = index !== null ? stories[index] : null

  if (!stories.length) return null

  const next = () => setIndex((i) => (i !== null && i + 1 < stories.length ? i + 1 : null))

  return (
    <>
      <div className="stories" aria-label="Stories">
        {stories.map((story, i) => (
          <button key={story.id} type="button" className="story" onClick={() => setIndex(i)}>
            <div className="story__ring">{thumb(story)}</div>
            <span className="story__label">{(story.title ?? story.place_name ?? 'Story').split(',')[0]}</span>
          </button>
        ))}
      </div>

      <IonModal isOpen={open !== null} onDidDismiss={() => setIndex(null)} className="story-modal">
        {open && (
          <div className="story-view">
            <div className="story-view__stage" onClick={next}>
              <MediaBlocks post={open} />
              {!open.blocks.some((b) => b.mediaUrl) && <div className="story-view__title">{open.title}</div>}
            </div>
            <div className="story-view__meta">
              <strong>{open.title ?? open.place_name ?? 'Story'}</strong>
              <span>{formatTime(open.published_at)}</span>
            </div>
            <IonButton fill="clear" color="light" className="story-view__close" aria-label="Schliessen" onClick={() => setIndex(null)}>
              <IonIcon slot="icon-only" icon={close} />
            </IonButton>
            {renderDetail && <div className="story-view__detail">{renderDetail(open)}</div>}
          </div>
        )}
      </IonModal>
    </>
  )
}

export default StoryBar
