import { IonContent, IonIcon, IonPage } from '@ionic/react'
import {
  barChart,
  bookOutline,
  chatbubblesOutline,
  heartOutline,
  linkOutline,
  lockClosedOutline,
  mailOutline,
  mapOutline,
  phonePortraitOutline,
} from 'ionicons/icons'

import { LegalFooter } from './LegalPage'
import './LandingPage.css'

const base = import.meta.env.BASE_URL
const goLogin = () => window.location.assign(`${base}login`)

const features = [
  { icon: phonePortraitOutline, title: 'Stories und Beiträge', text: 'Einzelne Fotos, Videos und Sprachnachrichten landen als Story im Kreis. Eure Tagesberichte stehen im Feed.' },
  { icon: mapOutline, title: 'Routenbild automatisch', text: 'Jeder neue Standort setzt einen Pin und erzeugt ein Kartenbild eurer Route – mit Etappe und Kilometern.' },
  { icon: barChart, title: 'Mitentscheiden', text: 'Stellt eure Fragen an die Community, lasst abstimmen und zeigt danach, wofür ihr euch entschieden habt.' },
  { icon: bookOutline, title: 'Hintergrund-Stories', text: 'Für Themen, die mehr Raum brauchen: Visum, Fahrzeug, Kosten, Land und Leute.' },
  { icon: mailOutline, title: 'Updates per E-Mail', text: 'Follower wählen selbst: bei jedem Beitrag, wöchentlich oder monatlich.' },
  { icon: lockClosedOutline, title: 'Privat von Grund auf', text: 'Nur wer euren Link hat, sieht mit. Links lassen sich jederzeit sperren. Daten in der Schweiz.' },
]

const steps = [
  { n: '1', title: 'Reise anlegen', text: 'Konto per E-Mail-Link, Reise benennen – fertig. Kein Passwort.' },
  { n: '2', title: 'Unterwegs tippen', text: 'Foto, Standort, Sprachnachricht: ein Tipp aufs Raster, Ort und Zeit sind schon drin.' },
  { n: '3', title: 'Link teilen', text: 'Familie und Freunde öffnen ihn im Browser, reagieren und stimmen mit ab.' },
]

const plans = [
  { name: 'Free', price: 'CHF 0', note: 'für immer', items: ['1 aktive Reise', 'Fotos, Standorte, Beiträge', 'bis 25 Follower', 'Newsletter wöchentlich'], cta: 'Kostenlos starten', primary: false },
  { name: 'Plus', price: 'CHF 6.90', note: 'pro Monat · CHF 59 pro Jahr', items: ['Unbegrenzte Reisen und Follower', 'Video und Sprachnachrichten', 'Routenbilder und Galerie', 'Alle Newsletter-Frequenzen'], cta: 'Bald verfügbar', primary: true },
  { name: 'Reise-Pass', price: 'CHF 19', note: 'einmalig für 3 Monate', items: ['Plus für eine Reise', 'Ohne Abo', 'Ideal fürs Sabbatical'], cta: 'Bald verfügbar', primary: false },
]

const faqs = [
  { q: 'Brauchen meine Follower eine App?', a: 'Nein. Sie öffnen euren Link im Browser – auf Handy, Tablet oder Computer. Beim ersten Reagieren geben sie nur einen Namen an.' },
  { q: 'Wer kann unsere Reise sehen?', a: 'Nur wer euren Secret Link hat. Er ist nicht auffindbar, und ihr könnt ihn jederzeit durch einen neuen ersetzen.' },
  { q: 'Funktioniert das ohne Netz?', a: 'Wayfolio läuft als Web-App auf dem Home-Bildschirm. Eine iOS-App mit Hintergrund-Funktionen ist in Planung.' },
  { q: 'Wo liegen unsere Daten?', a: 'Datenbank und Fotos liegen in einem Rechenzentrum in Zürich. Fotos werden vor dem Hochladen verkleinert, GPS-Daten aus den Bildern entfernt.' },
]

/** Handy-Ansicht als Illustration: Story-Kreise und Abstimmung nach der Auflösung. */
const PhoneMock = () => (
  <div className="lp-phone" aria-hidden="true">
    <div className="lp-phone__bar">Vietnam mit dem Camper</div>
    <div className="lp-phone__stories">
      {['Heute', 'Hoi An', 'Hué', 'Essen'].map((s, i) => (
        <div key={s} className="lp-story">
          <span className={`lp-story__dot lp-story__dot--${i}`} />
          <span>{s}</span>
        </div>
      ))}
    </div>
    <div className="lp-card lp-card--route">
      <div className="lp-route">
        <svg viewBox="0 0 200 110" preserveAspectRatio="none">
          <path d="M18 20 C 60 30, 80 55, 110 62 S 165 88, 182 92" fill="none" stroke="#1f6feb" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="18" cy="20" r="5" fill="#fff" stroke="#1f6feb" strokeWidth="3" />
          <circle cx="110" cy="62" r="5" fill="#fff" stroke="#1f6feb" strokeWidth="3" />
          <circle cx="182" cy="92" r="8" fill="#1f6feb" />
        </svg>
        <span className="lp-route__caption">Tag 12 · Hué → Hoi An</span>
      </div>
      <div className="lp-card__meta">128 km seit Hué · 1’840 km gesamt</div>
    </div>
    <div className="lp-card">
      <div className="lp-card__kind">Entscheidung</div>
      <div className="lp-card__title">Welches Auto sollen wir kaufen?</div>
      {[
        { label: 'Toyota Hiace', v: 24 },
        { label: 'Ford Transit', v: 62 },
        { label: 'VW T5', v: 14, chosen: true },
      ].map((o) => (
        <div key={o.label} className={`lp-opt${o.chosen ? ' lp-opt--chosen' : ''}`}>
          <span>
            {o.label}
            {o.chosen && <em>Unsere Entscheidung</em>}
          </span>
          <span className="lp-opt__bar">
            <span style={{ width: `${o.v}%` }} />
          </span>
          <small>{o.v} %</small>
        </div>
      ))}
      <div className="lp-reactions">❤️ 12 · 😮 4 · 🙏 2</div>
    </div>
  </div>
)

const LandingPage = () => (
  <IonPage>
    <IonContent>
      <div className="lp">
        <header className="lp-nav">
          <span className="lp-logo">Wayfolio</span>
          <button type="button" className="lp-btn lp-btn--ghost" onClick={goLogin}>
            Anmelden
          </button>
        </header>

        <section className="lp-hero">
          <div className="lp-hero__text">
            <p className="lp-eyebrow">Travel journal for your people</p>
            <h1>Nehmt eure Liebsten mit auf die Reise.</h1>
            <p className="lp-lead">
              Reisetagebuch mit Karte, Stories und Abstimmungen. Familie und Freunde folgen per Link – ohne App und
              ohne Konto.
            </p>
            <div className="lp-cta">
              <button type="button" className="lp-btn lp-btn--primary" onClick={goLogin}>
                Kostenlos starten
              </button>
              <a className="lp-btn lp-btn--ghost" href="#so-gehts">
                So funktioniert’s
              </a>
            </div>
            <ul className="lp-pills">
              <li>
                <IonIcon icon={heartOutline} /> Ein Tipp, ein Update
              </li>
              <li>
                <IonIcon icon={linkOutline} /> Dabei ohne App
              </li>
              <li>
                <IonIcon icon={chatbubblesOutline} /> Mitentscheiden
              </li>
            </ul>
          </div>
          <PhoneMock />
        </section>

        <section className="lp-section" id="so-gehts">
          <h2>So funktioniert’s</h2>
          <div className="lp-steps">
            {steps.map((s) => (
              <div key={s.n} className="lp-step">
                <span className="lp-step__n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-section lp-section--tint">
          <h2>Alles, was eure Reise erzählt</h2>
          <div className="lp-features">
            {features.map((f) => (
              <div key={f.title} className="lp-feature">
                <IonIcon icon={f.icon} />
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-section lp-quote">
          <p>
            «Nähe statt Lärm: Eure Follower reagieren, antworten und stimmen mit ab – aber es gibt keinen Gruppenchat,
            der eure Reise übertönt.»
          </p>
        </section>

        <section className="lp-section" id="preise">
          <h2>Preise</h2>
          <p className="lp-sub">Follower sind immer gratis. Bezahlt wird nur von Reisenden.</p>
          <div className="lp-plans">
            {plans.map((p) => (
              <div key={p.name} className={`lp-plan${p.primary ? ' lp-plan--primary' : ''}`}>
                <h3>{p.name}</h3>
                <p className="lp-plan__price">{p.price}</p>
                <p className="lp-plan__note">{p.note}</p>
                <ul>
                  {p.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`lp-btn ${p.primary ? 'lp-btn--primary' : 'lp-btn--ghost'}`}
                  disabled={p.cta === 'Bald verfügbar'}
                  onClick={goLogin}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-section lp-section--tint">
          <h2>Häufige Fragen</h2>
          <div className="lp-faq">
            {faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="lp-section lp-final">
          <h2>Eure nächste Reise beginnt mit einem Link.</h2>
          <button type="button" className="lp-btn lp-btn--primary" onClick={goLogin}>
            Kostenlos starten
          </button>
        </section>

        <LegalFooter />
      </div>
    </IonContent>
  </IonPage>
)

export default LandingPage
