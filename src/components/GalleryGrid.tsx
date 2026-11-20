import { IonButton, IonIcon, IonModal } from '@ionic/react'
import { chevronBack, chevronForward, close, downloadOutline, playCircle, trashOutline } from 'ionicons/icons'
import { useState } from 'react'

import { formatDay, type GalleryDay, type GalleryItem } from '../lib/gallery'
import './GalleryGrid.css'

interface Props {
  days: GalleryDay[]
  onDelete?: (item: GalleryItem) => void
}

/** Alben nach Tagen mit Vollbild-Ansicht, Blättern und Download. */
const GalleryGrid = ({ days, onDelete }: Props) => {
  const all = days.flatMap((d) => d.items)
  const [index, setIndex] = useState<number | null>(null)
  const open = index !== null ? all[index] : null

  return (
    <>
      {days.map((d) => (
        <section key={d.day} className="gallery__day">
          <h2>{formatDay(d.day)}</h2>
          {d.places.length > 0 && <p className="gallery__places">{d.places.join(' · ')}</p>}
          <div className="gallery__grid">
            {d.items.map((item) => (
              <button key={item.id} type="button" className="gallery__thumb" onClick={() => setIndex(all.indexOf(item))}>
                {item.kind === 'video' ? (
                  <>
                    <video src={item.url} preload="metadata" muted playsInline />
                    <IonIcon icon={playCircle} className="gallery__play" />
                  </>
                ) : (
                  <img src={item.url} alt="" loading="lazy" />
                )}
              </button>
            ))}
          </div>
        </section>
      ))}

      <IonModal isOpen={open !== null} onDidDismiss={() => setIndex(null)} className="story-modal">
        {open && (
          <div className="gallery-view">
            {open.kind === 'video' ? (
              <video src={open.url} controls autoPlay playsInline />
            ) : (
              <img src={open.url} alt="" />
            )}
            <div className="gallery-view__bar">
              <IonButton fill="clear" color="light" aria-label="Schliessen" onClick={() => setIndex(null)}>
                <IonIcon slot="icon-only" icon={close} />
              </IonButton>
              <span>
                {index! + 1} / {all.length}
              </span>
              <span className="gallery-view__actions">
                <IonButton fill="clear" color="light" href={open.download_url} aria-label="Herunterladen">
                  <IonIcon slot="icon-only" icon={downloadOutline} />
                </IonButton>
                {onDelete && (
                  <IonButton
                    fill="clear"
                    color="light"
                    aria-label="Löschen"
                    onClick={() => {
                      setIndex(null)
                      onDelete(open)
                    }}
                  >
                    <IonIcon slot="icon-only" icon={trashOutline} />
                  </IonButton>
                )}
              </span>
            </div>
            {index! > 0 && (
              <button type="button" className="gallery-view__nav gallery-view__nav--prev" onClick={() => setIndex(index! - 1)} aria-label="Zurück">
                <IonIcon icon={chevronBack} />
              </button>
            )}
            {index! < all.length - 1 && (
              <button type="button" className="gallery-view__nav gallery-view__nav--next" onClick={() => setIndex(index! + 1)} aria-label="Weiter">
                <IonIcon icon={chevronForward} />
              </button>
            )}
          </div>
        )}
      </IonModal>
    </>
  )
}

export default GalleryGrid
