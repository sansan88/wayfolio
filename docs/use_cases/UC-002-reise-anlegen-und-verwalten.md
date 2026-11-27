# Use Case: Reise anlegen und verwalten

## Overview

**Use Case ID:** UC-002  
**Use Case Name:** Reise anlegen und verwalten  
**Primary Actor:** Reisende:r  
**Goal:** Eine Reise anlegen, ihre Details aktuell halten und zwischen mehreren Reisen wechseln  
**Status:** Implemented

**Anforderungen:** FR-002, FR-003, FR-006, FR-082

## Preconditions

- Die Person ist angemeldet (UC-001).

## Main Success Scenario

1. System zeigt nach der ersten Anmeldung «Eure erste Reise» mit Feldern für Name und Start (heute vorausgefüllt).
2. Reisende:r gibt einen Namen ein, passt bei Bedarf das Startdatum an und tippt auf «Reise anlegen».
3. System legt die Reise an, macht sie zur aktuellen Reise und öffnet ihren Feed.
4. Reisende:r öffnet später im Tab «Reisen» die Reise.
5. System zeigt «Reise bearbeiten» mit Name, Beschreibung, Start, Ende und «Standort für Follower».
6. Reisende:r ändert die gewünschten Angaben und tippt auf «Sichern».
7. System speichert die Reise und meldet «Reise gespeichert».

## Alternative Flows

### A1: Weitere Reise anlegen

**Trigger:** Reisende:r hat schon eine Reise und tippt im Tab «Reisen» auf «Neue Reise anlegen» (statt Schritt 1)
**Flow:**

1. System fragt nach dem Namen der Reise.
2. Reisende:r gibt den Namen ein und tippt auf «Anlegen».
3. System legt die Reise mit dem heutigen Datum als Start an, öffnet sie und meldet «Neue Reise angelegt und
   geöffnet».

### A2: Reiseende festlegen

**Trigger:** Die Reise ist zu Ende (Schritt 6)
**Flow:**

1. Reisende:r tippt auf «Ende» und wählt das Datum.
2. System bietet nur Daten ab dem Start an.
3. Nach dem Sichern zeigt die Zeitleiste fehlende Tage nur noch bis zum Reiseende.

### A3: Standortverzögerung setzen

**Trigger:** Follower sollen nicht in Echtzeit sehen, wo die Reisenden sind (Schritt 6)
**Flow:**

1. Reisende:r wählt bei «Standort für Follower» «sofort», «1 h verzögert», «6 h verzögert» oder «24 h verzögert».
2. Use Case wird bei Schritt 6 fortgesetzt.

### A4: Andere Reise öffnen

**Trigger:** Die Person hat mehrere Reisen (Schritt 4)
**Flow:**

1. Im Tab «Reisen» ist die aktuelle Reise mit «Aktuell» markiert; Reisen anderer Personen zeigen «als Mitreisende».
2. Reisende:r öffnet eine andere Reise und tippt auf «Diese Reise öffnen».
3. System macht sie zur aktuellen Reise; Feed, Karte und Galerie zeigen nun diese Reise.

### A5: Name fehlt

**Trigger:** Das Namensfeld ist leer (Schritt 2 oder 6)
**Flow:**

1. System lässt «Reise anlegen» bzw. «Sichern» nicht zu.

### A6: Speichern schlägt fehl

**Trigger:** Keine Verbindung oder Serverfehler (Schritt 3 oder 7)
**Flow:**

1. System zeigt eine Fehlermeldung; die Eingaben bleiben erhalten.

### A7: Bearbeiten abbrechen

**Trigger:** Reisende:r tippt auf «Abbrechen» (Schritt 6)
**Flow:**

1. System schliesst den Dialog ohne zu speichern.

## Postconditions

### Success Postconditions

- Die Reise ist mit Name, Beschreibung, Start, Ende und Standortverzögerung gespeichert.
- Die anlegende Person ist Besitzer:in der Reise.
- Follower sehen Name und Beschreibung im Tagebuch (UC-011).

### Failure Postconditions

- Die Reise bleibt unverändert bzw. wird nicht angelegt.

## Business Rules

### BR-023: Name erforderlich

Eine Reise braucht einen Namen. Beschreibung, Start und Ende sind optional; das Ende kann nicht vor dem Start liegen.

### BR-024: Gemeinsam verwalten

Alle Mitglieder einer Reise (Besitzer:in und Mitreisende) dürfen Name, Beschreibung, Daten und
Standortverzögerung ändern.

### BR-025: Aktuelle Reise

Feed, Karte und Galerie zeigen immer genau eine Reise, die aktuelle. Das Gerät merkt sich die zuletzt gewählte
Reise; ohne Wahl gilt die zuletzt angelegte.

### Weitere Regeln

- BR-005 (Standortverzögerung), siehe [UC-004](UC-004-beitrag-erfassen.md).
