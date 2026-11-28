import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

import { useAuth } from './auth'
import { supabase } from './supabase'
import { cachedLoad } from './offline'

export interface Trip {
  id: string
  owner_id: string
  title: string
  description: string | null
  starts_on: string | null
  ends_on: string | null
  /** Follower sehen Orte erst nach dieser Zeit */
  location_delay_minutes: number
  /** E-Mail-Erinnerung nach so vielen Tagen ohne Beitrag; null = aus */
  reminder_days: number | null
  /** Links dieser Reise erscheinen anonym als Tipps «In der Nähe» bei anderen Reisenden */
  share_tips: boolean
}

export type TripDetails = Pick<Trip, 'title' | 'description' | 'starts_on' | 'ends_on' | 'location_delay_minutes' | 'reminder_days' | 'share_tips'>

interface TripState {
  trips: Trip[]
  trip: Trip | null
  loading: boolean
  error: string | null
  selectTrip: (id: string) => void
  createTrip: (title: string, startsOn: string | null) => Promise<void>
  /** Details einer beliebigen eigenen oder geteilten Reise ändern */
  updateTrip: (id: string, details: TripDetails) => Promise<void>
  reload: () => Promise<void>
}

const TripContext = createContext<TripState | undefined>(undefined)
const STORAGE_KEY = 'wayfolio-current-trip'
const COLUMNS = 'id, owner_id, title, description, starts_on, ends_on, location_delay_minutes, reminder_days, share_tips'

const remember = (id: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* privater Modus */
  }
}

/** Alle Reisen, bei denen die Person Owner oder Mitreisende ist, plus die aktuell gewählte. */
export const TripProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth()
  const userId = session?.user.id
  const [trips, setTrips] = useState<Trip[]>([])
  const [currentId, setCurrentId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!userId) return
    try {
      const list = await cachedLoad(`trips:${userId}`, async () => {
        const { data, error: err } = await supabase.from('trips').select(COLUMNS).order('created_at', { ascending: false })
        if (err) throw new Error(err.message)
        return (data ?? []) as Trip[]
      })
      setTrips(list)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void reload()
  }, [reload])

  const trip = trips.find((t) => t.id === currentId) ?? trips[0] ?? null

  const selectTrip = (id: string) => {
    remember(id)
    setCurrentId(id)
  }

  const createTrip = async (title: string, startsOn: string | null) => {
    if (!userId) throw new Error('Nicht angemeldet')
    const { data, error: err } = await supabase
      .from('trips')
      .insert({ owner_id: userId, title, starts_on: startsOn })
      .select(COLUMNS)
      .single()
    if (err) throw new Error(err.message)
    setTrips((list) => [data as Trip, ...list])
    selectTrip((data as Trip).id)
  }

  const updateTrip = async (id: string, details: TripDetails) => {
    const { data, error: err } = await supabase.from('trips').update(details).eq('id', id).select(COLUMNS).single()
    if (err) throw new Error(err.message)
    setTrips((list) => list.map((t) => (t.id === id ? (data as Trip) : t)))
  }

  return (
    <TripContext.Provider value={{ trips, trip, loading, error, selectTrip, createTrip, updateTrip, reload }}>
      {children}
    </TripContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTrip = () => {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('useTrip muss innerhalb von <TripProvider> verwendet werden')
  return ctx
}

/** Merkt eine Reise als aktuelle vor (z.B. nach dem Annehmen einer Einladung). */
// eslint-disable-next-line react-refresh/only-export-components
export const rememberTrip = remember
