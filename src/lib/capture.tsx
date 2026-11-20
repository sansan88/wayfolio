import { createContext, useContext, useState, type ReactNode } from 'react'

import type { Place, Position } from './location'

/** Ort und Zeitpunkt für neue Updates – bleiben erhalten, wenn man zwischen Tabs wechselt. */
interface CaptureState {
  position: Position | null
  place: Place | null
  source: 'gps' | 'manual'
  /** null = jetzt */
  at: Date | null
  setLocation: (position: Position, place: Place, source: 'gps' | 'manual') => void
  setAt: (at: Date | null) => void
}

const CaptureContext = createContext<CaptureState | undefined>(undefined)

export const CaptureProvider = ({ children }: { children: ReactNode }) => {
  const [position, setPosition] = useState<Position | null>(null)
  const [place, setPlace] = useState<Place | null>(null)
  const [source, setSource] = useState<'gps' | 'manual'>('gps')
  const [at, setAt] = useState<Date | null>(null)

  const setLocation = (pos: Position, p: Place, src: 'gps' | 'manual') => {
    setPosition(pos)
    setPlace(p)
    setSource(src)
  }

  return (
    <CaptureContext.Provider value={{ position, place, source, at, setLocation, setAt }}>{children}</CaptureContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCapture = () => {
  const ctx = useContext(CaptureContext)
  if (!ctx) throw new Error('useCapture muss innerhalb von <CaptureProvider> verwendet werden')
  return ctx
}
