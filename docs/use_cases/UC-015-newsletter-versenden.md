# Use Case: Newsletter versenden

## Overview

**Use Case ID:** UC-015  
**Use Case Name:** Newsletter versenden  
**Primary Actor:** System  
**Secondary Actor:** Abonnent:in (Empfang), Betreiber (Vorschau)  
**Goal:** Neue Beiträge gemäss gewählter Häufigkeit per E-Mail an aktive Abonnent:innen bringen  
**Status:** Implemented

**Anforderungen:** FR-064, NFR-012, C-013

## Preconditions

- Es gibt mindestens ein aktives Abo mit bestätigter E-Mail-Adresse (UC-013).

## Main Success Scenario

1. System startet alle 15 Minuten einen Versandlauf.
2. System ermittelt die fälligen Abos: aktiv, E-Mail bestätigt, Häufigkeit «bei jedem Beitrag» oder letzte Mail vor
   mindestens sieben Tagen, und mit neuen Beiträgen seit der letzten Mail.
3. System sammelt pro Abo die neuen Beiträge der Reise, die ältesten zuerst.
4. System stellt die Mail zusammen: Begrüssung mit Namen, pro Beitrag Titel (sonst Ort), Ort, Datum, Text, erstes
   Foto, Links mit lesbarem Namen und «Im Tagebuch ansehen →», dazu «Ganze Reise ansehen», «Abo-Einstellungen» und
   «Abmelden».
5. System setzt den Betreff: «‹Reise›: ‹Titel›» bei einem neuen Beitrag, «‹Reise›: N neue Updates» bei mehreren,
   «‹Reise›: Wochenrückblick» bei wöchentlicher Häufigkeit.
6. System versendet die Mail von team@littlefootnotes.app.
7. System merkt sich den Zeitpunkt als Beginn für die nächste Mail dieses Abos.

## Alternative Flows

### A1: Nichts fällig

**Trigger:** Kein Abo erfüllt die Bedingungen (Schritt 2)
**Flow:**

1. System versendet in diesem Lauf nichts.

### A2: Versand an eine Adresse schlägt fehl

**Trigger:** Die Mail an ein Abo kann nicht gesendet werden (Schritt 6)
**Flow:**

1. System hält den Fehler fest und fährt mit den übrigen Abos fort.
2. Der Zeitpunkt wird nicht nachgeführt; der nächste Lauf versucht es erneut.

### A3: Vorschau

**Trigger:** Betreiber startet einen Probelauf
**Flow:**

1. System führt Schritte 2 bis 5 aus und liefert Betreff und Inhalt jeder Mail zurück.
2. Es wird nichts versendet und kein Zeitpunkt nachgeführt.

### A4: Reise-Link gesperrt

**Trigger:** Der Reise-Link des Abos wurde gesperrt (Schritt 4)
**Flow:**

1. Die Links der Mail führen zu «Meine Abos» statt ins Tagebuch.

### A5: Unberechtigter Aufruf

**Trigger:** Der Versand wird von aussen ohne gültiges Geheimnis angestossen (Schritt 1)
**Flow:**

1. System lehnt den Aufruf ab und versendet nichts.

## Postconditions

### Success Postconditions

- Jedes fällige Abo hat eine Mail mit den neuen Beiträgen erhalten.
- Der Versandzeitpunkt ist pro Abo gespeichert; dieselben Beiträge werden nicht nochmals versendet.

### Failure Postconditions

- Abos ohne erfolgreichen Versand behalten ihren bisherigen Zeitpunkt und kommen im nächsten Lauf wieder dran.

## Business Rules

### BR-045: Was als neu gilt

Neu sind Beiträge, die seit der letzten Mail veröffentlicht oder erfasst wurden – auch rückdatierte. Ohne frühere
Mail gilt der Beginn des Abos.

### BR-046: Umfang

Eine Mail enthält höchstens 20 Beiträge. Fotos sind über Links eingebunden, die 30 Tage gültig sind. Ein Lauf
bedient höchstens 40 Abos; die übrigen folgen im nächsten Lauf.

### BR-047: Versand nur berechtigt

Einen Versandlauf lösen nur der geplante Lauf oder der Betreiber aus; ein Probelauf zeigt die Mails nur an und
versendet nichts.

### Weitere Regeln

- BR-005 (Standortverzögerung): Beiträge kommen erst nach Ablauf der Verzögerung in den Newsletter, siehe
  [UC-004](UC-004-beitrag-erfassen.md).
- BR-017 (Häufigkeit), siehe [UC-013](UC-013-newsletter-abonnieren.md).
- BR-044 (Abmelden ohne Anmeldung), siehe [UC-014](UC-014-abos-verwalten.md).
