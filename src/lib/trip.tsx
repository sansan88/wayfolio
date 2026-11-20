import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

import { useAuth } from './auth'
import { supabase } from './supabase'

export interface Trip {
  id: string
  owner_id: string
  title: string
  description: string | null
  starts_on: string | null
  ends_on: string | null
}

export type TripDetails = Pick<Trip, 'title' | 'description' | 'starts_on' | 'ends_on'>

interface TripState {
  trips: Trip[]
  trip: Trip | null
  loading: boolean
  error: string | null
  selectTrip: (id: string) => void
  createTrip: (title: string, startsOn: string | null) => Promise<void>
  updateTrip: (details: TripDetails) => Promise<void>
  reload: () => Promise<void>
}

const TripContext = createContext<TripState | undefined>(undefined)
const STORAGE_KEY = 'wayfolio-current-trip'
const COLUMNS = 'id, owner_id, title, description, starts_on, ends_on'

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
    const { data, error: err } = await supabase.from('trips').select(COLUMNS).order('created_at', { ascending: false })
    setTrips((data ?? []) as Trip[])
    setError(err?.message ?? null)
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

  const updateTrip = async (details: TripDetails) => {
    if (!trip) return
    const { data, error: err } = await supabase.from('trips').update(details).eq('id', trip.id).select(COLUMNS).single()
    if (err) throw new Error(err.message)
    setTrips((list) => list.map((t) => (t.id === trip.id ? (data as Trip) : t)))
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
