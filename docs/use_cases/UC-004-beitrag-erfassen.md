# Use Case: Beitrag erfassen

## Overview

**Use Case ID:** UC-004  
**Use Case Name:** Beitrag erfassen  
**Primary Actor:** Reisende:r (auch Mitreisende:r)  
**Goal:** Einen Moment der Reise mit wenigen Tipps festhalten – Foto, ein Satz, Ort und Zeitpunkt  
**Status:** Implemented

**Anforderungen:** FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, FR-021, NFR-001, NFR-003

## Preconditions

- Die Person ist angemeldet und Mitglied der aktiven Reise.

## Main Success Scenario

1. Reisende:r tippt im Feed auf «+».
2. System öffnet den Beitrags-Dialog mit dem aktuellen Zeitpunkt (auf 5 Minuten gerundet) und ermittelt den Ort per GPS.
3. Reisende:r wählt ein oder mehrere Fotos oder Videos aus.
4. System verkleinert die Fotos, zeigt sie in der gewählten Reihenfolge und übernimmt Ort und Aufnahmezeit aus den Fotodaten, falls vorhanden.
5. Reisende:r schreibt optional einen Titel und einen Text.
6. Reisende:r tippt auf «Posten».
7. System lädt die Medien hoch, speichert den Beitrag und zeigt ihn im Feed und in der Zeitleiste am richtigen Tag.

## Alternative Flows

### A1: Ort manuell setzen

**Trigger:** Kein GPS-Signal, Zugriff verweigert oder falscher Ort (Schritt 2 oder 4)
**Flow:**

1. System zeigt einen Hinweis und bietet die Ortswahl an.
2. Reisende:r sucht den Ort oder setzt einen Pin auf der Karte.
3. Use Case wird bei Schritt 5 fortgesetzt.

### A2: Rückdatieren

**Trigger:** Reisende:r möchte einen vergangenen Moment erfassen (vor Schritt 6)
**Flow:**

1. Reisende:r öffnet die Zeitauswahl und wählt Datum und Uhrzeit in 5-Minuten-Schritten.
2. Use Case wird bei Schritt 6 fortgesetzt.

### A3: Fehlenden Tag nachtragen

**Trigger:** Reisende:r tippt in der Zeitleiste auf einen gestrichelten Punkt mit «+» (statt Schritt 1)
**Flow:**

1. System öffnet den Beitrags-Dialog mit dem Datum dieses Tages.
2. Use Case wird bei Schritt 3 fortgesetzt.

### A4: Medien umsortieren

**Trigger:** Reisende:r möchte ein anderes Bild zuerst zeigen (nach Schritt 4)
**Flow:**

1. Reisende:r zieht ein Medium am Griff an die gewünschte Stelle.
2. System übernimmt die neue Reihenfolge.

### A5: Links anhängen

**Trigger:** Reisende:r möchte auf eine Unterkunft, einen Ort oder ein Profil verweisen (vor Schritt 6)
**Flow:**

1. Reisende:r fügt einen oder mehrere Links ein.
2. System liest beim Speichern den Seitentitel und zeigt den Link mit Dienstname und Symbol statt der URL.

### A6: Mit Claude schreiben

**Trigger:** Reisende:r tippt auf «Mit Claude schreiben» (Schritt 5)
**Flow:**

1. Siehe [UC-006](UC-006-mit-claude-schreiben.md).
2. Use Case wird bei Schritt 6 fortgesetzt.

### A7: Hochladen schlägt fehl

**Trigger:** Keine Verbindung oder Serverfehler (Schritt 7)
**Flow:**

1. System zeigt eine Fehlermeldung; der Dialog bleibt mit allen Eingaben offen.
2. Reisende:r versucht es erneut oder bricht ab.

### A8: Leerer Beitrag

**Trigger:** Weder Text noch Medien noch Link erfasst (Schritt 6)
**Flow:**

1. System lässt das Posten nicht zu.

## Postconditions

### Success Postconditions

- Der Beitrag ist mit Ort, Zeitpunkt, Text und Medien in der gewählten Reihenfolge gespeichert.
- Follower sehen den Beitrag über den Reise-Link; der Newsletter-Versand berücksichtigt ihn (UC-015).
- Die Route der Reise enthält den neuen Ort.

### Failure Postconditions

- Kein Beitrag wird gespeichert; bereits hochgeladene Medien ohne Beitrag werden nicht angezeigt.

## Business Rules

### BR-001: Titel optional

Ohne Titel zeigt die Karte den Ortsnamen als Überschrift.

### BR-002: Zeit in 5-Minuten-Schritten

Der Zeitpunkt wird in 5-Minuten-Schritten gewählt und darf in der Vergangenheit liegen.

### BR-003: Ein Punkt pro Tag

Die Zeitleiste fasst alle Beiträge eines Tages zu einem Punkt zusammen (erstes Foto, Zähler bei mehreren
Beiträgen). Tage ohne Beitrag sieht nur die Reisegruppe als «+».

### BR-004: Bildgrösse

Fotos werden vor dem Hochladen auf höchstens 1600 px lange Kante verkleinert.

### BR-005: Standortverzögerung

Ist für die Reise eine Standortverzögerung gesetzt, sehen Follower den Ort eines Beitrags erst nach Ablauf dieser
Zeit.
