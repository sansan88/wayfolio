import { appUrl } from './auth'
import { supabase } from './supabase'

export interface Member {
  profile_id: string
  role: 'owner' | 'coauthor'
  display_name: string | null
}

export const inviteUrl = (token: string) => `${appUrl()}einladung/${token}`

/** Mitreisende einer Reise mit Namen. */
export const loadMembers = async (tripId: string): Promise<Member[]> => {
  const { data, error } = await supabase.from('trip_members').select('profile_id, role').eq('trip_id', tripId)
  if (error) throw new Error(error.message)
  const ids = (data ?? []).map((m) => m.profile_id)
  const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', ids)
  return (data ?? []).map((m) => ({
    profile_id: m.profile_id,
    role: m.role as Member['role'],
    display_name: profiles?.find((p) => p.id === m.profile_id)?.display_name ?? null,
  }))
}

/** Erzeugt einen Einladungslink (7 Tage gültig, einmal verwendbar). */
export const createInvite = async (tripId: string, userId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('trip_invites')
    .insert({ trip_id: tripId, created_by: userId })
    .select('token')
    .single()
  if (error) throw new Error(error.message)
  return inviteUrl(data.token)
}

export const acceptInvite = async (token: string): Promise<string> => {
  const { data, error } = await supabase.rpc('accept_trip_invite', { p_token: token })
  if (error) throw new Error(error.message)
  return data as string
}

export const removeMember = async (tripId: string, profileId: string) => {
  const { error } = await supabase.from('trip_members').delete().eq('trip_id', tripId).eq('profile_id', profileId)
  if (error) throw new Error(error.message)
}

export const loadOwnName = async (userId: string) => {
  const { data } = await supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle()
  return data?.display_name ?? ''
}

export const saveOwnName = async (userId: string, name: string) => {
  const { error } = await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', userId)
  if (error) throw new Error(error.message)
}

/** Token aus einem Pfad wie /wayfolio/einladung/<token> */
export const inviteTokenFromPath = (pathname: string) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const m = pathname.slice(base.length).match(/^\/einladung\/([a-f0-9]{32,})\/?$/)
  return m?.[1] ?? null
}
