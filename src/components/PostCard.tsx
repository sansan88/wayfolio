import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonNote,
  IonProgressBar,
  IonRadio,
  IonRadioGroup,
  IonTextarea,
} from '@ionic/react'
import { barChart, bookOutline, checkmarkCircle, documentTextOutline, ellipsisHorizontal, imagesOutline, location, openOutline } from 'ionicons/icons'
import { useState } from 'react'

import { describeLink } from '../lib/links'
import type { FeedPost } from '../lib/updates'
import './PostCard.css'

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('de-CH', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const kindLabel: Partial<Record<FeedPost['kind'], { icon: string; label: string }>> = {
  route_update: { icon: location, label: 'Check-in' },
  feed: { icon: documentTextOutline, label: 'Beitrag' },
  story: { icon: imagesOutline, label: 'Moment' },
  background: { icon: bookOutline, label: 'Hintergrund' },
  poll: { icon: barChart, label: 'Entscheidung' },
}

interface Props {
  post: FeedPost
  mode: 'owner' | 'follower'
  onReact?: (postId: string, emoji: string) => void
  onReply?: (postId: string, body: string, isPrivate: boolean) => Promise<void>
  onVote?: (pollId: string, optionId: string) => void
  onResolve?: (pollId: string, optionId: string, text: string) => Promise<void>
  onHideReply?: (replyId: string) => void
  /** Menü «Bearbeiten / Löschen» (nur Reisende) */
  onMenu?: (post: FeedPost) => void
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

const PollView = ({ post, mode, onVote, onResolve }: Pick<Props, 'post' | 'mode' | 'onVote' | 'onResolve'>) => {
  const poll = post.poll!
  const [choice, setChoice] = useState<string | undefined>()
  const [reason, setReason] = useState('')
  const [resolving, setResolving] = useState(false)
  const open = poll.status === 'open' && (!poll.closes_at || Date.parse(poll.closes_at) > Date.now())
  const showResults = poll.total !== null

  return (
    <IonCardContent>
      {poll.description && <p className="poll__desc">{poll.description}</p>}
      {poll.options.map((o) => {
        const share = showResults && poll.total ? Math.round((o.votes / poll.total) * 100) : 0
        const chosen = poll.chosen_option_id === o.id
        const mine = poll.my_option_id === o.id
        return (
          <button
            key={o.id}
            type="button"
            className={`poll__option${chosen ? ' poll__option--chosen' : ''}${mine ? ' poll__option--mine' : ''}`}
            disabled={mode !== 'follower' || !open}
            onClick={() => onVote?.(poll.id, o.id)}
          >
            <span className="poll__label">
              {o.label}
              {chosen && <IonBadge color="primary">Unsere Entscheidung</IonBadge>}
              {mine && !chosen && <IonIcon icon={checkmarkCircle} color="primary" aria-label="Deine Stimme" />}
            </span>
            {showResults && (
              <>
                <IonProgressBar value={share / 100} color={chosen ? 'primary' : 'medium'} />
                <span className="poll__share">
                  {share} % · {o.votes}
                </span>
              </>
            )}
          </button>
        )
      })}
      <IonNote>
        {showResults
          ? `${poll.total} ${poll.total === 1 ? 'Stimme' : 'Stimmen'}`
          : 'Stimme ab, um das Resultat zu sehen.'}
        {open && poll.closes_at && ` · offen bis ${formatTime(poll.closes_at)}`}
        {!open && poll.status !== 'resolved' && ' · Abstimmung beendet'}
      </IonNote>
      {poll.status === 'resolved' && poll.decision_text && <p className="poll__decision">{poll.decision_text}</p>}

      {mode === 'owner' && poll.status !== 'resolved' && (
        <div className="poll__resolve">
          {!resolving ? (
            <IonButton size="small" fill="outline" onClick={() => setResolving(true)}>
              Unsere Entscheidung bekanntgeben
            </IonButton>
          ) : (
            <>
              <IonRadioGroup value={choice} onIonChange={(e) => setChoice(e.detail.value)}>
                {poll.options.map((o) => (
                  <IonRadio key={o.id} value={o.id} labelPlacement="end" className="poll__radio">
                    {o.label}
                  </IonRadio>
                ))}
              </IonRadioGroup>
              <IonTextarea
                fill="outline"
                placeholder="Warum wir uns so entschieden haben …"
                autoGrow
                value={reason}
                onIonInput={(e) => setReason(String(e.detail.value ?? ''))}
              />
              <IonButton
                size="small"
                disabled={!choice}
                onClick={() => choice && void onResolve?.(poll.id, choice, reason).then(() => setResolving(false))}
              >
                Bekanntgeben
              </IonButton>
            </>
          )}
        </div>
      )}
    </IonCardContent>
  )
}

const PostCard = ({ post, mode, onVote, onResolve, onMenu, day, onPlace }: Props) => {
  const label = kindLabel[post.kind]
  const texts = post.blocks.filter((b) => b.kind === 'text' && b.text)
  const links = post.blocks.filter((b) => b.kind === 'link' && b.url)
  // Bilder oben: Fotos, danach das Routenbild (bei Orten ohne Fotos ist es das einzige Bild)
  const media = post.kind === 'poll' ? [] : [
    ...post.blocks.filter((b) => b.kind === 'photo' && b.mediaUrl && !b.route),
    ...post.blocks.filter((b) => b.kind === 'photo' && b.mediaUrl && b.route),
  ]
  const others = post.blocks.some((b) => (b.kind === 'video' || b.kind === 'audio') && b.mediaUrl)
  const placeParts = post.place_name?.split(',').map((x) => x.trim()) ?? []
  // Check-in: Ort als Titel, Land darunter; Beitrag: eigener Titel, Ort darunter
  const isCheckin = post.kind === 'route_update'
  const title = isCheckin ? (placeParts[0] ?? post.title ?? 'Check-in') : (post.title ?? placeParts[0] ?? 'Beitrag')
  // Check-in: Titel ist der Ort, darunter das Land (antippbar); Beitrag: Ort unter dem Titel
  const place = post.place_name ? (isCheckin ? placeParts.slice(1).join(', ') || placeParts[0] : placeParts[0]) : null


  return (
    <IonCard className={`post post--${post.kind}`}>
      {/* Ionic-Card-Standard: Medien oben, dann Kopf (Titel + Untertitel), dann Inhalt */}
      {media.length > 0 && <PhotoCarousel photos={media} />}

      <IonCardHeader className="post__header">
        {onMenu && (
          <button type="button" className="post__menu" onClick={() => onMenu(post)} aria-label="Beitrag bearbeiten oder löschen">
            <IonIcon icon={ellipsisHorizontal} />
          </button>
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
          <IonIcon icon={label?.icon ?? documentTextOutline} aria-hidden="true" />
          <span>
          {[label?.label ?? 'Beitrag', day ? `Tag ${day}` : null, formatTime(post.published_at), mode === 'owner' ? post.author_name : null]
            .filter(Boolean)
            .join(' · ')}
          </span>
        </div>
      </IonCardHeader>

      {(texts.length > 0 || links.length > 0 || others) && (
        <IonCardContent className="post__body">
          {texts.map((b) => (
            <p key={b.position} className="post__text">
              {b.text}
            </p>
          ))}
          {post.kind !== 'poll' && <MediaBlocks post={post} other />}
          {links.length > 0 && (
            <div className="post__links">
              {links.map((b) => {
                const d = describeLink(b.url!, b.text)
                return (
                  <a key={b.position} href={b.url!} target="_blank" rel="noopener noreferrer" className="post__link">
                    <span className="post__link-icon">
                      <IonIcon icon={d.icon} aria-hidden="true" />
                    </span>
                    <span className="post__link-text">{d.label}</span>
                    <IonIcon icon={openOutline} className="post__link-open" aria-hidden="true" />
                  </a>
                )
              })}
            </div>
          )}
        </IonCardContent>
      )}
      {post.poll && <PollView post={post} mode={mode} onVote={onVote} onResolve={onResolve} />}

    </IonCard>
  )
}

export default PostCard
