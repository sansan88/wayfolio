import { IonContent, IonPage } from '@ionic/react'
import { useEffect, useState } from 'react'

import PageSpinner from '../components/PageSpinner'
import { supabase } from '../lib/supabase'
import { savedTheme } from './landingI18n'
import './LandingPage.css'

const base = import.meta.env.BASE_URL

/** Abmelden per Link aus der Newsletter-Mail – ohne Login. */
const UnsubscribePage = ({ token }: { token: string }) => {
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null)
  const theme = savedTheme() ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

  useEffect(() => {
    void supabase.functions
      .invoke<{ ok?: boolean; trip?: string; error?: string }>('newsletter', { body: { unsubscribe: token } })
      .then(({ data, error }) =>
        setState(
          data?.ok
            ? { ok: true, text: `Du bekommst keine E-Mails mehr zu «${data.trip}».` }
            : { ok: false, text: error ? 'Der Abmelde-Link ist ungültig oder schon verwendet.' : (data?.error ?? 'Das hat nicht geklappt.') },
        ),
      )
  }, [token])

  return (
    <IonPage>
      <IonContent>
        <div className="lp" data-theme={theme}>
          <header className="lp-nav">
            <div className="lp-nav__inner">
              <a className="lp-logo legal-home" href={base}>
                Little Footnotes
              </a>
            </div>
          </header>
          <section className="lp-section lp-final">
            {state === null ? (
              <PageSpinner />
            ) : (
              <>
                <h2>{state.ok ? 'Abgemeldet' : 'Hoppla'}</h2>
                <p style={{ margin: '14px auto 24px', maxWidth: '30rem', color: 'var(--lp-muted)' }}>{state.text}</p>
                <a className="lp-btn lp-btn--primary" href={`${base}abos`}>
                  Meine Abos
                </a>
              </>
            )}
          </section>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default UnsubscribePage
