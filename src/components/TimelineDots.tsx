import { IonIcon } from '@ionic/react'
import { barChart, documentText, location, mic, videocam } from 'ionicons/icons'
import { useEffect, useRef } from 'react'

import type { FeedPost } from '../lib/updates'
import { dayNumber } from './PostCard'
import './TimelineDots.css'

interface Props {
  posts: FeedPost[]
  activeId: string | null
  /** Reisebeginn für «Tag N» */
  start: string | null | undefined
  onSelect: (post: FeedPost) => void
}

/** Vorschau eines Events: erstes Foto, sonst ein passendes Symbol. */
const preview = (p: FeedPost) => p.blocks.find((b) => b.kind === 'photo' && !b.route && (b.thumbUrl || b.mediaUrl))
const iconFor = (p: FeedPost) =>
  p.kind === 'route_update'
    ? location
    : p.kind === 'poll'
      ? barChart
      : p.blocks.some((b) => b.kind === 'video')
        ? videocam
        : p.blocks.some((b) => b.kind === 'audio')
          ? mic
          : documentText

/**
 * Ein Punkt pro Event der ganzen Reise (gleiche Reihenfolge wie der Feed).
 * Beim Scrollen im Feed rutscht der aktive Punkt mit; ein Tipp springt zum Event.
 */
const TimelineDots = ({ posts, activeId, start, onSelect }: Props) => {
  const strip = useRef<HTMLDivElement>(null)

  // aktiven Punkt in die Mitte holen
  useEffect(() => {
    const el = strip.current?.querySelector<HTMLElement>(`[data-dot="${activeId}"]`)
    if (!el || !strip.current) return
    strip.current.scrollTo({ left: el.offsetLeft - strip.current.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [activeId])

  return (
    <div className="timeline" ref={strip} role="tablist" aria-label="Reise-Verlauf">
      {posts.map((p) => {
        const img = preview(p)
        const day = dayNumber(p.published_at, start)
        const label = day ? `Tag ${day}` : new Date(p.published_at).toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })
        const place = p.place_name?.split(',')[0]
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === activeId}
            aria-label={`${label}${place ? `, ${place}` : ''}${p.title ? `: ${p.title}` : ''}`}
            data-dot={p.id}
            className={`timeline__dot${p.id === activeId ? ' timeline__dot--active' : ''}${img ? '' : ' timeline__dot--icon'}`}
            onClick={() => onSelect(p)}
          >
            <span className="timeline__circle">
              {img ? <img src={img.thumbUrl ?? img.mediaUrl ?? ''} alt="" loading="lazy" /> : <IonIcon icon={iconFor(p)} />}
            </span>
            <span className="timeline__label">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default TimelineDots
