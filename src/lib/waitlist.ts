import { supabase } from './supabase'

/**
 * Trägt eine E-Mail-Adresse in die Warteliste für öffentliche Reisen ein.
 * Die Tabelle erlaubt nur INSERT; eine bereits eingetragene Adresse gilt als Erfolg.
 */
export const joinWaitlist = async (email: string): Promise<void> => {
  const { error } = await supabase
    .from('waitlist')
    .insert({ email: email.trim(), feature: 'public_trips', locale: navigator.language?.slice(0, 12) ?? null })
  if (error && error.code !== '23505') throw error
}
