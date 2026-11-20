import { useMemo } from 'react'

/**
 * Element, hinter dem ein iOS-Card-Modal erscheint: das oberste offene Modal (gestapelte Karten)
 * oder sonst die Tabs bzw. der Router-Outlet. Wird beim Öffnen einmal ermittelt.
 */
export const findPresenter = (): HTMLElement | undefined => {
  const modals = Array.from(document.querySelectorAll<HTMLElement>('ion-modal.show-modal'))
  if (modals.length) return modals[modals.length - 1]
  return document.querySelector<HTMLElement>('ion-tabs') ?? document.querySelector<HTMLElement>('ion-router-outlet') ?? undefined
}

export const useCardPresenter = (isOpen: boolean) =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => (isOpen ? findPresenter() : undefined), [isOpen])
