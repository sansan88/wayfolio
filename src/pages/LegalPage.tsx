import { IonContent, IonPage } from '@ionic/react'

import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '../lib/social'
import { savedTheme } from './landingI18n'
import './LandingPage.css'
import './LegalPage.css'

const CONTACT = 'team@littlefootnotes.app'
const STAND = '25. November 2026'
const home = import.meta.env.BASE_URL

const Impressum = () => (
  <>
    <h1>Impressum</h1>
    <h2>Verantwortlich</h2>
    <p>
      Sandro
      <br />
      Neuseeland
      <br />
      E-Mail: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
      <br />
      Instagram: <a href={INSTAGRAM_URL}>@{INSTAGRAM_HANDLE}</a>
    </p>
    <p>Little Footnotes ist ein privates Projekt und wird nicht von einem Unternehmen betrieben.</p>

    <h2>Haftung für Inhalte</h2>
    <p>
      Die Inhalte der Reisetagebücher stammen von den jeweiligen Reisenden und ihren Followern. Für diese Inhalte
      sind die Personen verantwortlich, die sie veröffentlichen. Hinweise auf rechtswidrige Inhalte nehmen wir unter
      der oben genannten Adresse entgegen und entfernen solche Inhalte nach Prüfung.
    </p>

    <h2>Haftung für Links</h2>
    <p>
      Beiträge können Links zu externen Websites enthalten. Auf deren Inhalte haben wir keinen Einfluss; dafür ist
      der jeweilige Anbieter verantwortlich.
    </p>

    <h2>Karten</h2>
    <p>
      Kartendaten © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap-Mitwirkende</a> (ODbL),
      Kartenkacheln von <a href="https://openfreemap.org">OpenFreeMap</a>, Darstellung mit MapLibre.
    </p>

    <h2>Urheberrecht</h2>
    <p>
      © {new Date().getFullYear()} Sandro Scalco. Der Quellcode von Little Footnotes ist Open Source unter der{' '}
      <a href="https://github.com/sansan88/wayfolio/blob/main/LICENSE">BSD-3-Clause-Lizenz</a>. Fotos und Texte in
      den Reisetagebüchern gehören den jeweiligen Reisenden und dürfen nicht ohne deren Zustimmung weiterverwendet
      werden.
    </p>
    <p className="legal-love">
      Made with <span aria-label="Liebe">❤️</span> and some <span aria-label="Kaffee">☕️</span>
    </p>
  </>
)

const Datenschutz = () => (
  <>
    <h1>Datenschutzerklärung</h1>
    <p className="legal-stand">Stand: {STAND}</p>
    <p>
      Diese Erklärung beschreibt, welche Personendaten Little Footnotes bearbeitet, wozu und wo sie gespeichert werden. Sie
      richtet sich nach dem neuseeländischen Privacy Act 2020 und berücksichtigt das Schweizer Datenschutzgesetz
      (DSG) sowie die Datenschutz-Grundverordnung der EU (DSGVO), soweit sie auf Nutzende in der Schweiz und der EU
      anwendbar sind.
    </p>

    <h2>1. Verantwortlicher</h2>
    <p>
      Sandro, Neuseeland – <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
    </p>

    <h2>2. Welche Daten wir bearbeiten</h2>
    <h3>Reisende mit Konto</h3>
    <ul>
      <li>E-Mail-Adresse und Anzeigename (für Anmeldung per E-Mail-Link und zur Kennzeichnung von Beiträgen)</li>
      <li>Reisen und Beiträge: Texte, Fotos, Videos, Sprachnachrichten, Links, Abstimmungen</li>
      <li>Standorte (Koordinaten, Ortsname, Zeitpunkt), die ihr bei einem Update bewusst erfasst</li>
      <li>Antworten auf Beiträge eurer Follower</li>
    </ul>
    <h3>Follower ohne Konto</h3>
    <ul>
      <li>Selbst gewählter Anzeigename</li>
      <li>
        Ein zufälliges Geräte-Kennzeichen, das im Browser gespeichert wird; auf dem Server liegt davon nur ein
        nicht umkehrbarer Hashwert
      </li>
      <li>Reaktionen, Antworten und Stimmen bei Abstimmungen</li>
    </ul>
    <h3>Newsletter-Abos (Community-Konto)</h3>
    <ul>
      <li>
        E-Mail-Adresse, freiwillig ein Name, abonnierte Reisen, gewünschte Häufigkeit (bei jedem Beitrag oder
        wöchentlich), Pausen und Versandzeitpunkte. Die Adresse wird per Link bestätigt (Double-Opt-in); erst danach
        verschicken wir Mails.
      </li>
      <li>
        Die Reisenden einer Reise sehen Name, E-Mail-Adresse, Häufigkeit und Status ihrer Abonnent:innen und können
        einzelne Abos entfernen.
      </li>
      <li>
        Abmelden geht jederzeit über den Link in jeder Mail oder unter «Meine Abos». Fotos in den Mails sind über
        zeitlich begrenzte Links (30 Tage) eingebunden.
      </li>
    </ul>
    <h3>Warteliste für öffentliche Reisen</h3>
    <ul>
      <li>
        Freiwillig: E-Mail-Adresse, um euch einmalig zu informieren, sobald öffentliche Reisen verfügbar sind. Ein
        Mail an {CONTACT} genügt, und wir löschen den Eintrag.
      </li>
    </ul>
    <h3>Technische Daten</h3>
    <p>
      Beim Aufruf der Seiten verarbeiten die unten genannten Dienstleister technisch notwendige Daten wie IP-Adresse,
      Zeitpunkt und Browsertyp, um die Seiten auszuliefern und Missbrauch abzuwehren.
    </p>

    <h2>3. Zweck und Rechtsgrundlage</h2>
    <p>
      Wir bearbeiten die Daten, um das Reisetagebuch bereitzustellen: Inhalte speichern, sie über den geheimen Link
      mit Familie und Freunden teilen, Reaktionen und Abstimmungen ermöglichen und – falls gewünscht – Updates per
      E-Mail versenden. Soweit die DSGVO gilt, stützen wir uns auf die Bereitstellung des gewünschten Dienstes (Art. 6
      Abs. 1 lit. b), für den Newsletter auf eure Einwilligung (lit. a) und für die technische Sicherheit auf unser
      berechtigtes Interesse (lit. f).
    </p>

    <h2>4. Sichtbarkeit</h2>
    <p>
      Reisen sind nicht öffentlich auffindbar. Inhalte sieht nur, wer den geheimen Reise-Link hat – ein Link für
      Tagebuch, Karte und Fotos (ansehen und herunterladen). Die Reisenden können den Link jederzeit sperren und
      ersetzen und Standorte für Follower zeitverzögert anzeigen lassen. Fotos werden vor dem Hochladen verkleinert;
      dabei werden die eingebetteten Metadaten aus der Datei entfernt. Aufnahmezeit und Aufnahmeort werden vorher
      gelesen und nur zur Einordnung in Galerie und Karte gespeichert.
    </p>

    <h2>5. Dienstleister und Speicherort</h2>
    <ul>
      <li>
        <strong>Supabase</strong> (Supabase Inc., USA): Datenbank, Anmeldung, Dateispeicher und Server-Funktionen.
        Die Daten liegen im Rechenzentrum in Zürich (AWS-Region eu-central-2).
      </li>
      <li>
        <strong>GitHub Pages</strong> (GitHub Inc., USA): Auslieferung der Web-App. Dabei werden technische
        Zugriffsdaten verarbeitet; Inhalte eurer Reisen werden dort nicht gespeichert.
      </li>
      <li>
        <strong>Anthropic</strong> (Anthropic PBC, USA): Nur wenn Reisende «Mit Claude schreiben» antippen, gehen
        ihre Stichworte, Ort, Datum, bis zu vier verkleinerte Fotos und Ausschnitte früherer Beiträge an das
        Sprachmodell Claude, um einen Textentwurf zu erstellen. Anthropic verwendet diese Daten gemäss seinen
        kommerziellen Bedingungen nicht zum Training. Der Entwurf wird erst gespeichert, wenn die Reisenden ihn posten. Die Funktion ist erst nach ausdrücklicher Zustimmung aktiv (Zeitpunkt wird im Profil gespeichert) und lässt sich in den Einstellungen jederzeit ausschalten.
      </li>
      <li>
        <strong>OpenStreetMap Nominatim</strong> (OpenStreetMap Foundation, Vereinigtes Königreich): Beim Erfassen
        eines Standorts sendet der Browser der Reisenden die Koordinaten, um den Ortsnamen zu ermitteln.
      </li>
      <li>
        <strong>OpenFreeMap</strong>: Auslieferung der Kartenkacheln; dabei wird die IP-Adresse übermittelt.
      </li>
      <li>
        <strong>Infomaniak</strong> (Infomaniak Network SA, Schweiz): Domain littlefootnotes.app, E-Mail-Postfach und
        Versand der Anmelde-E-Mails und des Newsletters.
      </li>
    </ul>
    <p>
      Der Betreiber lebt in Neuseeland und greift für Betrieb und Support von dort auf die Daten zu. Neuseeland ist
      von der Schweiz und der EU als Land mit angemessenem Datenschutz anerkannt. Einige Dienstleister haben ihren
      Sitz in den USA oder im Vereinigten Königreich. Eine Bekanntgabe dorthin erfolgt nur, soweit sie für den
      Betrieb nötig ist, gestützt auf Angemessenheitsbeschlüsse bzw. die Standardvertragsklauseln der Dienstleister.
    </p>

    <h2>6. Cookies und lokale Speicherung</h2>
    <p>
      Little Footnotes verwendet keine Tracking- oder Werbe-Cookies und keine Analysedienste. Im Browser gespeichert werden
      nur die Anmeldesitzung, das Geräte-Kennzeichen für Follower und die zuletzt gewählte Reise.
    </p>

    <h2>7. Aufbewahrung</h2>
    <p>
      Inhalte bleiben gespeichert, bis die Reisenden sie oder die ganze Reise löschen. Beim Löschen eines Kontos
      werden die zugehörigen Reisen samt Beiträgen, Reaktionen und Follower-Daten gelöscht. Newsletter-Anmeldungen
      enden mit der Abmeldung.
    </p>

    <h2>8. Eure Rechte</h2>
    <p>
      Ihr könnt Auskunft über eure Daten verlangen, sie berichtigen oder löschen lassen, eine Einwilligung widerrufen
      und – soweit anwendbar – die Herausgabe eurer Daten verlangen. Schreibt dazu an{' '}
      <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. Ihr habt zudem das Recht, euch beim neuseeländischen Office of the
      Privacy Commissioner, beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) oder bei einer
      zuständigen Aufsichtsbehörde in der EU zu beschweren.
    </p>

    <h2>9. Änderungen</h2>
    <p>
      Wir passen diese Erklärung an, wenn sich Funktionen oder Dienstleister ändern, etwa beim Start von E-Mail-Versand
      oder Bezahl-Abos. Es gilt die jeweils hier veröffentlichte Fassung.
    </p>
  </>
)

/** Gleiches Design wie auf der Startseite: gespeicherte Wahl, sonst Systemeinstellung. */
const pageTheme = () =>
  savedTheme() ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

/** Impressum und Datenschutzerklärung – ohne Anmeldung erreichbar. */
const LegalPage = ({ page }: { page: 'impressum' | 'datenschutz' }) => (
  <IonPage>
    <IonContent>
      <div className="lp" data-theme={pageTheme()}>
        <header className="lp-nav">
          <div className="lp-nav__inner">
            <a className="lp-logo legal-home" href={home}>
              Little Footnotes
            </a>
          </div>
        </header>
        <article className="legal">{page === 'impressum' ? <Impressum /> : <Datenschutz />}</article>
        <LegalFooter />
      </div>
    </IonContent>
  </IonPage>
)

export const LegalFooter = () => (
  <footer className="lp-footer">
    <span className="lp-footer__made">
      <span>© {new Date().getFullYear()} Little Footnotes · Sandro Scalco</span>
      <span>
        Made with <span aria-label="Liebe">❤️</span> and some <span aria-label="Kaffee">☕️</span>
      </span>
    </span>
    <span className="legal-links">
      <a href="https://github.com/sansan88/wayfolio" target="_blank" rel="noreferrer">
        Quellcode
      </a>
      <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
        Instagram
      </a>
      <a href={`${home}impressum`}>Impressum</a>
      <a href={`${home}datenschutz`}>Datenschutz</a>
    </span>
  </footer>
)

export default LegalPage
