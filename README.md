# Little Footnotes

**Bewusst reisen. Momente teilen mit denen, die euch wichtig sind.**

Little Footnotes ist ein Open-Source-Reisetagebuch als Progressive Web App (PWA). Reisende halten unterwegs mit wenigen Tipps fest, wo sie sind und was sie erleben. Familie und Freunde lesen per Secret Link mit – im Browser, ohne App und ohne Konto. Es gibt keine Likes, keine Followerzahlen und keinen Algorithmus.

Live: **https://littlefootnotes.app**

## Funktionen

**Für Reisende (mit Konto, Anmeldung per E-Mail-Link)**

- **Beitrag:** eine einzige Art, Inhalte zu erfassen – Titel (optional, sonst der Ort), Text, Fotos/Videos, Links, Ort und Zeitpunkt. Der Ort kommt automatisch per GPS oder aus den Fotodaten und lässt sich per Suche oder Pin ändern; die Uhrzeit wählt man in 5-Minuten-Schritten. Fotos, Videos und Audio lassen sich beim Erfassen und Bearbeiten über den Griff rechts in die gewünschte Reihenfolge ziehen.
- **Newsletter-Abos sehen:** Im Reise-Editor (Reisen › Reise antippen) stehen alle Abonnent:innen mit Name, E-Mail, Häufigkeit und Status; einzelne lassen sich entfernen. Ältere, nie bestätigte Anmeldungen erscheinen als «E-Mail nicht bestätigt».
- **Links:** Beiträge können mehrere Links haben (Unterkunft, Museum, Google-Maps-Ort, Instagram-Profil …). Angezeigt wird nie die ganze Adresse, sondern ein Symbol, darunter der Dienst: bei Google Maps der Ortsname, bei Airbnb/Booking die Unterkunft (z. B. «Apartment · Kerikeri»), bei Instagram «@profil», sonst der Seitentitel. Titel liest die Edge Function `link-title` beim Speichern; ältere Links ohne Titel ergänzt die App einmalig im Hintergrund.
- **Mit Claude schreiben:** Im Beitrags-Dialog machen ein paar Stichworte und/oder Fotos auf Knopfdruck einen ausformulierten Entwurf (Titel + Text, Schweizer Rechtschreibung, Stil der bisherigen Beiträge). Der Entwurf lässt sich anpassen oder rückgängig machen; gespeichert wird erst beim Posten.
- **Mit Claude überarbeiten:** Steht schon Text im Beitrag, öffnet der Claude-Knopf eine Auswahl: Korrekturlesen, Kürzen, Länger, Umformulieren (mit eigenem Änderungswunsch) oder aus Stichworten neu schreiben.
- **Einwilligung:** Beim ersten Gebrauch erklärt ein Dialog, welche Daten an Anthropic gehen; erst nach «Ja, aktivieren» wird `profiles.ai_enabled_at` gesetzt (auch serverseitig geprüft). Ein- und ausschalten unter Reisen › Dein Profil.
- **Rückblick mit Claude:** im Claude-Menü eines leeren Beitrags. Claude fasst alle Beiträge seit dem letzten Rückblick (höchstens 14 Tage) (Orte, Texte, bis zu vier Fotos) zu einer Vorlage zusammen; sie öffnet sich als normaler Beitrag zum Bearbeiten und lässt sich danach nochmals mit Claude überarbeiten.
- **Ort und Zeit frei wählbar:** Beiträge lassen sich rückwirkend erfassen; Ort und Aufnahmezeit werden wenn möglich aus den Foto-Metadaten (EXIF) übernommen. Beiträge sind nachträglich bearbeitbar.
- **Feed mit Zeitleiste:** einheitliche Karten (Bild oben, Titel, Ort, Metazeile). Im Kopf eine Zeitleiste mit **einem Punkt pro Tag** (erstes Foto des Tages, Zähler bei mehreren Beiträgen); fehlende Tage erscheinen als gestrichelter Punkt mit «+» zum Nachtragen. Feed und Zeitleiste scrollen synchron.
- **Karte:** Route aller Orte (MapLibre + OpenFreeMap), Fotos als Marker, Tipp auf einen Ort öffnet ein Sheet mit allen Beiträgen von dort. Routenbilder werden automatisch erzeugt.
- **Galerie** aller Fotos der Reise.
- **Teilen:** über die Share-API (z. B. WhatsApp) mit Einleitung «Wir sind heute hier.» bzw. «Wir haben ein Update für euch». Wahlweise mit dem Link zur ganzen Reise oder mit einem **eigenen Secret Link nur für diesen Beitrag**. Beitrags-Links lassen sich sperren.
- **Bild für Instagram:** Der Teilen-Knopf am Beitrag erzeugt ein Bild im Stil der Startseite (Sand, Serif, Mint) mit Reisetag, Datum und Ort – als Story (1080 × 1920) oder Feed-Beitrag (1080 × 1350), in sechs Farbdesigns («Foto»: Farbverlauf aus dem gewählten Foto, dazu Sand, Nacht, Mint, Terrakotta, Salbei; die Wahl merkt sich das Gerät) und mit wählbarem Symbol oben rechts in vier Gruppen: Unterwegs (Sonne, Mond, Palme, Camper, Zelt …), Tiere (Elefant, Giraffe, Löwe, Wal, Pinguin …), Aktivitäten (Skifahren, Biken, Wandern, Surfen, Tennis …) und Essen & Trinken (Fleisch, Fisch, Pommes, Drink, Bier, Wein …) – oder keines. Ein Teil der Symbole stammt aus Tabler Icons (MIT). Bei mehreren Fotos wählt man das Motiv. Das Bild entsteht im Browser und geht über das Teilen-Menü an Instagram (ohne Teilen-Menü: Download).
- **Aktionen am Beitrag:** zwei kleine FAB-Knöpfe an der unteren Bildkante – Teilen (Link oder Instagram-Bild) und «…» (Bearbeiten, Beitrags-Links sperren, Löschen).
- **Mitreisende** per Einladung.
- **PWA:** installierbar auf dem Home-Bildschirm, offline nutzbar (zuletzt geladene Beiträge, Fotos, Kartenkacheln), Hinweis bei neuen Versionen.

**Für Familie und Freunde (ohne Konto)**

- Ein Link `/t/<token>` öffnet das Tagebuch; die Route kommt über den Karten-Knopf oben rechts, zurück geht es mit «‹ Tagebuch» (keine separate Fotogalerie); ein Beitrags-Link `/p/<token>` zeigt nur diesen einen Beitrag.
- Tipp auf einen Ort springt auf der Karte genau dorthin.
- Kein Download-Knopf für Fotos.
- **In der Nähe entdecken:** Kompass oben links im Feed. Rund um den Standort (sonst den letzten Ort der Reise) drei Reiter: «Reisende» (Links aus Beiträgen anderer Reisen – ohne Namen, Texte oder Fotos, Ort auf ~1 km gerundet, frühestens 24 h später; pro Reise abschaltbar unter Reise bearbeiten › «Links als Tipps teilen»), «Wikipedia» und «Orte» (OpenStreetMap). Umkreis 5–50 km.
- **Erinnerung bei Funkstille:** Kommt bei einer laufenden Reise 3 Tage lang kein Beitrag, bekommen die Besitzer:innen eine Mail «Bist du noch da?». Höchstens eine pro Pause; unter Reise bearbeiten › Erinnerung auf 2, 3, 5 oder 7 Tage stellen oder ausschalten.
- **Newsletter mit eigenem Konto:** Unten im Reise-Link «Updates per E-Mail»: Häufigkeit wählen (bei jedem Beitrag oder wöchentlich), E-Mail eingeben. Supabase schickt einen Bestätigungs-Link; damit ist das Konto angelegt und das Abo aktiv. Unter `/abos` («Meine Abos») verwaltet man alle abonnierten Reisen (Häufigkeit, Pausieren, Beenden) und seinen Namen. Ein Konto kann mehrere Reisen abonnieren und später auch eigene anlegen.

**Produktseite (`/`)**

- App-Icon und Favicon: der Camper aus der Ladeanimation (`public/icon.svg`, `icon-maskable.svg`, `favicon.svg`, daraus die PNGs).
- Positionierung als Open-Source-Reisetagebuch für bewusstes Reisen, Boho-/Travel-Design.
- Sprachen Deutsch, Englisch, Französisch, Spanisch; helles und dunkles Design (Wahl wird im Browser gespeichert); Kopfzeile bleibt beim Scrollen oben.
- Echte App-Bilder einer Demo-Reise Zürich → Dubai → Auckland → Wellington.
- Angemeldete sehen die Startseite ebenfalls, mit «Zur App».
- Die App selbst ist derzeit nur auf Deutsch.

## Preise

| | Private Reise | Öffentliche Reise |
| --- | --- | --- |
| Preis | kostenlos | Abo, **bald verfügbar** |
| Sichtbar für | wer den Secret Link hat | alle, ohne Secret Link |
| Status | umgesetzt | noch nicht gebaut – Interessierte tragen sich auf der Startseite in eine Warteliste ein |

Follower zahlen nie.

## Tech-Stack

| Bereich | Technologie |
| --- | --- |
| Web-App | Ionic React 9 (iOS-Modus), React Router 6, TypeScript, Vite |
| PWA | vite-plugin-pwa (Workbox, `registerType: 'prompt'`) |
| Backend | Supabase: Postgres + PostGIS, Auth, Storage, Edge Functions – Region Zürich (eu-central-2) |
| Karten | MapLibre GL, OpenFreeMap, Nominatim (Suche und Ortsnamen) |
| KI-Entwürfe | Claude (Anthropic API) über die Edge Function `ai-draft` |
| E-Mail | Supabase Auth über SMTP von Infomaniak (`team@littlefootnotes.app`) |
| Hosting | GitHub Pages mit eigener Domain, Deploy über GitHub Actions |
| iOS (vorbereitet) | Capacitor, `@capacitor/geolocation` |

## Lokal starten

```bash
npm install
cp .env.example .env.local   # Supabase-URL und Publishable Key
npm run dev                  # http://localhost:5173
BASE_PATH=/ npm run build    # Produktions-Build inkl. Service Worker
BASE_PATH=/ npx vite preview --port 4173
```

Ins Frontend gehört nur der **Publishable Key**. Der Secret Key (`sb_secret_…`) wird nie eingecheckt.

## Projektstruktur

```
src/
  App.tsx                Routen: Startseite, /login, /impressum, /datenschutz, /t/, /p/, /g/ und Tabs (feed, karte, galerie, reise)
  pages/                 LandingPage (+ landingI18n.ts), FeedPage, MapPage, GalleryPage, TripSettingsPage,
                         FollowerPage (/t/), SharedPostPage (/p/), PublicGalleryPage (/g/, alt), LegalPage, LoginPage
  components/            PostCard, ComposeModal, LocationPicker, DateTimeSheet, LocationSheet,
                         RouteMap, TimelineDots, GalleryGrid, PageSpinner (Camper-Ladeanimation), UpdateBanner …
  lib/                   updates.ts (Beiträge, Medien, Links), share.ts, follower.ts, map.ts, geo.ts, offline.ts,
                         pwaUpdate.ts, location.ts, waitlist.ts …
  theme/variables.css    Farben (Mint #11a683 / dunkel #5ee0b5)
public/screens/          App-Bilder für die Startseite (390 × 844, WebP)
supabase/migrations/     Datenbankschema mit Row-Level-Security
supabase/functions/follower-api/   Zugriff für Follower ohne Konto
supabase/functions/ai-draft/       Beitragsentwürfe mit Claude
```

## Datenbank und Server

- Supabase-Projekt `fmafhdivuooqfixoozmi`. Alle Migrationen in `supabase/migrations/` sind eingespielt.
- Reisende greifen mit ihrem Konto über RLS zu. Follower haben kein Konto: Sie lesen nur über die Edge Function `follower-api`, die den Secret Link prüft (`verify_jwt = false`).
- `share_links.role`: `follower` (ganze Reise), `post` (ein Beitrag), `gallery` (alt).
- Fotos liegen im privaten Bucket `media` (`<trip_id>/<uuid>.jpg` plus `_thumb.jpg`), ausgeliefert über signierte URLs.
- Newsletter: Tabelle `trip_subscriptions` (Konto ↔ Reise, `frequency` instant/weekly, `status`), RPCs `subscribe_trip` (nur mit gültigem Follower-Link), `my_subscriptions`, `trip_subscribers` (nur Reise-Mitglieder). Versand durch die Edge Function `newsletter` alle 15 Minuten (pg_cron + pg_net, Geheimnis im Vault `newsletter_cron_secret`), SMTP über Infomaniak mit dem Secret `SMTP_PASS`. Layout der Mail wie die Startseite. Abmelden ohne Login über `/abmelden/<token>`.
- `link-title`: liest beim Speichern den Titel verlinkter Seiten (JWT-Prüfung aktiv, keine privaten Adressen/IPs); gespeichert in `post_blocks.text_content` des Link-Bausteins.
- `ai-draft`: Edge Function für Entwürfe mit Claude (JWT-Prüfung aktiv, nur Mitglieder der Reise). Secret `ANTHROPIC_API_KEY`, optional `AI_MODEL` (Standard `claude-sonnet-5-5`) und `AI_DAILY_LIMIT` (Standard 40 pro Person und Tag, gezählt in `ai_usage`).
- `waitlist`: Warteliste für öffentliche Reisen – `anon` darf nur einfügen, lesen nur mit dem Service-Role-Key.

## Deploy

Jeder Push auf `main` baut und veröffentlicht die App über `.github/workflows/deploy-pages.yml` auf GitHub Pages (`littlefootnotes.app`).

## iOS-App: Standort (Capacitor Geolocation)

Nach `npx cap add ios` in `ios/App/App/Info.plist` ergänzen:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Little Footnotes setzt euren aktuellen Ort für Check-ins und Fotos.</string>
```

## Lizenz

BSD 3-Clause, siehe [LICENSE](LICENSE). Made with ❤️ and some ☕️.
