# Product Backlog: Little Footnotes

Stand: 2026-11-27 · Product Owner: Sandro Scalco · Quelle der Einträge: `docs/requirements.md`,
`docs/use_cases/`, GitHub-Issues (derzeit keine offenen)

## Produkt-Ziel

<!-- Identisch mit docs/vision.md — die Vision ist das Original. -->

|                  |                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Produkt-Ziel** | Reisende halten ihre Reise bis zum letzten Tag lebendig – Tag für Tag kommt eine kleine Fussnote dazu, ohne dass das Festhalten ihnen den Moment nimmt. |
| **Messgrösse**   | 1. Anteil Reisetage mit mindestens einem Beitrag — heute: 78 % (21 von 27 Tagen, eine aktive Reise, Stand 27.11.2026), Ziel: ≥ 80 %. 2. Anteil Reisen mit Beiträgen in der letzten Reisewoche — heute: Baseline noch zu messen, Ziel: ≥ 80 %. |
| **Horizont**     | 27.02.2027                                                                                                                                              |

## Geordnetes Backlog

Ein Eintrag pro Zeile, Rang eindeutig. **Warum hier** nennt den entscheidenden Ordnungsfaktor: Entblockt /
Unsicherheit / Wert / Verzögerungskosten / Lernen.

| Rang | ID                     | Titel                                         | Produkt-Ziel        | Wert (Quelle)                                                                                                     | Warum hier                                              | Abhängig von    | Grösse     | Zustand                                         |
| ---- | ---------------------- | --------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | --------------- | ---------- | ----------------------------------------------- |
| 1    | FR-080                 | Messgrösse Reisetage                          | aktuell             | Ohne Messung lässt sich das Produkt-Ziel am 27.02.2027 nicht prüfen (vision.md, UC-017)                            | Entblockt die Prüfung des Ziels; NFR-018                | —               | S proposed | Refining — UC-017 auf `Approved` bringen        |
| 2    | FR-081                 | Messgrösse letzte Reisewoche                  | aktuell             | «Ein Tagebuch, das nach zwei Wochen verstummt, lässt auch die Daheimgebliebenen im Stich» (vision.md)              | Wert: zweite Messgrösse; Baseline fehlt                 | FR-080          | S proposed | Refining — UC-017 auf `Approved` bringen        |
| 3    | FR-090, FR-093, FR-094 | Passwortschutz Teil A: festlegen und eingeben | aktuell (Vertrauen) | Ein öffentlich geposteter Link allein genügt nicht mehr (FR-090, konzept-zugangsschutz.md)                        | Wert: Vertrauen der Reisenden; Wunsch PO; NFR-021       | —               | M proposed | Refining — UC-019 auf `Approved` bringen        |
| 4    | FR-091, FR-092         | Passwortschutz Teil B: ändern und mitteilen   | aktuell (Vertrauen) | Passwort beim Teilen getrennt vom Link weitergeben (FR-092)                                                       | Wert: ohne Teil B wird das Passwort oft im selben Chat geteilt | Rang 3          | S proposed | Refining — UC-019 auf `Approved` bringen        |
| 5    | FR-095                 | Passwortschutz Teil C: Newsletter             | aktuell (Vertrauen) | Passwort nicht über die Mail umgehbar (FR-095)                                                                    | Wert: schliesst die Lücke über den Newsletter           | Rang 3          | S proposed | Refining — Entscheid Beitrags-Links (Konzept)   |
| 6    | FR-083                 | Erfassungsdauer messen                        | aktuell             | Sichtbar machen, ob Festhalten «den Moment nimmt» (Produkt-Ziel, NFR-001)                                          | Lernen: prüft die zweite Hälfte der Hypothese           | FR-080          | M proposed | Idea — UC-017 ergänzen, Datenschutz nachtragen  |
| 7    | Technik                | Toten Code in `follower-api` entfernen         | aktuell            | `react`/`reply` werden nicht gebaut (NFR-010); `subscribe`/`unsubscribe` nutzen noch die alte Abo-Tabelle (requirements.md, offene Punkte) | Lernen/Aufräumen: Entscheid PO 2026-11-27               | —               | S proposed | Idea — Migration und Function-Deploy planen     |
| 8    | FR-096, FR-097, FR-098 | Zugangsanfrage und Freigabe                   | aktuell (Vertrauen) | «Nur Menschen lesen mit, die ich kenne» (FR-097, Konzept Variante 2b)                                              | Lernen: nur falls das Passwort nicht genügt             | Rang 3–5        | L proposed | Idea — Bedarf nach Passwortschutz prüfen        |
| 9    | FR-099                 | Zugangsstufe wählen                           | aktuell (Vertrauen) | Schutz passt zur Reise (FR-099)                                                                                   | Lernen: erst mit Rang 8 sinnvoll                        | Rang 8          | S proposed | Idea                                            |
| 10   | GOAL-2                 | Familie und Freunde lesen regelmässig mit     | nachfolgend         | Nachfolgendes Ziel (vision.md)                                                                                    | Lernen                                                  | —               | —          | Idea                                            |
| 11   | GOAL-3                 | Weitere Reisende ausserhalb des Gründerkreises | nachfolgend        | Nachfolgendes Ziel; liefert mehr Reisen für die Messung (vision.md, offene Frage 3)                               | Lernen                                                  | —               | —          | Idea                                            |
| 12   | GOAL-4 (FR-075)        | Öffentliche Reisen als Abo                    | nachfolgend         | Zahlungsbereitschaft über die Warteliste prüfen (vision.md)                                                       | Lernen                                                  | GOAL-3          | —          | Idea                                            |

**Grösse** schätzen die Developers; Vorschläge ohne ihre Bestätigung tragen den Zusatz `proposed`.

Zustände: **Idea** → **Refining** → **Ready** (UC `Approved` mit Akzeptanzkriterien, Grösse geschätzt) →
**In Sprint** (Plan `In Progress`) → **Done** (FR `Implemented`/`Verified`).

Zu gross: Passwortschutz (FR-090 – FR-095) wäre als ein Eintrag `L`; aufgeteilt in die Teile A–C, Teil A liefert
allein schon den Schutz.

## Refinement-Warteschlange

| Rang | ID                     | Fehlt                                                                      | Schliesst                                | Bis        |
| ---- | ---------------------- | -------------------------------------------------------------------------- | ---------------------------------------- | ---------- |
| 1–2  | FR-080, FR-081         | UC-017 von `Draft` auf `Approved`; Zeitzone «Reisetag» festlegen           | `/ai-use-case-spec UC-017`, Entscheid PO | 15.12.2026 |
| 3–4  | FR-090 – FR-094        | UC-019 von `Draft` auf `Approved`; Grösse durch Developers                  | `/ai-use-case-spec UC-019`               | 15.12.2026 |
| 5    | FR-095                 | Entscheid: Beitrags-Links mit oder ohne Passwort                           | Entscheid PO                             | 15.12.2026 |
| 6    | FR-083                 | Akzeptanzkriterien, Datenschutzerklärung ergänzen                          | `/ai-use-case-spec UC-017`               | 31.01.2027 |

## Erledigt

| ID                     | Titel                                       | Done am    | Nachweis                                  |
| ---------------------- | ------------------------------------------- | ---------- | ----------------------------------------- |
| FR-047                 | Aktionen am Beitrag (Teilen, «…» als FAB)   | 2026-11-27 | UC-018 `Implemented`, Branch `claude/lucid-wozniak-8020ra` |
| FR-057, FR-058, FR-059 | Bild für Instagram (Story, Beitrag, Motiv)  | 2026-11-27 | UC-018 `Implemented`, Branch `claude/lucid-wozniak-8020ra` |
| FR-001 – FR-074, FR-082 (ohne FR-020, FR-056, FR-075) | Bestehende Funktionen (siehe requirements.md) | vor 2026-11-27 | live auf littlefootnotes.app; noch nicht `Verified` |

## Bewusst nicht

| ID / Thema                         | Grund                                                                                  | Entschieden am |
| ---------------------------------- | -------------------------------------------------------------------------------------- | -------------- |
| Pflicht-Konto für Follower         | Widerspricht «ohne App, ohne Konto» (vision.md, Abgrenzung; Konzept Variante 2a)        | 2026-11-27     |
| Reaktionen und Antworten (Follower) | Nicht gebaut; Backend-Aktionen werden entfernt (Rang 7). Kein sozialer Feed (vision.md) | 2026-11-27     |
| Likes, Followerzahlen, Algorithmus | Ausserhalb der Vision (vision.md, Abgrenzung)                                          | 2026-11-27     |
| Reiseplanung, Buchungen, Budgets   | Andere Systeme (vision.md, Abgrenzung)                                                 | 2026-11-27     |
| Foto-Downloads für Follower        | Die Fotos bleiben bei den Reisenden (vision.md, Abgrenzung)                            | 2026-11-27     |
| Entscheidungen (FR-020, FR-056)    | Ausgebaut 2026-11-27: nie genutzt (0 Entscheidungen in der Datenbank); bei echtem Bedarf neu beurteilen | 2026-11-27     |
| Direktes Posten auf Instagram      | Little Footnotes erzeugt das Bild, gepostet wird in der jeweiligen App (vision.md)     | 2026-11-27     |

## Entscheidungen

| Datum      | Entscheidung                                                                                                           | Durch         |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- | ------------- |
| 2026-11-27 | Erstordnung übernommen: Messung vor Passwortschutz; Passwortschutz in drei Teilen; Grössen als `proposed`              | Sandro Scalco |
| 2026-11-27 | Pflicht-Konto für Follower und Reaktionen/Antworten bewusst nicht; Zugangsanfrage bleibt als Idee im Backlog (Rang 8–9) | Sandro Scalco |
| 2026-11-27 | Entscheidungen ausgebaut (App und `follower-api`), später bei Bedarf neu beurteilen | Sandro Scalco |
| 2026-11-27 | Instagram-Bild und Aktions-Knöpfe am Beitrag umgesetzt                                                                 | Sandro Scalco |

## Quellen

- `docs/vision.md` — Produkt-Ziel, Abgrenzung
- `docs/requirements.md` — FR, NFR, C
- `docs/use_cases.md`, `docs/use_cases/UC-XXX.md`
- `docs/konzept-zugangsschutz.md` — Passwort und Zugangsanfrage
- Definition of Done: noch nicht festgehalten (`TESTING.md` fehlt) — Vorschlag: `/ai-testing-concept`
