import { appUrl } from './auth'
import { supabase } from './supabase'

/** Newsletter-Abos von Community-Konten (Tabelle trip_subscriptions, RPCs in der Migration). */
export type Frequency = 'instant' | 'weekly'
export type SubStatus = 'active' | 'paused' | 'unsubscribed'

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  instant: 'Bei jedem Beitrag',
  weekly: 'Wöchentlich',
}

export interface MySubscription {
  id: string
  trip_id: string
  trip_title: string
  frequency: Frequency
  status: SubStatus
  token: string | null
  created_at: string
}

export interface Subscriber {
  id: string
  name: string
  email: string
  frequency: Frequency | 'monthly'
  status: SubStatus | 'unconfirmed'
  created_at: string
  legacy: boolean
}

const fail = (message: string): never => {
  throw new Error(message)
}

export const mySubscriptions = async (): Promise<MySubscription[]> => {
  const { data, error } = await supabase.rpc('my_subscriptions')
  if (error) fail('Abos konnten nicht geladen werden.')
  return (data ?? []) as MySubscription[]
}

export const subscribeTrip = async (token: string, frequency: Frequency) => {
  const { error } = await supabase.rpc('subscribe_trip', { p_token: token, p_frequency: frequency })
  if (error) fail(error.message || 'Abo konnte nicht gespeichert werden.')
}

export const updateSubscription = async (id: string, change: Partial<{ frequency: Frequency; status: SubStatus }>) => {
  const { error } = await supabase.from('trip_subscriptions').update(change).eq('id', id)
  if (error) fail('Änderung konnte nicht gespeichert werden.')
}

export const deleteSubscription = async (id: string) => {
  const { error } = await supabase.from('trip_subscriptions').delete().eq('id', id)
  if (error) fail('Abo konnte nicht beendet werden.')
}

/** Für Reise-Admins: wer hat den Newsletter abonniert? */
export const tripSubscribers = async (tripId: string): Promise<Subscriber[]> => {
  const { data, error } = await supabase.rpc('trip_subscribers', { p_trip_id: tripId })
  if (error) fail('Abonnent:innen konnten nicht geladen werden.')
  return (data ?? []) as Subscriber[]
}

export const removeSubscriber = async (s: Subscriber) => {
  const table = s.legacy ? 'follower_subscriptions' : 'trip_subscriptions'
  const { error } = await supabase.from(table).delete().eq('id', s.id)
  if (error) fail('Abo konnte nicht entfernt werden.')
}

/** Abo, das nach dem Bestätigen der E-Mail-Adresse noch abgeschlossen werden muss. */
const PENDING_KEY = 'lf-pending-subscription'

export const savePending = (token: string, frequency: Frequency) => {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ token, frequency, at: Date.now() }))
  } catch {
    /* egal */
  }
}

export const takePending = (): { token: string; frequency: Frequency } | null => {
  // zuerst aus der Adresse (Link aus der Bestätigungs-Mail), sonst aus dem Gerät
  const params = new URLSearchParams(window.location.search)
  const t = params.get('t')
  const f = params.get('f')
  try {
    localStorage.removeItem(PENDING_KEY)
  } catch {
    /* egal */
  }
  if (t && /^[0-9a-f]{20,}$/i.test(t)) return { token: t, frequency: f === 'instant' ? 'instant' : 'weekly' }
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as { token: string; frequency: Frequency; at: number }
    return Date.now() - p.at < 7 * 864e5 ? { token: p.token, frequency: p.frequency } : null
  } catch {
    return null
  }
}

export const hasPending = () => {
  try {
    return !!localStorage.getItem(PENDING_KEY)
  } catch {
    return false
  }
}

/**
 * Konto anlegen bzw. anmelden: Supabase schickt einen Link an die Adresse. Erst mit dem Klick darauf ist die
 * E-Mail-Adresse bestätigt; danach schliesst die Seite «Meine Abos» das Abo ab.
 */
export const requestSubscription = async (email: string, token: string, frequency: Frequency) => {
  savePending(token, frequency)
  const redirect = `${appUrl()}abos?t=${encodeURIComponent(token)}&f=${frequency}`
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: redirect, shouldCreateUser: true },
  })
  if (error) fail(error.message.includes('rate') ? 'Bitte kurz warten und nochmals versuchen.' : 'Die Mail konnte nicht verschickt werden.')
}
