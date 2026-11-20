import { supabase } from './supabase'

export interface RoutePoint {
  id: string
  lon: number
  lat: number
  place_name: string | null
  recorded_at: string
}

/** Routenpunkte einer Reise (für Reisende, RLS-geschützt). Ohne MapLibre, damit das Hauptpaket klein bleibt. */
export const loadRoute = async (tripId: string): Promise<RoutePoint[]> => {
  const { data, error } = await supabase.rpc('trip_checkins', { p_trip_id: tripId })
  if (error) throw new Error(error.message)
  return (data ?? []) as RoutePoint[]
}
