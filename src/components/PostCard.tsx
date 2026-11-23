import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonInput,
  IonNote,
  IonProgressBar,
  IonRadio,
  IonRadioGroup,
  IonTextarea,
} from '@ionic/react'
import { barChart, bookOutline, checkmarkCircle, documentTextOutline, ellipsisHorizontal, eyeOffOutline, imagesOutline, link, location, lockClosedOutline } from 'ionicons/icons'
import { useState } from 'react'

import { EMOJIS, type FeedPost } from '../lib/updates'
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
          return <video key={b.position} className="post__media" src={b.mediaUrl} controls playsInline preload="metadata" />
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

const PostCard = ({ post, mode, onReact, onReply, onVote, onResolve, onHideReply, onMenu, day }: Props) => {
  const [reply, setReply] = useState('')
  const [privateReply, setPrivateReply] = useState(false)
  const [sending, setSending] = useState(false)
  const label = kindLabel[post.kind]
  const texts = post.blocks.filter((b) => b.kind === 'text' && b.text)
  const links = post.blocks.filter((b) => b.kind === 'link' && b.url)
  const photos = post.blocks.filter((b) => b.kind === 'photo' && b.mediaUrl && !b.route)
  const isCheckin = post.kind === 'route_update'

  const send = async () => {
    if (!reply.trim() || !onReply) return
    setSending(true)
    try {
      await onReply(post.id, reply, privateReply)
      setReply('')
    } finally {
      setSending(false)
    }
  }

  return (
    <IonCard className={`post post--${post.kind}`}>
      {/* Kopfzeile wie bei Instagram: Ort bzw. Art, darunter Tag · Zeit */}
      <div className="post__top">
        <span className={`post__avatar${isCheckin ? ' post__avatar--place' : ''}`} aria-hidden="true">
          <IonIcon icon={isCheckin ? location : (label?.icon ?? documentTextOutline)} />
        </span>
        <div className="post__who">
          <strong>{isCheckin ? (post.place_name?.split(',')[0] ?? post.title ?? 'Check-in') : (label?.label ?? 'Beitrag')}</strong>
          <span>
            {[
              day ? `Tag ${day}` : null,
              formatTime(post.published_at),
              !isCheckin && post.place_name ? post.place_name.split(',')[0] : null,
              isCheckin ? post.place_name?.split(',').slice(1).join(',').trim() || null : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
        {onMenu && (
          <button type="button" className="post__menu" onClick={() => onMenu(post)} aria-label="Beitrag bearbeiten oder löschen">
            <IonIcon icon={ellipsisHorizontal} />
          </button>
        )}
      </div>

      {isCheckin ? (
        <>
          {photos.length > 0 ? <PhotoCarousel photos={photos} /> : <MediaBlocks post={post} route />}
          {texts.length > 0 && (
            <IonCardContent className="post__caption">
              {post.author_name && <strong>{post.author_name} </strong>}
              {texts.map((b) => b.text).join('\n\n')}
            </IonCardContent>
          )}
        </>
      ) : (
        <>
          {post.title && (
            <IonCardHeader className="post__header">
              <IonCardTitle>{post.title}</IonCardTitle>
              {mode === 'owner' && post.author_name && <IonCardSubtitle className="post__meta">von {post.author_name}</IonCardSubtitle>}
            </IonCardHeader>
          )}
          {texts.map((b) => (
            <IonCardContent key={b.position} className="post__text">
              {b.text}
            </IonCardContent>
          ))}
          {photos.length > 0 && post.kind !== 'poll' && <PhotoCarousel photos={photos} />}
          {post.kind !== 'poll' && <MediaBlocks post={post} other />}
          {links.map((b) => (
            <IonCardContent key={b.position}>
              <a href={b.url!} target="_blank" rel="noopener noreferrer" className="post__link">
                <IonIcon icon={link} aria-hidden="true" /> {b.url}
              </a>
            </IonCardContent>
          ))}
          {post.poll && <PollView post={post} mode={mode} onVote={onVote} onResolve={onResolve} />}
          <MediaBlocks post={post} route />
        </>
      )}

      <div className="post__reactions">
        {EMOJIS.map((e) => {
          const count = post.reactions[e] ?? 0
          const mine = post.my_reactions?.includes(e)
          if (mode === 'owner' && !count) return null
          return (
            <button
              key={e}
              type="button"
              className={`reaction${mine ? ' reaction--mine' : ''}`}
              disabled={mode !== 'follower'}
              onClick={() => onReact?.(post.id, e)}
              aria-label={`Reaktion ${e}`}
            >
              {e}
              {count > 0 && <span>{count}</span>}
            </button>
          )
        })}
      </div>

      {(post.replies.length > 0 || onReply) && (
        <div className="post__replies">
          {post.replies.map((r) => (
            <div key={r.id} className={`reply${r.from_traveler ? ' reply--traveler' : ''}`}>
              <strong>{r.author}</strong> {r.body}
              {r.is_private && <IonIcon icon={lockClosedOutline} aria-label="nur für euch" className="reply__lock" />}
              {mode === 'owner' && !r.from_traveler && onHideReply && (
                <button type="button" className="reply__hide" onClick={() => onHideReply(r.id)} aria-label="Ausblenden">
                  <IonIcon icon={eyeOffOutline} />
                </button>
              )}
            </div>
          ))}
          {onReply && (
            <div className="reply__form">
              <IonInput
                placeholder={mode === 'owner' ? 'Antworten …' : 'Antwort schreiben …'}
                maxlength={500}
                value={reply}
                onIonInput={(e) => setReply(String(e.detail.value ?? ''))}
                onKeyDown={(e) => e.key === 'Enter' && void send()}
              />
              {mode === 'follower' && (
                <button
                  type="button"
                  className={`reply__private${privateReply ? ' reply__private--on' : ''}`}
                  onClick={() => setPrivateReply(!privateReply)}
                  aria-pressed={privateReply}
                  title="Nur für die Reisenden sichtbar"
                >
                  <IonIcon icon={lockClosedOutline} />
                </button>
              )}
              <IonButton size="small" fill="clear" disabled={!reply.trim() || sending} onClick={() => void send()}>
                Senden
              </IonButton>
            </div>
          )}
        </div>
      )}
    </IonCard>
  )
}

export default PostCard
