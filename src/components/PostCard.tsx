import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonFabButton,
  IonIcon,
} from '@ionic/react'
import { ellipsisHorizontal, location, openOutline, shareOutline } from 'ionicons/icons'
import { useState } from 'react'

import { describeLink } from '../lib/links'
import type { FeedPost } from '../lib/updates'
import './PostCard.css'

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('de-CH', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

interface Props {
  post: FeedPost
  mode: 'owner' | 'follower'
  onReact?: (postId: string, emoji: string) => void
  onReply?: (postId: string, body: string, isPrivate: boolean) => Promise<void>
  onHideReply?: (replyId: string) => void
  /** Menü «Bearbeiten / Löschen» (nur Reisende) */
  onMenu?: (post: FeedPost) => void
  /** Teilen: Link für WhatsApp & Co. oder Bild für Instagram (nur Reisende) */
  onShare?: (post: FeedPost) => void
  /** Reisetag für die Kopfzeile */
  day?: number | null
  /** Tipp auf den Ort: zur Karte an diesen Punkt */
  onPlace?: (post: FeedPost) => void
}

/** Ein Beitrag im Feed – für Reisende und Follower. */
export const MediaBlocks = ({ post, route = false, other = false }: { post: FeedPost; route?: boolean; other?: boolean }) => (
  <>
    {post.blocks
      .filter((b) => (route ? b.route : other ? !b.route && b.kind !== 'photo' : !b.route))
      .map((b) => {
        if (b.kind === 'photo' && b.mediaUrl)
          return <img key={b.position} className={route ? 'post__media post__route' : 'post__media'} src={b.mediaUrl} alt={route ? 'Routenkarte' : ''} loading="lazy" />
        if (b.kind === 'video' && b.mediaUrl)
          return <video key={b.position} className="post__media" src={b.mediaUrl} controls controlsList="nodownload" disablePictureInPicture playsInline preload="metadata" />
        if (b.kind === 'audio' && b.mediaUrl)
          return <audio key={b.position} className="post__audio" src={b.mediaUrl} controls preload="metadata" />
        return null
      })}
  </>
)

/** Fotos zum Durchwischen (wie bei Instagram) mit Zähler. */
export const PhotoCarousel = ({ photos }: { photos: FeedPost['blocks'] }) => {
  const [index, setIndex] = useState(0)
  if (photos.length === 1)
    return <img className="post__media post__photo" src={photos[0].mediaUrl!} alt="" loading="lazy" />
  return (
    <div className="carousel">
      <div
        className="carousel__track"
        onScroll={(e) => {
          const el = e.currentTarget
          setIndex(Math.round(el.scrollLeft / el.clientWidth))
        }}
      >
        {photos.map((p) => (
          <img key={p.position} src={p.mediaUrl!} alt="" loading="lazy" />
        ))}
      </div>
      <span className="carousel__count">
        {index + 1}/{photos.length}
      </span>
      <div className="carousel__dots" aria-hidden="true">
        {photos.map((p, i) => (
          <span key={p.position} className={i === index ? 'active' : ''} />
        ))}
      </div>
    </div>
  )
}

/** Reisetag ab Start der Reise (1 = erster Tag). */
export const dayNumber = (iso: string, start: string | null | undefined) => {
  if (!start) return null
  const d = (x: string) => new Date(new Date(x).toLocaleDateString('sv-SE') + 'T00:00').getTime()
  const n = Math.round((d(iso) - d(start)) / 86400000) + 1
  return n >= 1 ? n : null
}

const PostCard = ({ post, mode, onMenu, onShare, day, onPlace }: Props) => {
  const texts = post.blocks.filter((b) => b.kind === 'text' && b.text)
  const links = post.blocks.filter((b) => b.kind === 'link' && b.url)
  // Bilder oben: Fotos, danach das Routenbild (bei Orten ohne Fotos ist es das einzige Bild)
  const media = [
    ...post.blocks.filter((b) => b.kind === 'photo' && b.mediaUrl && !b.route),
    ...post.blocks.filter((b) => b.kind === 'photo' && b.mediaUrl && b.route),
  ]
  const others = post.blocks.some((b) => (b.kind === 'video' || b.kind === 'audio') && b.mediaUrl)
  const placeParts = post.place_name?.split(',').map((x) => x.trim()) ?? []
  // Eigener Titel hat Vorrang; ohne Titel ist der Ort der Titel (darunter das Land), sonst steht der ganze Ort darunter.
  // Ältere Check-ins speicherten den Ortsnamen als Titel – das zählt nicht als eigener Titel.
  const ownTitle = post.title?.trim() && post.title.trim() !== post.place_name?.trim() && post.title.trim() !== placeParts[0] ? post.title.trim() : null
  const title = ownTitle ?? placeParts[0] ?? 'Beitrag'
  const place = post.place_name ? (ownTitle ? placeParts.join(', ') : placeParts.slice(1).join(', ') || null) : null

  return (
    <IonCard className={`post post--${post.kind}${onShare || onMenu ? (media.length > 0 ? ' post--actions-edge' : ' post--actions-top') : ''}`}>
      {/* Ionic-Card-Standard: Medien oben, dann Kopf (Titel + Untertitel), dann Inhalt */}
      {media.length > 0 && <PhotoCarousel photos={media} />}

      <IonCardHeader className="post__header">
        {(onShare || onMenu) && (
          // Aktionen als kleine FAB-Knöpfe am unteren Rand des Bildes (ohne Bild oben rechts)
          <div className={`post__actions${media.length > 0 ? ' post__actions--edge' : ''}`}>
            {onShare && (
              <IonFabButton size="small" onClick={() => onShare(post)} aria-label="Beitrag teilen">
                <IonIcon icon={shareOutline} />
              </IonFabButton>
            )}
            {onMenu && (
              <IonFabButton size="small" color="light" onClick={() => onMenu(post)} aria-label="Weitere Aktionen: bearbeiten, Links sperren, löschen">
                <IonIcon icon={ellipsisHorizontal} />
              </IonFabButton>
            )}
          </div>
        )}
        <IonCardTitle>{title}</IonCardTitle>
        {place &&
          (onPlace && post.checkin_id ? (
            <button type="button" className="post__place post__place--link" onClick={() => onPlace(post)} aria-label={`${place} auf der Karte zeigen`}>
              <IonIcon icon={location} aria-hidden="true" /> {place}
            </button>
          ) : (
            <span className="post__place">
              <IonIcon icon={location} aria-hidden="true" /> {place}
            </span>
          ))}
        <div className="post__meta">
          {[day ? `Tag ${day}` : null, formatTime(post.published_at), mode === 'owner' ? post.author_name : null]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </IonCardHeader>

      {(texts.length > 0 || links.length > 0 || others) && (
        <IonCardContent className="post__body">
          {texts.map((b) => (
            <p key={b.position} className="post__text">
              {b.text}
            </p>
          ))}
          <MediaBlocks post={post} other />
          {links.length > 0 && (
            <div className="post__links">
              {links.map((b) => {
                const d = describeLink(b.url!, b.text)
                return (
                  <a key={b.position} href={b.url!} target="_blank" rel="noopener noreferrer" className="post__link">
                    <span className="post__link-icon">
                      <IonIcon icon={d.icon} aria-hidden="true" />
                    </span>
                    <span className="post__link-text">
                      <strong>{d.label}</strong>
                      {d.service && <span>{d.service}</span>}
                    </span>
                    <IonIcon icon={openOutline} className="post__link-open" aria-hidden="true" />
                  </a>
                )
              })}
            </div>
          )}
        </IonCardContent>
      )}

    </IonCard>
  )
}

export default PostCard
