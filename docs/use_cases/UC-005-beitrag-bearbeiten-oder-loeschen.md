# Use Case: Beitrag bearbeiten oder löschen

## Overview

**Use Case ID:** UC-005  
**Use Case Name:** Beitrag bearbeiten oder löschen  
**Primary Actor:** Reisende:r (auch Mitreisende:r)  
**Goal:** Einen veröffentlichten Beitrag korrigieren, ergänzen oder entfernen  
**Status:** Implemented

**Anforderungen:** FR-015, FR-018, FR-019

## Preconditions

- Die Person ist angemeldet und Mitglied der Reise.
- Der Beitrag ist im Feed der Reise sichtbar.

## Main Success Scenario

1. Reisende:r tippt am Beitrag auf «…».
2. System zeigt die Aktionen «Bearbeiten», «Beitrags-Links sperren» und «Löschen».
3. Reisende:r wählt «Bearbeiten».
4. System öffnet den Dialog «Bearbeiten» mit Titel, Text, Ort, Zeitpunkt, Medien und Links des Beitrags.
5. Reisende:r ändert Titel oder Text, fügt Fotos, Videos oder Audio hinzu, entfernt Medien oder zieht sie in eine
   neue Reihenfolge.
6. Reisende:r tippt auf «Sichern».
7. System speichert die Änderungen, schliesst den Dialog, meldet «Beitrag aktualisiert» und zeigt den Beitrag
   neu im Feed.

## Alternative Flows

### A1: Ort oder Zeitpunkt ändern

**Trigger:** Ort oder Zeitpunkt stimmen nicht (Schritt 5)
**Flow:**

1. Reisende:r tippt auf «Ort» und wählt per Suche oder Pin einen anderen Ort, oder tippt auf «Zeitpunkt» und wählt
   Datum und Uhrzeit.
2. System übernimmt die Wahl; an einem neuen Ort ersetzt es das Routenbild des Beitrags.
3. Der Beitrag erscheint nach dem Sichern am neuen Tag in Feed und Zeitleiste.

### A2: Links ändern

**Trigger:** Ein Link fehlt oder ist falsch (Schritt 5)
**Flow:**

1. Reisende:r ergänzt, ändert oder entfernt Links.
2. System ersetzt beim Sichern alle Links des Beitrags in der Reihenfolge des Dialogs.

### A3: Mit Claude überarbeiten

**Trigger:** Reisende:r tippt auf «Mit Claude überarbeiten …» (Schritt 5)
**Flow:**

1. Siehe [UC-006](UC-006-mit-claude-schreiben.md).
2. Use Case wird bei Schritt 6 fortgesetzt.

### A4: Nichts geändert

**Trigger:** Keine Angabe wurde verändert (Schritt 6)
**Flow:**

1. System lässt «Sichern» nicht zu.

### A5: Änderungen verwerfen

**Trigger:** Reisende:r tippt nach Änderungen auf «Abbrechen» oder wischt den Dialog weg (Schritt 5)
**Flow:**

1. System fragt «Eingaben verwerfen?».
2. Mit «Verwerfen» schliesst der Dialog ohne zu speichern; mit «Weiter bearbeiten» bleibt er offen.

### A6: Speichern schlägt fehl

**Trigger:** Keine Verbindung oder Serverfehler (Schritt 7)
**Flow:**

1. System meldet «Nicht gespeichert: …»; der Dialog bleibt mit allen Eingaben offen.
2. Reisende:r versucht es erneut oder bricht ab.

### A7: Beitrag löschen

**Trigger:** Reisende:r wählt «Löschen» (Schritt 3)
**Flow:**

1. System fragt «Beitrag löschen?» mit dem Hinweis «Reaktionen und Antworten werden mitgelöscht. Fotos und Videos
   bleiben in der Galerie.»
2. Reisende:r bestätigt mit «Löschen».
3. System entfernt den Beitrag aus Feed, Zeitleiste und Follower-Ansicht.

## Postconditions

### Success Postconditions

- Der Beitrag ist mit den neuen Angaben und der neuen Medienreihenfolge gespeichert; Follower sehen die geänderte
  Fassung.
- Beim Löschen ist der Beitrag für Reisegruppe und Follower verschwunden; seine Fotos und Videos sind weiterhin in
  der Galerie.

### Failure Postconditions

- Der Beitrag bleibt unverändert.

## Business Rules

### BR-029: Gemeinsam bearbeiten

Jedes Mitglied der Reise darf jeden Beitrag der Reise bearbeiten und löschen, nicht nur die eigenen.

### BR-030: Löschen ohne Medienverlust

Beim Löschen eines Beitrags werden seine Reaktionen und Antworten mitgelöscht; Fotos und Videos bleiben in der
Galerie der Reise.

### BR-031: (entfallen)

Galt für Entscheidungen, die am 2026-11-27 ausgebaut wurden. Die ID bleibt reserviert.

### Weitere Regeln

- BR-001 (Titel optional) und BR-002 (Zeit in 5-Minuten-Schritten), siehe [UC-004](UC-004-beitrag-erfassen.md).
