import { useRef } from 'react'

/**
 * Element, hinter dem ein iOS-Card-Modal erscheint: das oberste offene Modal (gestapelte Karten)
 * oder sonst die Tabs bzw. der Router-Outlet.
 */
export const findPresenter = (): HTMLElement | undefined => {
  const modals = Array.from(document.querySelectorAll<HTMLElement>('ion-modal.show-modal'))
  if (modals.length) return modals[modals.length - 1]
  return document.querySelector<HTMLElement>('ion-tabs') ?? document.querySelector<HTMLElement>('ion-router-outlet') ?? undefined
}

/**
 * Wird beim Öffnen einmal ermittelt und danach behalten – auch beim Schliessen, damit Ionic
 * die dahinterliegende Karte wieder auf volle Grösse zurückanimiert.
 */
export const useCardPresenter = (isOpen: boolean) => {
  const presenter = useRef<HTMLElement | undefined>(undefined)
  const wasOpen = useRef(false)
  if (isOpen && !wasOpen.current) presenter.current = findPresenter()
  wasOpen.current = isOpen
  return presenter.current
}
