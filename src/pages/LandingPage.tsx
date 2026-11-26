import { useEffect, useState, type FormEvent } from 'react'
import { IonContent, IonIcon, IonPage } from '@ionic/react'
import {
  bookOutline,
  calendarOutline,
  cloudOfflineOutline,
  imagesOutline,
  locationOutline,
  lockClosedOutline,
  logoGithub,
  logoInstagram,
  logoWhatsapp,
  mapOutline,
  moonOutline,
  sunnyOutline,
} from 'ionicons/icons'

import { joinWaitlist } from '../lib/waitlist'
import { LegalFooter } from './LegalPage'
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '../lib/social'
import {
  initialLang,
  LANGS,
  saveLang,
  savedTheme,
  saveTheme,
  TEXTS,
  type Lang,
  type LandingText,
  type Theme,
} from './landingI18n'
import './LandingPage.css'

const base = import.meta.env.BASE_URL
const REPO = 'https://github.com/sansan88/wayfolio'
const go = (path: string) => window.location.assign(`${base}${path}`)

const featureIcons = [
  locationOutline,
  bookOutline,
  mapOutline,
  calendarOutline,
  imagesOutline,
  logoWhatsapp,
  lockClosedOutline,
  cloudOfflineOutline,
]

/** App-Bilder: Index in shotAlts und shotLabels. */
const screens = [
  { src: 'feed2.webp', alt: 1, label: 0 },
  { src: 'map.webp', alt: 2, label: 1 },
  { src: 'sheet.webp', alt: 3, label: 2 },
  { src: 'checkin.webp', alt: 4, label: 3 },
]

const prefersDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false

/** Handy-Rahmen mit echtem App-Bild im festen Seitenverhältnis 390:844. */
const Phone = ({ src, alt, className = '' }: { src: string; alt: string; className?: string }) => (
  <figure className={`lp-phone ${className}`}>
    <img src={`${base}screens/${src}`} alt={alt} width={390} height={844} loading="lazy" decoding="async" />
  </figure>
)

const Sun = () => (
  <svg className="lp-doodle lp-doodle--sun" viewBox="0 0 120 120" aria-hidden="true">
    <circle cx="60" cy="60" r="22" />
    {Array.from({ length: 12 }, (_, i) => (
      <line key={i} x1="60" y1="8" x2="60" y2="24" transform={`rotate(${i * 30} 60 60)`} />
    ))}
  </svg>
)

const Arch = () => (
  <svg className="lp-doodle lp-doodle--arch" viewBox="0 0 160 120" aria-hidden="true">
    <path d="M10 118 V70 a70 70 0 0 1 140 0 V118" />
    <path d="M34 118 V72 a46 46 0 0 1 92 0 V118" />
    <path d="M58 118 V74 a22 22 0 0 1 44 0 V118" />
  </svg>
)

const Trail = () => (
  <svg className="lp-trail" viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true">
    <path d="M4 40 C 90 4, 150 56, 240 30 S 400 8, 470 34 S 560 50, 596 18" />
  </svg>
)

const Waitlist = ({ t }: { t: LandingText }) => {
  const [email, setEmail] = useState('')
  const [trap, setTrap] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (state === 'busy') return
    if (trap) return setState('done')
    setState('busy')
    try {
      await joinWaitlist(email)
      setState('done')
    } catch {
      setState('error')
    }
  }

  if (state === 'done')
    return (
      <p className="lp-waitlist__done" role="status">
        {t.wlDone}
      </p>
    )

  return (
    <form className="lp-waitlist" onSubmit={submit}>
      <label htmlFor="lp-waitlist-email">{t.wlLabel}</label>
      <div className="lp-waitlist__row">
        <input
          id="lp-waitlist-email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder={t.wlPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="lp-waitlist__trap"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
        />
        <button type="submit" className="lp-btn lp-btn--primary" disabled={state === 'busy'}>
          {state === 'busy' ? t.wlBusy : t.wlSubmit}
        </button>
      </div>
      {state === 'error' ? (
        <p className="lp-waitlist__hint lp-waitlist__hint--error" role="alert">
          {t.wlError}
        </p>
      ) : (
        <p className="lp-waitlist__hint">{t.wlHint}</p>
      )}
    </form>
  )
}

const LandingPage = ({ signedIn = false }: { signedIn?: boolean }) => {
  const [lang, setLang] = useState<Lang>(initialLang)
  const [theme, setTheme] = useState<Theme>(() => savedTheme() ?? (prefersDark() ? 'dark' : 'light'))
  const [scrolled, setScrolled] = useState(false)
  const t = TEXTS[lang]

  useEffect(() => {
    document.documentElement.lang = lang
    return () => {
      document.documentElement.lang = 'de'
    }
  }, [lang])

  const start = () => go(signedIn ? 'feed' : 'login')
  const startLabel = signedIn ? t.toDiary : t.start
  const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'

  const toggleTheme = () => {
    setTheme(nextTheme)
    saveTheme(nextTheme)
  }

  const changeLang = (l: Lang) => {
    setLang(l)
    saveLang(l)
  }

  return (
    <IonPage>
      <IonContent scrollEvents onIonScroll={(e) => setScrolled(e.detail.scrollTop > 12)}>
        <div className="lp" data-theme={theme}>
          <header className={`lp-nav${scrolled ? ' lp-nav--scrolled' : ''}`}>
            <div className="lp-nav__inner">
              <span className="lp-logo">Little Footnotes</span>
              <nav className="lp-nav__links">
                <label className="lp-lang">
                  <span className="lp-sr">{t.langLabel}</span>
                  <select value={lang} onChange={(e) => changeLang(e.target.value as Lang)} aria-label={t.langLabel}>
                    {LANGS.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.code.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="lp-icon-btn"
                  onClick={toggleTheme}
                  aria-label={nextTheme === 'dark' ? t.themeDark : t.themeLight}
                  title={nextTheme === 'dark' ? t.themeDark : t.themeLight}
                >
                  <IonIcon icon={theme === 'dark' ? sunnyOutline : moonOutline} />
                </button>
                <a className="lp-icon-btn lp-hide-xs" href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label={t.instagramAria}>
                  <IonIcon icon={logoInstagram} />
                </a>
                <a className="lp-icon-btn lp-hide-xs" href={REPO} target="_blank" rel="noreferrer" aria-label={t.sourceAria}>
                  <IonIcon icon={logoGithub} />
                </a>
                <button type="button" className="lp-btn lp-btn--ghost lp-btn--small" onClick={start}>
                  {signedIn ? t.toApp : t.signIn}
                </button>
              </nav>
            </div>
          </header>

          <section className="lp-hero">
            <Sun />
            <div className="lp-hero__text">
              <p className="lp-eyebrow">{t.eyebrow}</p>
              <h1>
                {t.h1a}
                <em>{t.h1em}</em>
                {t.h1b}
              </h1>
              <p className="lp-lead">{t.lead}</p>
              <div className="lp-cta">
                <button type="button" className="lp-btn lp-btn--primary" onClick={start}>
                  {startLabel}
                </button>
                <a className="lp-btn lp-btn--ghost" href="#so-gehts">
                  {t.howLink}
                </a>
              </div>
              <ul className="lp-stamps">
                {t.stamps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="lp-hero__phones">
              <Phone src="feed.webp" alt={t.shotAlts[0]} className="lp-phone--back" />
              <Phone src="map.webp" alt={t.shotAlts[2]} className="lp-phone--front" />
              <span className="lp-tag">{t.routeTag}</span>
            </div>
          </section>

          <Trail />

          <section className="lp-section lp-mindful">
            <Arch />
            <h2>{t.mindfulTitle}</h2>
            <p>{t.mindfulText}</p>
          </section>

          <section className="lp-section" id="so-gehts">
            <h2>{t.howTitle}</h2>
            <div className="lp-steps">
              {t.steps.map((s, i) => (
                <div key={s.title} className="lp-step">
                  <span className="lp-step__n">{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="lp-section lp-section--sand">
            <h2>{t.shotsTitle}</h2>
            <p className="lp-sub">{t.shotsSub}</p>
            <div className="lp-gallery">
              {screens.map((s) => (
                <div key={s.src} className="lp-gallery__item">
                  <Phone src={s.src} alt={t.shotAlts[s.alt]} />
                  <span>{t.shotLabels[s.label]}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="lp-section">
            <h2>{t.featuresTitle}</h2>
            <div className="lp-features">
              {t.features.map((f, i) => (
                <div key={f.title} className="lp-feature">
                  <span className="lp-feature__icon">
                    <IonIcon icon={featureIcons[i]} />
                  </span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="lp-section lp-section--sand" id="preise">
            <h2>{t.plansTitle}</h2>
            <p className="lp-sub">{t.plansSub}</p>
            <div className="lp-plans">
              <div className="lp-plan">
                <h3>{t.privTitle}</h3>
                <p className="lp-plan__price">CHF 0</p>
                <p className="lp-plan__note">{t.privNote}</p>
                <ul>
                  {t.privItems.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
                <button type="button" className="lp-btn lp-btn--primary" onClick={start}>
                  {startLabel}
                </button>
              </div>
              <div className="lp-plan lp-plan--soon">
                <span className="lp-badge">{t.soon}</span>
                <h3>{t.pubTitle}</h3>
                <p className="lp-plan__price">{t.pubPrice}</p>
                <p className="lp-plan__note">{t.pubNote}</p>
                <ul>
                  {t.pubItems.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
                <Waitlist t={t} />
              </div>
            </div>
          </section>

          <section className="lp-section lp-oss">
            <IonIcon icon={logoGithub} />
            <h2>{t.ossTitle}</h2>
            <p>{t.ossText}</p>
            <a className="lp-btn lp-btn--ghost" href={REPO} target="_blank" rel="noreferrer">
              {t.ossCta}
            </a>
          </section>

          <section className="lp-section lp-section--sand">
            <h2>{t.faqTitle}</h2>
            <div className="lp-faq">
              {t.faqs.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="lp-section lp-final">
            <Sun />
            <h2>{t.finalTitle}</h2>
            <button type="button" className="lp-btn lp-btn--primary" onClick={start}>
              {startLabel}
            </button>
            <a className="lp-follow" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
              <IonIcon icon={logoInstagram} aria-hidden="true" />
              <span>
                {t.followUs} · @{INSTAGRAM_HANDLE}
              </span>
            </a>
          </section>

          <LegalFooter />
        </div>
      </IonContent>
    </IonPage>
  )
}

export default LandingPage
