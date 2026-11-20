import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

import { useAuth } from './auth'
import { supabase } from './supabase'

export interface Trip {
  id: string
  owner_id: string
  title: string
  starts_on: string | null
}

interface TripState {
  trip: Trip | null
  loading: boolean
  error: string | null
  createTrip: (title: string, startsOn: string | null) => Promise<void>
}

const TripContext = createContext<TripState | undefined>(undefined)

/** Lädt die aktuelle (neueste) Reise der angemeldeten Person. */
export const TripProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth()
  const userId = session?.user.id
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error: err } = await supabase
      .from('trips')
      .select('id, owner_id, title, starts_on')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setTrip(data)
    setError(err?.message ?? null)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const createTrip = async (title: string, startsOn: string | null) => {
    if (!userId) throw new Error('Nicht angemeldet')
    const { data, error: err } = await supabase
      .from('trips')
      .insert({ owner_id: userId, title, starts_on: startsOn })
      .select('id, owner_id, title, starts_on')
      .single()
    if (err) throw new Error(err.message)
    setTrip(data)
  }

  return <TripContext.Provider value={{ trip, loading, error, createTrip }}>{children}</TripContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTrip = () => {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('useTrip muss innerhalb von <TripProvider> verwendet werden')
  return ctx
}
