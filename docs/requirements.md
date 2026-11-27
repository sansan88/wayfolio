# Anforderungskatalog: Little Footnotes

Abgeleitet aus [docs/vision.md](vision.md) (Stand 2026-11-27). Status «Implemented» heisst: umgesetzt und live,
aber noch nicht mit einem Test oder Testplan bestätigt. Schwellenwerte, die mit «(Vorschlag)» markiert sind,
muss der Product Owner bestätigen.

**Rollen**

| Rolle         | Beschreibung                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Reisende:r    | Besitzer:in einer Reise, Konto per E-Mail-Link                                                 |
| Mitreisende:r | Per Einladung Mitglied einer Reise, schreibt mit                                               |
| Follower      | Familie und Freunde, lesen per Secret Link ohne Konto                                          |
| Abonnent:in   | Follower mit Konto (Magic Link), erhält den Newsletter                                         |
| Besucher:in   | Liest die Produktseite, trägt sich in die Warteliste ein                                       |
| Betreiber     | Sandro Scalco als Product Owner, Entwickler und Betreiber                                      |
| System        | Hintergrundprozesse (Newsletter-Versand, Routenbilder, Link-Titel)                             |

---

## Funktionale Anforderungen

### Konto und Reise

| ID     | Title                  | User Story                                                                                                                                   | Priority | Status      |
| ------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| FR-001 | Anmelden per E-Mail-Link | Als Reisende:r möchte ich mich mit einem Link in meiner E-Mail anmelden, damit ich kein Passwort brauche.                                  | High     | Implemented |
| FR-002 | Reise anlegen          | Als Reisende:r möchte ich eine Reise mit Namen und Startdatum anlegen, damit ich Beiträge dazu sammeln kann.                                 | High     | Implemented |
| FR-003 | Reise bearbeiten       | Als Reisende:r möchte ich Name, Beschreibung, Titelbild und Daten meiner Reise ändern, damit die Reise aktuell bleibt.                       | Medium   | Implemented |
| FR-004 | Mitreisende einladen   | Als Reisende:r möchte ich Mitreisende per Einladungslink zur Reise hinzufügen, damit wir gemeinsam schreiben.                                | Medium   | Implemented |
| FR-005 | Einladung annehmen     | Als Mitreisende:r möchte ich eine Einladung annehmen, damit ich in der Reise Beiträge erfassen kann.                                         | Medium   | Implemented |
| FR-006 | Standortverzögerung    | Als Reisende:r möchte ich eine Verzögerung für den angezeigten Standort festlegen, damit Follower nicht in Echtzeit sehen, wo wir sind.     | Low      | Implemented |

### Beiträge festhalten

| ID     | Title                   | User Story                                                                                                                                             | Priority | Status      |
| ------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ----------- |
| FR-010 | Beitrag erfassen        | Als Reisende:r möchte ich einen Beitrag mit Text, Fotos, Videos und Ort erfassen, damit ich einen Moment festhalte.                                    | High     | Implemented |
| FR-011 | Titel optional          | Als Reisende:r möchte ich einen Beitrag ohne Titel posten, damit ein Foto und ein Satz genügen; die Karte zeigt dann den Ort.                          | High     | Implemented |
| FR-012 | Ort automatisch         | Als Reisende:r möchte ich, dass der Ort aus GPS oder den Fotodaten (EXIF) übernommen wird, damit ich ihn nicht eintippen muss.                        | High     | Implemented |
| FR-013 | Ort manuell             | Als Reisende:r möchte ich den Ort per Suche oder Pin ändern, damit auch ein falscher oder fehlender Ort stimmt.                                       | High     | Implemented |
| FR-014 | Zeitpunkt frei wählen   | Als Reisende:r möchte ich Datum und Uhrzeit (5-Minuten-Schritte) frei wählen, damit ich einen Tag nachträglich erfassen kann.                         | High     | Implemented |
| FR-015 | Medien sortieren        | Als Reisende:r möchte ich die Reihenfolge der Fotos und Videos per Ziehen festlegen, damit das wichtigste Bild zuerst erscheint.                     | Medium   | Implemented |
| FR-016 | Links anhängen          | Als Reisende:r möchte ich beliebig viele Links an einen Beitrag hängen, damit Follower Unterkunft oder Ort nachschlagen können.                      | Medium   | Implemented |
| FR-017 | Links lesbar anzeigen   | Als Follower möchte ich Links als Dienst mit Namen und Symbol sehen statt als ganze URL, damit ich weiss, wohin sie führen.                           | Medium   | Implemented |
| FR-018 | Beitrag bearbeiten      | Als Reisende:r möchte ich einen Beitrag nachträglich bearbeiten, damit ich Fehler korrigieren und Fotos ergänzen kann.                               | High     | Implemented |
| FR-019 | Beitrag löschen         | Als Reisende:r möchte ich einen Beitrag löschen, damit Ungewolltes verschwindet.                                                                     | High     | Implemented |
| FR-020 | Entscheidung (Umfrage)  | Als Reisende:r möchte ich Follower über eine Frage abstimmen lassen, damit sie an Entscheidungen unterwegs teilhaben.                                | Low      | Implemented |
| FR-021 | Fehlenden Tag nachtragen | Als Reisende:r möchte ich einen Tag ohne Beitrag in der Zeitleiste erkennen und direkt nachtragen, damit die Reise lückenlos bleibt.               | High     | Implemented |

### Schreiben mit Claude

| ID     | Title                  | User Story                                                                                                                                      | Priority | Status      |
| ------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| FR-030 | KI-Einwilligung        | Als Reisende:r möchte ich vor dem ersten Gebrauch erfahren, welche Daten an Anthropic gehen, und zustimmen oder ablehnen, damit ich die Kontrolle behalte. | High | Implemented |
| FR-031 | KI ausschalten         | Als Reisende:r möchte ich die Schreibhilfe in meinem Profil wieder ausschalten, damit keine Daten mehr übermittelt werden.                       | High     | Implemented |
| FR-032 | Entwurf aus Stichworten | Als Reisende:r möchte ich aus Stichworten und bis zu vier Fotos einen Entwurf erhalten, damit ich abends nur noch kurz anpassen muss.          | Medium   | Implemented |
| FR-033 | Text überarbeiten      | Als Reisende:r möchte ich vorhandenen Text korrigieren, kürzen, verlängern oder nach eigenem Wunsch umformulieren lassen, damit er besser liest. | Medium   | Implemented |
| FR-034 | Rückblick              | Als Reisende:r möchte ich die Beiträge seit dem letzten Rückblick (max. 14 Tage) zusammenfassen lassen, damit ich eine Woche in wenigen Absätzen erzähle. | Medium | Implemented |
| FR-035 | Entwurf verwerfen      | Als Reisende:r möchte ich einen KI-Entwurf rückgängig machen, damit mein eigener Text erhalten bleibt.                                          | Medium   | Implemented |

### Reise ansehen (Reisende)

| ID     | Title               | User Story                                                                                                                       | Priority | Status      |
| ------ | ------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| FR-040 | Feed                | Als Reisende:r möchte ich alle Beiträge der Reise als Karten in zeitlicher Folge sehen, damit ich die Reise nachlese.            | High     | Implemented |
| FR-041 | Zeitleiste pro Tag  | Als Reisende:r möchte ich eine Zeitleiste mit einem Punkt pro Reisetag sehen, die mit dem Feed mitscrollt, damit ich schnell zu einem Tag springe. | High | Implemented |
| FR-042 | Karte mit Route     | Als Reisende:r möchte ich die Route aller Orte mit Fotos als Marker auf einer Karte sehen, damit die Reise räumlich sichtbar wird. | High   | Implemented |
| FR-043 | Ort im Detail       | Als Reisende:r möchte ich auf einen Ort tippen und alle Beiträge von dort sehen, damit ich Erlebnisse am selben Ort finde.         | Medium   | Implemented |
| FR-044 | Galerie             | Als Reisende:r möchte ich alle Fotos der Reise in einer Galerie sehen, damit ich Bilder ohne Text durchblättern kann.             | Medium   | Implemented |
| FR-045 | Routenbilder        | Als System möchte ich zu Beiträgen automatisch ein Routenbild erzeugen, damit der Weg zwischen zwei Orten sichtbar wird.           | Low      | Implemented |
| FR-046 | Ziehen zum Aktualisieren | Als Reisende:r möchte ich den Feed durch Ziehen aktualisieren, damit ich neue Beiträge von Mitreisenden sehe.                  | Medium   | Implemented |

### Teilen und Mitlesen

| ID     | Title                     | User Story                                                                                                                                     | Priority | Status      |
| ------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| FR-050 | Reise teilen              | Als Reisende:r möchte ich den Secret Link der Reise über die Teilen-Funktion (z. B. WhatsApp) verschicken, damit meine Familie mitliest.       | High     | Implemented |
| FR-051 | Beitrag einzeln teilen    | Als Reisende:r möchte ich einen einzelnen Beitrag mit eigenem Secret Link teilen, damit nicht die ganze Reise sichtbar wird.                  | Medium   | Implemented |
| FR-052 | Link sperren              | Als Reisende:r möchte ich einen geteilten Link sperren, damit ihn niemand mehr öffnen kann.                                                   | High     | Implemented |
| FR-053 | Tagebuch ohne Konto lesen | Als Follower möchte ich das Tagebuch über den Link im Browser lesen, damit ich weder App noch Konto brauche.                                  | High     | Implemented |
| FR-054 | Route als Follower        | Als Follower möchte ich die Route auf der Karte sehen und von einem Ort zurück ins Tagebuch springen, damit ich weiss, wo die Reisenden sind. | High     | Implemented |
| FR-055 | Einzelbeitrag lesen       | Als Follower möchte ich einen geteilten Einzelbeitrag öffnen, damit ich genau diesen Moment sehe.                                             | Medium   | Implemented |
| FR-056 | Abstimmen als Follower    | Als Follower möchte ich an einer Entscheidung der Reisenden teilnehmen, damit ich mitreden kann.                                              | Low      | Implemented |

### Newsletter

| ID     | Title                 | User Story                                                                                                                                       | Priority | Status      |
| ------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ----------- |
| FR-060 | Newsletter abonnieren | Als Follower möchte ich über den Reise-Link mit meiner E-Mail und gewählter Häufigkeit (jeder Beitrag / wöchentlich) Updates abonnieren, damit ich nichts verpasse. | Medium | Implemented |
| FR-061 | Abo bestätigen        | Als Abonnent:in möchte ich mein Abo über einen Bestätigungslink aktivieren, damit niemand fremde Adressen einträgt.                              | High     | Implemented |
| FR-062 | Abos verwalten        | Als Abonnent:in möchte ich unter «Meine Abos» Häufigkeit ändern, pausieren und beenden, damit ich die Mails steuere.                           | Medium   | Implemented |
| FR-063 | Abmelden ohne Login   | Als Abonnent:in möchte ich mich über einen Link in der Mail abmelden, ohne mich anzumelden, damit das Abmelden einen Klick dauert.             | High     | Implemented |
| FR-064 | Newsletter versenden  | Als System möchte ich neue Beiträge gemäss Häufigkeit an aktive Abonnent:innen versenden, damit sie per Mail informiert sind.                  | Medium   | Implemented |
| FR-065 | Abonnent:innen sehen  | Als Reisende:r möchte ich alle Abonnent:innen meiner Reise mit Status sehen und einzelne entfernen, damit ich weiss, wer mitliest.              | Medium   | Implemented |

### App und Produktseite

| ID     | Title                   | User Story                                                                                                                                         | Priority | Status      |
| ------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| FR-070 | App installieren        | Als Reisende:r möchte ich die App auf dem Home-Bildschirm installieren, damit sie wie eine native App startet.                                      | High     | Implemented |
| FR-071 | Offline lesen           | Als Reisende:r möchte ich die zuletzt geladenen Beiträge, Fotos und Kartenkacheln ohne Netz sehen, damit die App auch im Funkloch funktioniert.  | High     | Implemented |
| FR-072 | Update-Hinweis          | Als Reisende:r möchte ich einen Hinweis bei einer neuen App-Version erhalten, damit ich bewusst aktualisiere.                                     | Medium   | Implemented |
| FR-073 | Produktseite mehrsprachig | Als Besucher:in möchte ich die Produktseite auf Deutsch, Englisch, Französisch oder Spanisch lesen, damit ich das Angebot verstehe.            | Medium   | Implemented |
| FR-074 | Warteliste              | Als Besucher:in möchte ich mich mit meiner E-Mail in die Warteliste für öffentliche Reisen eintragen, damit ich beim Start informiert werde.     | Low      | Implemented |
| FR-075 | Öffentliche Reise       | Als Reisende:r möchte ich meine Reise als öffentliche Seite ohne Secret Link zeigen, damit auch Unbekannte mitlesen.                              | Low      | Deferred    |

### Produkt-Ziel «Reisen bleiben lebendig»

| ID     | Title                        | User Story                                                                                                                                         | Priority | Status |
| ------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| FR-080 | Messgrösse Reisetage         | Als Betreiber möchte ich pro Reise den Anteil Reisetage mit mindestens einem Beitrag sehen (Zeitzone der Reise), damit ich das Produkt-Ziel messe. | High     | Open   |
| FR-081 | Messgrösse letzte Reisewoche | Als Betreiber möchte ich sehen, wie viele abgeschlossene Reisen in ihrer letzten Woche noch Beiträge haben, damit ich erkenne, ob Reisen verstummen. | High   | Open   |
| FR-082 | Reiseende festlegen          | Als Reisende:r möchte ich das Enddatum meiner Reise setzen, damit Zeitleiste und Messung wissen, wann die Reise vorbei ist.                       | Medium   | Open   |
| FR-083 | Erfassungsdauer messen       | Als Betreiber möchte ich die Dauer vom Öffnen bis zum Posten eines Beitrags anonym erfassen, damit ich sehe, ob Festhalten wenig Zeit kostet.     | Medium   | Open   |

---

## Nicht-funktionale Anforderungen

| ID      | Title                      | Requirement                                                                                                                                  | Category        | Priority | Status      |
| ------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------- | ----------- |
| NFR-001 | Schnell gepostet           | Ein Beitrag mit einem Foto und einem Satz lässt sich in höchstens 60 Sekunden vom Öffnen bis zum Posten erfassen (Vorschlag).               | Usability       | High     | Open        |
| NFR-002 | Ladezeit Follower-Ansicht  | Die Follower-Ansicht zeigt die ersten Beiträge über 4G innerhalb von 3 Sekunden (Largest Contentful Paint, Vorschlag).                      | Performance     | High     | Open        |
| NFR-003 | Bildgrösse                 | Fotos werden vor dem Hochladen im Browser auf höchstens 1600 px lange Kante verkleinert (JPEG ca. 82 %).                                    | Performance     | High     | Implemented |
| NFR-004 | KI-Bildgrösse              | An Claude gehen höchstens 4 Bilder pro Anfrage, verkleinert auf 1024 px.                                                                    | Security        | High     | Implemented |
| NFR-005 | KI-Tageslimit              | Pro Person sind höchstens 40 KI-Anfragen pro Tag möglich (konfigurierbar über `AI_DAILY_LIMIT`).                                            | Scalability     | Medium   | Implemented |
| NFR-006 | Secret Link                | Follower-Zugriff erfolgt ausschliesslich über die Edge Function `follower-api` mit Prüfung des Secret Links; `anon` hat 0 Leserechte auf Reisedaten. | Security   | High     | Implemented |
| NFR-007 | Row Level Security         | 100 % der Tabellen im Schema `public` haben RLS aktiviert; die Supabase-Advisors melden keine Sicherheitswarnung der Stufe ERROR.           | Security        | High     | Implemented |
| NFR-008 | Private Medien             | Fotos liegen im privaten Bucket `media` und werden nur über signierte URLs mit begrenzter Gültigkeit ausgeliefert.                          | Security        | High     | Implemented |
| NFR-009 | Keine Foto-Downloads       | Die Follower-Ansicht enthält 0 Download-Knöpfe für Fotos und Videos.                                                                         | Security        | High     | Implemented |
| NFR-010 | Keine Reichweitenmetriken  | Keine Ansicht zeigt Likes, Followerzahlen oder Aufrufzahlen; Beiträge erscheinen chronologisch, nicht algorithmisch sortiert.               | Usability       | High     | Implemented |
| NFR-011 | Offline-Cache              | Der Service Worker hält bis zu 600 Medien für 120 Tage und bis zu 3000 Kartenkacheln für 60 Tage vor.                                       | Availability    | Medium   | Implemented |
| NFR-012 | Newsletter-Takt            | Neue Beiträge erreichen Abonnent:innen mit Häufigkeit «jeder Beitrag» spätestens 30 Minuten nach dem Posten (Cron alle 15 Minuten).         | Performance     | Medium   | Implemented |
| NFR-013 | Mobile Darstellung         | Alle Ansichten sind bei 390 × 844 px ohne horizontales Scrollen bedienbar, im hellen und dunklen Design.                                    | Usability       | High     | Implemented |
| NFR-014 | Barrierefreiheit           | Die App erfüllt WCAG 2.1 AA für Kontrast und Bedienelemente mit zugänglichem Namen (Vorschlag).                                             | Usability       | Medium   | Open        |
| NFR-015 | Reduzierte Bewegung        | Animationen (Camper-Ladeanimation, Aktualisieren) entfallen, wenn `prefers-reduced-motion` gesetzt ist.                                     | Usability       | Low      | Implemented |
| NFR-016 | Verfügbarkeit              | Die App ist über 30 Tage zu mindestens 99,5 % erreichbar (Vorschlag; abhängig von GitHub Pages und Supabase).                               | Availability    | Medium   | Open        |
| NFR-017 | Build vor Commit           | Jeder Commit auf `main` baut fehlerfrei (`BASE_PATH=/ npm run build`, `tsc --noEmit` ohne Fehler).                                           | Maintainability | High     | Implemented |
| NFR-018 | Messgrössen ohne Tracking  | Die Messung des Produkt-Ziels kommt ohne Drittanbieter-Tracking und ohne Cookies für Follower aus.                                          | Security        | High     | Open        |

---

## Rahmenbedingungen

| ID    | Title                   | Constraint                                                                                                              | Category    | Priority | Status      |
| ----- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------- | -------- | ----------- |
| C-001 | PWA mit Ionic React     | Die App ist eine Progressive Web App mit Ionic React 9 (iOS-Modus), React Router 6, TypeScript und Vite.                | Technical   | High     | Implemented |
| C-002 | Supabase                | Backend ist Supabase (Postgres/PostGIS, Auth, Storage, Edge Functions), Projekt `fmafhdivuooqfixoozmi`.                 | Technical   | High     | Implemented |
| C-003 | Datenstandort Schweiz   | Datenbank und Fotos liegen in der Region Zürich (eu-central-2).                                                         | Regulatory  | High     | Implemented |
| C-004 | Datenschutz             | Datenbearbeitung gemäss revDSG; jede neue Datenverarbeitung wird in der Datenschutzerklärung nachgetragen (`STAND` aktualisieren). | Regulatory | High | Implemented |
| C-005 | Nur Publishable Key     | Im Frontend steht nur der Publishable Key; Secret-, Service-Role-, SMTP- und API-Keys liegen nur als Supabase-Secrets.  | Technical   | High     | Implemented |
| C-006 | Schemaänderungen        | Jede Schemaänderung liegt als Datei in `supabase/migrations/` und ist im Projekt eingespielt; neue Tabellen mit RLS.    | Operational | High     | Implemented |
| C-007 | Open Source             | Der Quellcode ist unter BSD-3-Clause öffentlich auf GitHub.                                                             | Business    | High     | Implemented |
| C-008 | Kostenlos für Follower  | Follower zahlen nie; private Reisen sind kostenlos.                                                                     | Business    | High     | Implemented |
| C-009 | Sprache                 | App-Texte auf Deutsch (Du/Ihr-Form, Schweizer Rechtschreibung); Produktseite zusätzlich EN/FR/ES; Rechtstexte deutsch. | Business    | High     | Implemented |
| C-010 | Karten                  | Karten mit MapLibre GL und OpenFreeMap, Ortssuche über Nominatim.                                                       | Technical   | Medium   | Implemented |
| C-011 | KI-Anbieter             | Schreibhilfe nur über Claude (Anthropic API) via Edge Function `ai-draft`, nur mit Einwilligung (`profiles.ai_enabled_at`). | Regulatory | High   | Implemented |
| C-012 | Hosting und Deploy      | Hosting auf GitHub Pages unter `littlefootnotes.app`; jeder Push auf `main` deployt über GitHub Actions.                | Operational | High     | Implemented |
| C-013 | E-Mail-Versand          | E-Mails über SMTP von Infomaniak (`team@littlefootnotes.app`).                                                          | Technical   | Medium   | Implemented |
| C-014 | Echte Reisedaten        | Echte Reisedaten werden nur gelesen; Tests laufen mit dem Testkonto, Testdaten werden danach gelöscht.                  | Operational | High     | Implemented |
| C-015 | Horizont Produkt-Ziel   | Das Produkt-Ziel «Reisen bleiben lebendig» wird am 27.02.2027 überprüft.                                                | Schedule    | High     | Open        |
| C-016 | Ein Entwickler          | Entwicklung und Betrieb durch eine Person (Sandro Scalco).                                                              | Business    | Medium   | Implemented |

---

## Offene Punkte

- NFR-001, NFR-002, NFR-014, NFR-016: Schwellenwerte sind Vorschläge – vom Product Owner zu bestätigen.
- FR-080/FR-081: Zielwerte siehe offene Frage 1 in [vision.md](vision.md).
- `follower-api` kennt noch die Aktionen `react` (Emoji-Reaktionen) und `reply` (Antworten), die App zeigt sie
  nicht. Entscheiden: als Anforderung aufnehmen (vereinbar mit NFR-010, solange keine Zahlen erscheinen) oder
  entfernen.
