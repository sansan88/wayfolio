import { useIonAlert } from '@ionic/react'
import { useCallback, useEffect, useState } from 'react'

import { useAuth } from './auth'
import { supabase } from './supabase'

/** Einwilligung für KI-Funktionen (Claude): Spalte profiles.ai_enabled_at, lokal zwischengespeichert. */
const key = (userId: string) => `lf-ai-enabled:${userId}`
const listeners = new Set<() => void>()

const readCache = (userId: string): boolean | null => {
  try {
    const v = localStorage.getItem(key(userId))
    return v === null ? null : v === '1'
  } catch {
    return null
  }
}

const writeCache = (userId: string, on: boolean) => {
  try {
    localStorage.setItem(key(userId), on ? '1' : '0')
  } catch {
    /* egal */
  }
  listeners.forEach((l) => l())
}

export const loadAiEnabled = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase.from('profiles').select('ai_enabled_at').eq('id', userId).maybeSingle()
  if (error) return readCache(userId) ?? false
  const on = !!data?.ai_enabled_at
  writeCache(userId, on)
  return on
}

export const saveAiEnabled = async (userId: string, on: boolean) => {
  const { error } = await supabase
    .from('profiles')
    .update({ ai_enabled_at: on ? new Date().toISOString() : null })
    .eq('id', userId)
  if (error) throw new Error('Die Einstellung konnte nicht gespeichert werden.')
  writeCache(userId, on)
}

export const AI_CONSENT_TEXT =
  'Dafür schicken wir euren Text oder eure Stichworte, Ort, Datum und bis zu vier verkleinerte Fotos an Anthropic (USA), den Anbieter von Claude. ' +
  'Das betrifft euren Datenschutz und den von Personen auf den Fotos. Anthropic trainiert damit laut eigenen Bedingungen nicht. ' +
  'Ausschalten könnt ihr das jederzeit unter Reisen › Dein Profil.'

/**
 * `enabled`: aktueller Stand. `ensure()`: beim ersten Mal Hinweis zeigen und aktive Zustimmung einholen;
 * liefert true, wenn Claude verwendet werden darf.
 */
export const useAiConsent = () => {
  const { session } = useAuth()
  const userId = session?.user.id ?? null
  const [enabled, setEnabled] = useState<boolean | null>(() => (userId ? readCache(userId) : null))
  const [presentAlert] = useIonAlert()

  useEffect(() => {
    if (!userId) return
    const sync = () => setEnabled(readCache(userId))
    listeners.add(sync)
    void loadAiEnabled(userId).then(setEnabled)
    return () => {
      listeners.delete(sync)
    }
  }, [userId])

  const ask = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        void presentAlert({
          header: 'Claude verwenden?',
          message: AI_CONSENT_TEXT,
          backdropDismiss: false,
          buttons: [
            { text: 'Nein', role: 'cancel', handler: () => resolve(false) },
            { text: 'Ja, aktivieren', role: 'confirm', handler: () => resolve(true) },
          ],
        })
      }),
    [presentAlert],
  )

  const ensure = useCallback(async (): Promise<boolean> => {
    if (!userId) return false
    if (enabled ?? readCache(userId)) return true
    // Stand vom Server prüfen (z. B. auf einem anderen Gerät schon zugestimmt)
    if (await loadAiEnabled(userId)) return true
    if (!(await ask())) return false
    await saveAiEnabled(userId, true)
    return true
  }, [userId, enabled, ask])

  const disable = useCallback(async () => {
    if (userId) await saveAiEnabled(userId, false)
  }, [userId])

  return { enabled, ensure, disable }
}
