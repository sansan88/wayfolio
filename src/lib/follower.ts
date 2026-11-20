import type { RoutePoint } from './route'
import type { FeedPost } from './updates'

const API = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/follower-api`
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

/** Zufälliges Geräte-Token: erkennt Follower ohne Konto wieder (nur in diesem Browser gespeichert). */
const deviceToken = () => {
  const storageKey = 'wayfolio-device'
  try {
    let token = localStorage.getItem(storageKey)
    if (!token) {
      token = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, '0')).join('')
      localStorage.setItem(storageKey, token)
    }
    return token
  } catch {
    return 'ephemeral-' + crypto.randomUUID()
  }
}

export interface FollowerFeed {
  trip: { title: string; description: string | null; starts_on: string | null }
  follower: { display_name: string } | null
  subscription: { frequency: 'instant' | 'weekly' | 'monthly'; status: string; email: string | null } | null
  posts: FeedPost[]
  route: RoutePoint[]
}

const call = async <T>(token: string, action: string, payload: Record<string, unknown> = {}): Promise<T> => {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: KEY },
    body: JSON.stringify({ action, token, device: deviceToken(), ...payload }),
  })
  const data = await res.json().catch(() => ({ error: 'Keine Verbindung' }))
  if (!res.ok) throw new Error(data.error ?? 'Fehler')
  return data as T
}

export const followerApi = (token: string) => ({
  feed: () => call<FollowerFeed>(token, 'feed'),
  join: (name: string) => call(token, 'join', { name }),
  react: (postId: string, emoji: string) => call(token, 'react', { post_id: postId, emoji }),
  reply: (postId: string, body: string, isPrivate: boolean) => call(token, 'reply', { post_id: postId, body, private: isPrivate }),
  vote: (optionId: string) => call(token, 'vote', { option_id: optionId }),
  subscribe: (email: string, frequency: string) => call(token, 'subscribe', { email, frequency }),
  unsubscribe: () => call(token, 'unsubscribe'),
})

/** Token aus einem Pfad wie /wayfolio/t/<token> */
export const followerTokenFromPath = (pathname: string) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const m = pathname.slice(base.length).match(/^\/t\/([a-f0-9]{32,})\/?$/)
  return m?.[1] ?? null
}
