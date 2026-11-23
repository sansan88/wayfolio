import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Verbindet Feed und Punkte-Leiste: der oberste sichtbare Beitrag ist aktiv,
 * ein Tipp auf einen Punkt scrollt den Feed dorthin. Beiträge brauchen data-post-id.
 */
export const useTimeline = (ids: string[]) => {
  const contentRef = useRef<HTMLIonContentElement>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const frame = useRef(0)
  const jumping = useRef(false)

  const onScroll = useCallback(() => {
    if (jumping.current) return
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const content = contentRef.current
      if (!content) return
      const top = content.getBoundingClientRect().top + 72
      const cards = content.querySelectorAll<HTMLElement>('[data-post-id]')
      for (const el of cards) {
        if (el.getBoundingClientRect().bottom > top) {
          setActiveId(el.dataset.postId ?? null)
          return
        }
      }
    })
  }, [])

  // neue oder gelöschte Beiträge: aktiven Punkt aus der aktuellen Scroll-Position neu bestimmen
  const key = ids.join(',')
  useEffect(() => {
    setActiveId((cur) => (cur && ids.includes(cur) ? cur : (ids[0] ?? null)))
    const t = setTimeout(onScroll, 50)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const jumpTo = useCallback(async (id: string) => {
    const content = contentRef.current
    const el = content?.querySelector<HTMLElement>(`[data-post-id="${id}"]`)
    if (!content || !el) return
    setActiveId(id)
    jumping.current = true
    const scroller = await content.getScrollElement()
    const y = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 8
    await content.scrollToPoint(0, Math.max(0, y), 450)
    setTimeout(() => (jumping.current = false), 80)
  }, [])

  return { contentRef, activeId, onScroll, jumpTo }
}
