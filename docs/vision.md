# Produkt-Vision: Little Footnotes

**Bewusst reisen. Momente teilen mit denen, die euch wichtig sind.**

---

## Zukunftsbild

### Der Moment gehört den Reisenden

Zwei Reisende stehen am Abend an einem Strand in Northland. Das Handy bleibt in der Tasche, bis die Sonne weg ist.
Dann reichen ein Foto und ein Satz, und der Tag ist festgehalten – Ort und Uhrzeit sind schon da. Niemand
wartet auf Reaktionen, niemand zählt etwas. Teilen dauert so lange wie eine Postkarte zu schreiben, nicht länger.

### Daheim weiss man, wie es geht

Eine Mutter öffnet am Morgen in Zürich den Link aus der Familiengruppe. Sie sieht, wo die beiden gestern
waren, wie die Strecke weiterging und wie es ihnen geht – ohne App, ohne Konto, ohne Passwort. Wer lieber eine
Mail bekommt, erhält die neuen Fussnoten einmal pro Woche im Posteingang.

### Einmal erfassen, überall teilen

Ein Moment wird nur einmal festgehalten. Daraus wird der Eintrag im Tagebuch, die Nachricht in der Familiengruppe
und das Bild für die eigene Instagram-Story – mit Datum und Ort, im ruhigen Stil von Little Footnotes. Niemand
tippt dasselbe dreimal.

### Unterwegs zu zweit

Mitreisende schreiben in dieselbe Reise. Aus einzelnen Momenten verschiedener Hände entsteht eine Geschichte:
ein Punkt pro Tag, eine Linie auf der Karte. Ein vergessener Tag wird am nächsten Abend nachgetragen, und nach
einer Woche hilft ein Rückblick, die Tage in wenigen Absätzen zusammenzufassen.

### Privat, offen und in der Schweiz

Wer mitliest, braucht nur den Link. Die Reise ist nirgends auffindbar, die Fotos lassen sich nicht herunterladen,
die Daten liegen in Zürich. Der Quellcode ist offen: Jede und jeder kann nachlesen, was mit den Daten geschieht,
oder Little Footnotes selbst betreiben.

---

## Vision-Statement

> **Für** Reisende und ihre Mitreisenden, **die** ihre Liebsten daheim teilhaben lassen wollen, ohne dabei aus dem
> Moment gerissen zu werden, **ist** Little Footnotes **ein** ruhiges, privates Reisetagebuch, **das** mit wenigen
> Tipps einen Tag festhält und ihn per Link für Familie und Freunde lesbar macht.
> **Im Gegensatz zu** Instagram, Polarsteps oder verstreuten Fotos in WhatsApp-Gruppen **bietet** Little Footnotes
> keine Likes, keine Followerzahlen und keinen Algorithmus, sondern einen Secret Link ohne Konto, offenen
> Quellcode und Daten in Zürich – im Zentrum steht die Reise, nicht die Reichweite.

---

## Produkt-Ziel

|                  |                                                                                                                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Produkt-Ziel** | Reisende halten ihre Reise bis zum letzten Tag lebendig – Tag für Tag kommt eine kleine Fussnote dazu, ohne dass das Festhalten ihnen den Moment nimmt.                                                           |
| **Messgrösse**   | 1. Anteil Reisetage mit mindestens einem Beitrag — heute: 78 % (21 von 27 Tagen, eine aktive Reise, Stand 27.11.2026), Ziel: ≥ 80 %. 2. Anteil Reisen mit Beiträgen in der letzten Reisewoche — heute: Baseline noch zu messen (noch keine abgeschlossene Reise), Ziel: ≥ 80 %. |
| **Horizont**     | 27.02.2027 (drei Monate, Angabe Product Owner)                                                                                                                                                                    |
| **Warum zuerst** | Ein Tagebuch, das nach zwei Wochen verstummt, lässt auch die Daheimgebliebenen im Stich – Newsletter, Teilen und öffentliche Reisen bauen alle auf einer lebendigen Reise auf. Hier liegt der grösste ungenutzte Wert. |

Das Produkt-Ziel ist eine Hypothese. Zeigt sich, dass es falsch ist, ändert oder verwirft es der Product Owner und
hält das in den Revisionen fest.

### Nachfolgende Ziele

- Familie und Freunde lesen regelmässig mit (wiederkehrende Aufrufe der Secret Links, aktive Newsletter-Abos)
- Weitere Reisende ausserhalb des Gründerkreises führen ihre Reisen mit Little Footnotes
- Öffentliche Reisen als Abo – Zahlungsbereitschaft über die Warteliste prüfen

---

## Nutzende und Anspruchsgruppen

| Gruppe                     | Braucht vom Produkt                                                                       | Rolle im Vorhaben            |
| -------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------- |
| Reisende (Paare, Familien) | Einen Tag in Sekunden festhalten, Ort und Zeit automatisch; Kontrolle, wer mitliest       | Nutzende                     |
| Mitreisende                | In dieselbe Reise schreiben, per Einladung, ohne Mehraufwand                              | Nutzende                     |
| Familie und Freunde daheim | Wissen, wo die Reisenden sind und wie es ihnen geht – ohne App, ohne Konto; optional Mail | Nutzende (Follower)          |
| Abonnent:innen             | Updates per E-Mail in gewählter Häufigkeit, Abos selbst verwalten                         | Nutzende (Konto per Magic Link) |
| Sandro Scalco              | Richtung, Freigabe, Entwicklung und Betrieb                                               | Entscheid, Entwicklung, Betrieb |
| Open-Source-Community      | Nachvollziehbarer Code, Selbstbetrieb möglich                                             | Review                       |

---

## Abgrenzung

**Das Produkt umfasst**

- Ein privates Reisetagebuch mit Beiträgen (Text, Fotos, Videos, Links, Ort, Zeitpunkt) und Rückblicken
- Lesen per Secret Link für die ganze Reise oder einen einzelnen Beitrag, ohne Konto – optional mit Passwort
- Teilen auf eigenen Kanälen: Link für Messenger, Bild für Instagram (Story und Beitrag)
- Newsletter für Familie und Freunde
- Route auf der Karte, Zeitleiste mit einem Punkt pro Tag, Galerie
- Schreibhilfe mit Claude – nur mit Einwilligung
- Installierbare App (PWA), auch offline lesbar

**Das Produkt umfasst bewusst nicht**

- Likes, Followerzahlen, Algorithmus oder einen sozialen Feed — kein Ziel; widerspricht dem Kern der Vision
- Direktes Posten auf Instagram oder anderen Netzwerken — Little Footnotes erzeugt das Bild, gepostet wird in der jeweiligen App
- Konten für Follower als Pflicht — widerspricht «ohne App, ohne Konto»; Zugangsschutz über Passwort (siehe Konzept)
- Reiseplanung, Buchungen, Budgets — andere Systeme
- Foto-Downloads für Follower — die Fotos bleiben bei den Reisenden
- Öffentliche Reisen — aufgeschoben; Warteliste läuft, eigenes späteres Produkt-Ziel

---

## Rahmenbedingungen

- **Daten in der Schweiz** — Supabase, Region Zürich (eu-central-2); README
- **Follower ohne Konto** — kein `anon`-Zugriff auf Reisedaten, alles über `follower-api` mit Secret-Link-Prüfung; CLAUDE.md
- **Plattform** — Progressive Web App (Ionic React); iOS über Capacitor vorbereitet; README
- **Open Source** — BSD-3-Clause; LICENSE
- **KI nur mit Einwilligung** — Datenweitergabe an Anthropic erst nach Zustimmung, Tageslimit; CLAUDE.md, Datenschutzerklärung
- **Sprache** — App auf Deutsch, Produktseite DE/EN/FR/ES; CLAUDE.md
- **Kosten für Follower** — Follower zahlen nie, private Reisen kostenlos; README

---

## Die vier Funktionen dieser Vision

### Orientierung

Jede neue Idee wird an einer Frage gemessen: Hilft sie Reisenden, mit weniger Aufwand eine Fussnote festzuhalten,
oder ihren Liebsten, besser mitzulesen? Was Reichweite, Vergleich oder Bildschirmzeit fördert, gehört nicht dazu.

### Vertrauen

Reisende können sich darauf verlassen, dass nur liest, wer den Link hat, dass ihre Fotos nicht weitergereicht
werden und dass ihre Daten in Zürich liegen. Der offene Quellcode macht das überprüfbar.

### Verbindung

Die Vision verbindet die Reisenden unterwegs mit den Menschen daheim – und Mitreisende untereinander, weil aus
ihren Beiträgen eine gemeinsame Geschichte entsteht.

### Motivation

Am Ende einer Reise bleibt ein Tagebuch, das die Familie mitgelebt hat, und eine Reise, die man wirklich erlebt
hat statt durch den Bildschirm. Dafür lohnt sich jede Zeile Code.

---

## Offene Fragen

| #   | Frage                                                                                                                   | Verantwortlich | Bis        |
| --- | ----------------------------------------------------------------------------------------------------------------------- | -------------- | ---------- |
| 1   | Wie werden die Messgrössen laufend erhoben (SQL-Abfrage, Admin-Ansicht)? Zeitzone der Reise für «Reisetag» festlegen     | Sandro Scalco  | 15.12.2026 |
| 2   | Wie wird der Aufwand pro Beitrag («ohne den Moment zu nehmen») sichtbar – z. B. Dauer vom Öffnen bis Posten?             | Sandro Scalco  | 31.01.2027 |
| 3   | Woher kommen bis zum Horizont weitere Reisen, damit die Messung mehr als eine Reise umfasst?                            | Sandro Scalco  | 31.01.2027 |

---

## Revisionen

| Datum      | Änderung    | Freigegeben durch |
| ---------- | ----------- | ----------------- |
| 2026-11-27 | Erstfassung | Sandro Scalco |
| 2026-11-27 | Zielwerte ≥ 80 % bestätigt; «Einmal erfassen, überall teilen» (Instagram-Bild) und optionaler Passwortschutz ergänzt | Sandro Scalco |
