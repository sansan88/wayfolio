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
- Eine Beitragsart: `ComposeModal.tsx` → `createPost()` in `src/lib/updates.ts`, `posts.kind = 'feed'` (Ausnahme: Rückblicke `background`; Entscheidungen `poll` wurden 2026-11-27 ausgebaut, Tabellen bleiben leer bestehen). Titel optional, die Karte zeigt sonst den Ort. Ort automatisch (GPS/Foto-EXIF) oder manuell, Zeitpunkt frei (Rückdatieren, Minuten in 5er-Schritten). Medien per `IonReorderGroup` sortierbar; beim Bearbeiten tauscht `reorderMedia()` nur die Positionen der Medienbausteine (zweistufig wegen `unique (post_id, position)`). Alte `route_update`/`story` wurden migriert (Sicherung in `backup.posts_kind_title_20261125`).
- Zeitleiste: ein Punkt **pro Tag** (`TimelineDots.tsx`), Lücken nur für Besitzer als «+».
- Links: beliebig viele pro Beitrag (`LinksEditor.tsx`, `src/lib/links.ts`). Link-Baustein = `url` + Seitentitel in `text_content` (Edge Function `link-title`). Anzeige über `describeLink()`: bekannte Dienste mit Namen/Symbol, nie die ganze URL.
- Newsletter: Community-Konten abonnieren über den Follower-Link (`NewsletterCard.tsx` → Magic Link → `/abos`, `SubscriptionsPage.tsx`). Tabelle `trip_subscriptions`, Versand `supabase/functions/newsletter` (Cron alle 15 Min., Vorschau mit `{"dryRun": true}` + Header `x-newsletter-secret` aus dem Vault). Admin-Liste im `TripEditorModal`. Mail-Layout = Startseite (Sand, Serif, Mint).
- Teilen: `src/lib/share.ts` – ganze Reise (`/t/<token>`) oder nur ein Beitrag (`/p/<token>`). Instagram-Bild: `src/lib/shareImage.ts` (Canvas, Farben der Startseite) + `ShareImageModal.tsx`; Aktionen am Beitrag als `IonFabButton` in `PostCard.tsx`.
- Produktdokumente: `docs/vision.md`, `docs/requirements.md`, `docs/use_cases.md` + `docs/use_cases/`, `docs/backlog.md`, Konzepte `docs/konzept-*.md`. Bei neuen Funktionen Anforderungen und Use Cases nachführen.
- Routenbilder: `media.variants = {route: true, v: n}`; `ROUTE_IMAGE_VERSION` in `src/lib/geo.ts` erhöhen, um alle neu zu erzeugen.
- Instagram: `src/lib/social.ts` (`@littefootnotes`) – Startseite (Kopfzeile, Schluss, Footer), Impressum, Follower-Ansicht; im Newsletter als Konstante `INSTAGRAM`.
- Startseite `/` ist auch für Angemeldete sichtbar (ausser in der installierten PWA, die startet auf `/feed`).
- Entwürfe mit Claude: Knopf «Mit Claude schreiben» in `ComposeModal.tsx` → `src/lib/aiDraft.ts` → Edge Function `ai-draft` (Prompt dort). Bilder werden im Browser auf 1024 px verkleinert, max. 4. Limit pro Tag über `ai_usage`. Nur mit Einwilligung: `profiles.ai_enabled_at` (Dialog über `useAiConsent().ensure()` in `src/lib/aiConsent.tsx`, die Function prüft es ebenfalls). Mit vorhandenem Text Parameter `action` (`proofread`, `shorten`, `lengthen`, `rewrite` + `instruction`). Modus `recap` («Rückblick der letzten Tage» im Claude-Menü eines leeren Beitrags): fasst Beiträge seit dem letzten Rückblick (`background`, max. 14 Tage) zusammen; gepostet wird er als `background`. Embeds auf `post_blocks` immer mit `post_blocks!post_blocks_post_id_fkey` (zwei Fremdschlüssel zu `posts`).
- Ladeanimation: `PageSpinner.tsx` (Camper auf der Strasse), respektiert `prefers-reduced-motion`. Derselbe Camper (`CamperScene`) zeigt sich beim Ziehen zum Aktualisieren (`CamperRefresher.tsx`) und ist App-Icon und Favicon; PNGs mit `rsvg-convert` aus den SVGs in `public/` erzeugen.

## Regeln

- **Nur den Publishable Key** im Frontend. Secret Key, Service-Role-Key, SMTP-Passwörter und API-Keys (z. B. Claude/Anthropic) nie einchecken, nie ins Frontend – nur als Supabase-Secret für Edge Functions.
- Schemaänderungen immer als Datei in `supabase/migrations/` (Zeitstempel-Präfix) **und** im Projekt einspielen. Jede neue Tabelle mit RLS; danach Advisors prüfen.
- Follower haben kein Konto: kein `anon`-Zugriff auf Reisedaten, alles über `follower-api` mit Secret-Link-Prüfung. Nach Änderungen die Function neu deployen.
- Keine Download-Knöpfe für Fotos in der Follower-Ansicht.
- Echte Reisedaten (Reise «Michelle & Sandro in Aotearoa») nur lesen; Änderungen nur nach Rückfrage. Für Tests das Testkonto verwenden und Testdaten danach löschen.
- Personenfotos aus echten Reisen nicht ohne Zustimmung auf der Produktseite verwenden.
- Produktseite: App-Bilder in `public/screens/` (390 × 844, WebP) immer im festen Seitenverhältnis zeigen, nie verzerren. Sie gehören nicht in den Precache des Service Workers.
- Öffentliche Reisen (Abo) sind **noch nicht gebaut** – auf der Startseite als «Bald verfügbar» mit Warteliste (`waitlist`) kennzeichnen.

## Plugins

`.claude/settings.json` bindet den Marketplace `liitu-ch/liitu-ai-architect-marketplace` ein und aktiviert `ai-architect-core`, `-testing`, `-dev-tools` und `-product` (Slash-Befehle wie `/ai-requirements`, `/ai-playwright-test`, `/ai-commit`, `/ai-product-backlog`).

## Commits und Deploy

- Autor: `Sandro Scalco <sandro.scalco@liitu.ch>`. Push auf `main` deployt automatisch über GitHub Actions auf `littlefootnotes.app`; danach prüfen, dass das neue Bundle live ist.
