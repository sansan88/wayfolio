# Wayfolio

**Travel journal for your people.**
Reise teilen. Liebste dabei.

Wayfolio ist ein Reisetagebuch als Progressive Web App (PWA). Reisende erfassen unterwegs mit einem Tipp Fotos, Sprachnachrichten, Videos, Standorte, Beiträge, Hintergrund-Stories und Abstimmungen. Familie und Freunde folgen per Secret Link – ohne App und ohne Account. Sie können reagieren, antworten, abstimmen und einen Newsletter abonnieren (sofort, wöchentlich oder monatlich).

## Kernfunktionen

- **Aktions-Raster:** «Beitrag schreiben» plus Kacheln für Foto, Standort, Entscheidung, Hintergrund-Story, Sprachnachricht und Video-Update
- **Feed & Stories:** Was einzeln gepostet wird, kommt in die Stories; was in einem Beitrag steht, kommt in den Feed. Hintergrund-Stories und Abstimmungen erscheinen in beiden.
- **Karte & Routenbild:** Jeder neue Standort setzt einen Pin und erzeugt automatisch ein Kartenbild der Route (MapTiler oder Mapbox, OpenStreetMap-Daten)
- **Community-Abstimmungen:** Resultat nach der eigenen Stimme, danach «Unsere Entscheidung»
- **Follower ohne Account:** Secret Links, Emoji-Reaktionen, Antworten ohne Gruppenchat
- **Newsletter:** E-Mail mit frei wählbarer Frequenz, WhatsApp Business später
- **Private Fotogalerie:** eigener Link, verknüpft mit Route und Tagebuch

## Geplanter Tech-Stack

| Bereich | Technologie |
| --- | --- |
| Web-App | Ionic React, TypeScript, Vite, PWA |
| Backend | Supabase: Postgres + PostGIS, Auth, Storage, Edge Functions, Realtime |
| Abos | Stripe Billing (Checkout, Kundenportal, Webhooks) |
| Karten | MapLibre, MapTiler oder Mapbox |
| E-Mail | Resend oder Postmark |
| iOS-App (später) | Capacitor (im Ionic-Projekt integriert) |

## Roadmap

- **Phase 0 – Grundgerüst:** Repository, Ionic-React-PWA (Vite, TypeScript), Supabase-Projekt (Region Europa), Datenbankschema mit Row-Level-Security, Anmeldung
- **Phase 1 – MVP als PWA:** Aktions-Raster, Feed & Stories, Karte mit Routenbild, Follower-Seite, Reaktionen, Abstimmungen, Newsletter, Free- und Plus-Plan
- **Phase 2:** Sprachnachrichten mit Transkription, Video, Hintergrund-Stories, Galerie, Gruppen-Links, Reise-Pass
- **Phase 3:** iOS-App, WhatsApp-Zustellung, Co-Autor:innen, Fotobuch-Export

## Live

https://sansan88.github.io/wayfolio/ – wird bei jedem Push auf `main` automatisch über GitHub Actions veröffentlicht (`.github/workflows/deploy-pages.yml`).

## Lokal starten

```bash
npm install
cp .env.example .env.local   # Supabase-URL und Publishable Key eintragen
npm run dev                  # http://localhost:5173
npm run build                # Produktions-Build inkl. Service Worker (PWA)
```

## Projektstruktur

```
src/
  App.tsx              Tabs: Feed · Erfassen · Karte (Ionic React Router)
  pages/               CapturePage (Aktions-Raster), FeedPage (Stories + Feed), MapPage
  lib/supabase.ts      Supabase-Client
  theme/variables.css  Farben
supabase/migrations/   Datenbankschema mit Row-Level-Security
capacitor.config.ts    Vorbereitung iOS-App (Phase 3)
```

## Datenbank

Supabase-Projekt: `fmafhdivuooqfixoozmi` (Region Zürich, eu-central-2). Alle Migrationen in `supabase/migrations/` sind dort eingespielt. Hilfsfunktionen für die Zugriffsregeln liegen im nicht exponierten Schema `private`. Reisende haben ein Konto, Follower nicht: Sie greifen nur über Edge Functions zu, die den Secret Link prüfen. Deshalb gibt es keine Policies für die Rolle `anon`.

## Status

Phase 0: Grundgerüst. Das vollständige Produktkonzept liegt separat vor.

## Server-Funktion

`supabase/functions/follower-api` – Zugang für Follower ohne Konto (Feed, Reaktionen, Antworten, Abstimmen, Newsletter-Anmeldung). Prüft den Secret Link selbst, deshalb ohne JWT-Prüfung deployt (`verify_jwt = false`).
