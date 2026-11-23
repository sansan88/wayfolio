import { IonContent, IonIcon, IonPage } from '@ionic/react'
import {
  bookOutline,
  ellipsisHorizontalCircleOutline,
  heartOutline,
  linkOutline,
  locationOutline,
  lockClosedOutline,
  logoWhatsapp,
  mapOutline,
} from 'ionicons/icons'

import { LegalFooter } from './LegalPage'
import './LandingPage.css'

const base = import.meta.env.BASE_URL
const goLogin = () => window.location.assign(`${base}login`)

const features = [
  { icon: locationOutline, title: 'Check-in mit Fotos', text: '«Wir sind heute hier»: Ort per GPS oder Pin, ein paar Fotos, ein Satz dazu – fertig. Wie ein Instagram-Post, nur privat.' },
  { icon: bookOutline, title: 'Beiträge', text: 'Für längere Geschichten: Text mit Fotos, Ort und Datum – auch nachträglich für vergangene Tage.' },
  { icon: mapOutline, title: 'Route und Karte', text: 'Jeder Ort landet auf der Karte, mit Kartenausschnitt nah am aktuellen Ort. Ein Tipp auf den Ort zeigt alles von dort.' },
  { icon: ellipsisHorizontalCircleOutline, title: 'Die Reise als Zeitleiste', text: 'Ein Punkt pro Tag und Update – mit Foto. Beim Scrollen läuft die Zeitleiste mit.' },
  { icon: logoWhatsapp, title: 'In WhatsApp teilen', text: 'Ein Update direkt in eure Familien- oder Freundesgruppe schicken, mit Foto und Link zum Beitrag.' },
  { icon: lockClosedOutline, title: 'Privat und offline', text: 'Nur wer euren Link hat, sieht mit. Als App auf dem Home-Bildschirm, die letzten Beiträge auch ohne Netz.' },
]

const steps = [
  { n: '1', title: 'Reise anlegen', text: 'Konto per E-Mail, Reise benennen – fertig.' },
  { n: '2', title: 'Unterwegs einchecken', text: 'Ein Tipp auf «+»: Check-in mit Fotos oder ein Beitrag. Ort und Zeit sind schon drin.' },
  { n: '3', title: 'Link teilen', text: 'Ein Link für Tagebuch, Karte und Fotos. Familie und Freunde öffnen ihn im Browser – ohne App und Konto.' },
]

const plans = [
  { name: 'Free', price: 'CHF 0', note: 'für immer', items: ['1 aktive Reise', 'Check-ins, Fotos, Beiträge', 'bis 25 Follower', 'Teilen in WhatsApp'], cta: 'Kostenlos starten', primary: false },
  { name: 'Plus', price: 'CHF 6.90', note: 'pro Monat · CHF 59 pro Jahr', items: ['Unbegrenzte Reisen und Follower', 'Routenbilder und Galerie', 'Fotos in voller Grösse herunterladen', 'Mitreisende'], cta: 'Bald verfügbar', primary: true },
  { name: 'Reise-Pass', price: 'CHF 19', note: 'einmalig für 3 Monate', items: ['Plus für eine Reise', 'Ohne Abo', 'Ideal fürs Sabbatical'], cta: 'Bald verfügbar', primary: false },
]

const faqs = [
  { q: 'Brauchen meine Follower eine App?', a: 'Nein. Sie öffnen euren Link im Browser – auf Handy, Tablet oder Computer – und können ihn auf den Home-Bildschirm legen.' },
  { q: 'Wer kann unsere Reise sehen?', a: 'Nur wer euren Secret Link hat. Er ist nicht auffindbar, und ihr könnt ihn jederzeit durch einen neuen ersetzen.' },
  { q: 'Funktioniert das ohne Netz?', a: 'Little Footnotes läuft als App auf dem Home-Bildschirm und zeigt die zuletzt geladenen Beiträge, Fotos und Karten auch offline. Eine iOS-App ist in Planung.' },
  { q: 'Wo liegen unsere Daten?', a: 'Datenbank und Fotos liegen in einem Rechenzentrum in Zürich. Fotos werden vor dem Hochladen fürs Handy verkleinert.' },
]

/** Handy-Ansicht als Illustration: Zeitleiste mit Punkten und Beiträgen. */
const PhoneMock = () => (
  <div className="lp-phone" aria-hidden="true">
    <div className="lp-phone__bar">Vietnam mit dem Camper</div>
    <div className="lp-phone__stories">
      {['Tag 12', 'Tag 11', 'Tag 10', 'Tag 9'].map((s, i) => (
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
      <div className="lp-card__title">Hoi An</div>
      <div className="lp-card__meta">📍 Vietnam · Check-in · Tag 12</div>
    </div>
    <div className="lp-card">
      <div className="lp-card__kind">Beitrag · Tag 11</div>
      <div className="lp-card__title">Laternenfest am Fluss</div>
      <div className="lp-card__meta">Hunderte Lichter auf dem Wasser – und wir mittendrin mit unserem Camper.</div>
    </div>
  </div>
)

const LandingPage = () => (
  <IonPage>
    <IonContent>
      <div className="lp">
        <header className="lp-nav">
          <span className="lp-logo">Little Footnotes</span>
          <button type="button" className="lp-btn lp-btn--ghost" onClick={goLogin}>
            Anmelden
          </button>
        </header>

        <section className="lp-hero">
          <div className="lp-hero__text">
            <p className="lp-eyebrow">Travel journal for your people</p>
            <h1>Nehmt eure Liebsten mit auf die Reise.</h1>
            <p className="lp-lead">
              Kleine Fussnoten eurer Reise: Check-ins mit Fotos, Beiträge und eure Route auf der Karte. Familie und
              Freunde folgen per Link – ohne App und ohne Konto.
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
                <IonIcon icon={mapOutline} /> Route auf der Karte
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
            «Nähe statt Lärm: Eure Liebsten sind jeden Tag ein Stück dabei – ohne Gruppenchat, der eure Reise übertönt.»
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
