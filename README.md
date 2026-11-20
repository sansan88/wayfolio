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

## Status

Konzeptphase. Das vollständige Produktkonzept liegt separat vor.
