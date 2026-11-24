# CLAUDE.md – Little Footnotes

Hinweise für Claude (und andere Mitwirkende) zur Arbeit an diesem Repository. Funktionsübersicht: siehe README.md.

## Sprache und Ton

- Antworten an Sandro auf Deutsch, Schweizer Rechtschreibung (kein ß, «Guillemets»).
- App-Texte auf Deutsch, Du/Ihr-Form an die Reisenden («eure Reise»). Die Produktseite gibt es zusätzlich auf EN/FR/ES (`src/pages/landingI18n.ts`); neue Texte dort in allen vier Sprachen ergänzen.
- Rechtstexte (Impressum, Datenschutz in `LegalPage.tsx`) bleiben deutsch. Neue Datenverarbeitungen dort nachtragen und das Datum `STAND` anpassen.

## Befehle

```bash
npm run dev                         # Entwicklung
BASE_PATH=/ npm run build           # Build wie in Produktion (eigene Domain → Base «/»)
BASE_PATH=/ npx vite preview --port 4173
npx tsc -p tsconfig.app.json --noEmit
```

Vor jedem Commit bauen. UI-Änderungen mit Playwright prüfen (Chrome: `/usr/bin/google-chrome --use-angle=swiftshader`, Viewport 390 × 844), hell und dunkel.

## Architektur in Kürze

- Ionic React 9 im iOS-Modus, React Router 6, Vite, vite-plugin-pwa (`registerType: 'prompt'`, Update-Hinweis über `src/lib/pwaUpdate.ts`).
- Supabase (`fmafhdivuooqfixoozmi`, eu-central-2): Postgres/PostGIS mit RLS, privater Bucket `media`, Edge Function `follower-api`.
- Zwei Beitragsarten: **Check-in** (Ort + Fotos + Satz) und **Beitrag** (Text, optional Fotos/Link/Ort). Ort und Zeitpunkt sind pro Beitrag frei setzbar (Rückdatieren).
- Zeitleiste: ein Punkt **pro Tag** (`TimelineDots.tsx`), Lücken nur für Besitzer als «+».
- Teilen: `src/lib/share.ts` – ganze Reise (`/t/<token>`) oder nur ein Beitrag (`/p/<token>`).
- Routenbilder: `media.variants = {route: true, v: n}`; `ROUTE_IMAGE_VERSION` in `src/lib/geo.ts` erhöhen, um alle neu zu erzeugen.
- Startseite `/` ist auch für Angemeldete sichtbar (ausser in der installierten PWA, die startet auf `/feed`).
- Ladeanimation: `PageSpinner.tsx` (Camper auf der Strasse), respektiert `prefers-reduced-motion`.

## Regeln

- **Nur den Publishable Key** im Frontend. Secret Key, Service-Role-Key, SMTP-Passwörter und API-Keys (z. B. Claude/Anthropic) nie einchecken, nie ins Frontend – nur als Supabase-Secret für Edge Functions.
- Schemaänderungen immer als Datei in `supabase/migrations/` (Zeitstempel-Präfix) **und** im Projekt einspielen. Jede neue Tabelle mit RLS; danach Advisors prüfen.
- Follower haben kein Konto: kein `anon`-Zugriff auf Reisedaten, alles über `follower-api` mit Secret-Link-Prüfung. Nach Änderungen die Function neu deployen.
- Keine Download-Knöpfe für Fotos in der Follower-Ansicht.
- Echte Reisedaten (Reise «Michelle & Sandro in Aotearoa») nur lesen; Änderungen nur nach Rückfrage. Für Tests das Testkonto verwenden und Testdaten danach löschen.
- Personenfotos aus echten Reisen nicht ohne Zustimmung auf der Produktseite verwenden.
- Produktseite: App-Bilder in `public/screens/` (390 × 844, WebP) immer im festen Seitenverhältnis zeigen, nie verzerren. Sie gehören nicht in den Precache des Service Workers.
- Öffentliche Reisen (Abo) sind **noch nicht gebaut** – auf der Startseite als «Bald verfügbar» mit Warteliste (`waitlist`) kennzeichnen.

## Commits und Deploy

- Autor: `Sandro Scalco <sandro.scalco@liitu.ch>`. Push auf `main` deployt automatisch über GitHub Actions auf `littlefootnotes.app`; danach prüfen, dass das neue Bundle live ist.
