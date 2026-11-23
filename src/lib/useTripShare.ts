import { useIonActionSheet, useIonToast } from '@ionic/react'

import { useTrip } from './trip'
import { getOrCreateShareLink, rotateShareLink } from './updates'

/**
 * Ein Link für die ganze Reise (Tagebuch, Karte und Fotos) – überall dieselbe Teilen-Logik.
 * section: Bereich, der beim Öffnen gezeigt wird (z.B. «fotos» aus der Galerie).
 */
export const useTripShare = () => {
  const { trip } = useTrip()
  const [presentSheet] = useIonActionSheet()
  const [presentToast] = useIonToast()
  const toast = (message: string, color = 'success') => presentToast({ message, duration: 2200, position: 'top', color })

  const shareUrl = async (url: string) => {
    const text = `Folgt unserer Reise «${trip?.title}» – ohne App und ohne Konto:`
    if (navigator.share) await navigator.share({ title: trip?.title, text, url }).catch(() => undefined)
    else {
      await navigator.clipboard.writeText(url)
      toast('Reise-Link kopiert')
    }
  }

  return async (section?: 'fotos' | 'route') => {
    if (!trip) return
    try {
      const base = await getOrCreateShareLink(trip.id)
      const withSection = (u: string) => (section ? `${u}#${section}` : u)
      const url = withSection(base)
      await presentSheet({
        header: 'Reise teilen',
        subHeader: 'Ein Link für Tagebuch, Karte und Fotos – ohne App und ohne Konto.',
        buttons: [
          { text: 'Link teilen', handler: () => void shareUrl(url) },
          { text: 'Link kopieren', handler: () => void navigator.clipboard.writeText(url).then(() => toast('Reise-Link kopiert')) },
          {
            text: 'Neuen Link erzeugen (alter wird gesperrt)',
            role: 'destructive',
            handler: () => void rotateShareLink(trip.id).then((u) => shareUrl(withSection(u))),
          },
          { text: 'Abbrechen', role: 'cancel' },
        ],
      })
    } catch (e) {
      toast((e as Error).message, 'danger')
    }
  }
}
