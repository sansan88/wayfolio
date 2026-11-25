import { IonIcon } from '@ionic/react'
import { add, barChart, documentText, location, mic, videocam } from 'ionicons/icons'
import { useEffect, useMemo, useRef } from 'react'

import type { FeedPost } from '../lib/updates'
import { dayNumber } from './PostCard'
import './TimelineDots.css'

interface Props {
  posts: FeedPost[]
  activeId: string | null
  /** Reisebeginn für «Tag N» */
  start: string | null | undefined
  onSelect: (post: FeedPost) => void
  /** nur Reisende: Tage ohne Beitrag als gestrichelte Kreise mit «+» */
  missingDays?: { until: Date; onAdd: (day: Date) => void }
}

const dayKey = (d: Date) => d.toLocaleDateString('sv-SE')
const startOfDay = (d: Date) => new Date(`${dayKey(d)}T00:00`)

/** Vorschau eines Events: erstes Foto, sonst ein passendes Symbol. */
const preview = (p: FeedPost) => p.blocks.find((b) => b.kind === 'photo' && !b.route && (b.thumbUrl || b.mediaUrl))
const iconFor = (p: FeedPost) =>
  p.kind === 'poll'
      ? barChart
      : p.blocks.some((b) => b.kind === 'video')
        ? videocam
        : p.blocks.some((b) => b.kind === 'audio')
          ? mic
          : p.place_name
            ? location
            : documentText

/**
 * Ein Punkt pro Event der ganzen Reise (gleiche Reihenfolge wie der Feed).
 * Beim Scrollen im Feed rutscht der aktive Punkt mit; ein Tipp springt zum Event.
 */
const TimelineDots = ({ posts, activeId, start, onSelect, missingDays }: Props) => {
  const strip = useRef<HTMLDivElement>(null)

  // ein Punkt pro Tag: alle Beiträge desselben Tages zusammen (neueste zuerst wie im Feed)
  const days = useMemo(() => {
    const map = new Map<string, FeedPost[]>()
    for (const p of posts) {
      const k = dayKey(new Date(p.published_at))
      map.set(k, [...(map.get(k) ?? []), p])
    }
    return [...map.entries()].map(([key, list]) => ({ key, posts: list }))
  }, [posts])
  const activeDay = days.find((d) => d.posts.some((p) => p.id === activeId))?.key ?? null

  // aktiven Punkt in die Mitte holen
  useEffect(() => {
    const el = strip.current?.querySelector<HTMLElement>(`[data-dot="${activeDay}"]`)
    if (!el || !strip.current) return
    strip.current.scrollTo({ left: el.offsetLeft - strip.current.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [activeDay])

  // Tage mit Beiträgen und – für Reisende – fehlende Tage dazwischen
  const items = useMemo(() => {
    const list: ({ type: 'day'; key: string; posts: FeedPost[]; at: number } | { type: 'gap'; day: Date; at: number })[] = days.map((d) => ({
      type: 'day' as const,
      key: d.key,
      posts: d.posts,
      at: Date.parse(d.posts[0].published_at),
    }))
    if (missingDays && start) {
      const have = new Set(posts.map((p) => dayKey(new Date(p.published_at))))
      const first = startOfDay(new Date(start.length === 10 ? `${start}T12:00` : start))
      const last = startOfDay(missingDays.until)
      for (let d = new Date(last), n = 0; d >= first && n < 365; d.setDate(d.getDate() - 1), n++) {
        if (!have.has(dayKey(d))) list.push({ type: 'gap', day: new Date(d), at: new Date(d).setHours(12) })
      }
    }
    return list.sort((a, b) => b.at - a.at)
  }, [days, posts, missingDays, start])

  return (
    <div className="timeline" ref={strip} role="tablist" aria-label="Reise-Verlauf">
      {items.map((item) => {
        if (item.type === 'gap') {
          const day = dayNumber(item.day.toISOString(), start)
          const label = day ? `Tag ${day}` : item.day.toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })
          return (
            <button
              key={`gap-${item.at}`}
              type="button"
              className="timeline__dot timeline__dot--gap"
              aria-label={`${label} ergänzen (${item.day.toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' })})`}
              onClick={() => missingDays?.onAdd(item.day)}
            >
              <span className="timeline__circle">
                <IonIcon icon={add} />
              </span>
              <span className="timeline__label">{label}</span>
            </button>
          )
        }
        // Vorschau: erstes Foto des Tages, sonst Symbol des ersten Beitrags
        const p = item.posts[0]
        const withImg = item.posts.find((x) => preview(x))
        const img = withImg ? preview(withImg) : undefined
        const day = dayNumber(p.published_at, start)
        const label = day ? `Tag ${day}` : new Date(p.published_at).toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })
        const places = [...new Set(item.posts.map((x) => x.place_name?.split(',')[0]).filter(Boolean))].join(', ')
        const active = item.key === activeDay
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`${label}${places ? `, ${places}` : ''} – ${item.posts.length} ${item.posts.length === 1 ? 'Beitrag' : 'Beiträge'}`}
            data-dot={item.key}
            className={`timeline__dot${active ? ' timeline__dot--active' : ''}${img ? '' : ' timeline__dot--icon'}`}
            onClick={() => onSelect(p)}
          >
            <span className="timeline__circle">
              {img ? <img src={img.thumbUrl ?? img.mediaUrl ?? ''} alt="" loading="lazy" /> : <IonIcon icon={iconFor(p)} />}
            </span>
            {item.posts.length > 1 && <span className="timeline__count">{item.posts.length}</span>}
            <span className="timeline__label">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default TimelineDots
