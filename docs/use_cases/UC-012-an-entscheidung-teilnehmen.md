# Use Case: An Entscheidung teilnehmen

## Overview

**Use Case ID:** UC-012  
**Use Case Name:** An Entscheidung teilnehmen  
**Primary Actor:** Follower  
**Goal:** Bei einer Frage der Reisenden mitreden und sehen, wie die anderen abgestimmt haben  
**Status:** Implemented

**Anforderungen:** FR-056, NFR-006

## Preconditions

- Der Follower hat das Tagebuch über einen gültigen Reise-Link geöffnet (UC-011).
- Die Reise enthält eine offene Entscheidung (UC-008).

## Main Success Scenario

1. Follower sieht die Entscheidung mit Frage, Beschreibung, Optionen und dem Hinweis «Stimme ab, um das Resultat zu
   sehen.».
2. Follower tippt auf eine Option.
3. System fragt beim ersten Mal «Wie heisst du?».
4. Follower gibt einen Vornamen ein und tippt auf «Weiter».
5. System speichert die Stimme.
6. System zeigt pro Option Anteil und Anzahl Stimmen, die Gesamtzahl und markiert die eigene Wahl.

## Alternative Flows

### A1: Name bereits bekannt

**Trigger:** Der Follower hat auf diesem Gerät schon einen Namen angegeben (Schritt 3)
**Flow:**

1. System speichert die Stimme ohne Nachfrage.
2. Use Case wird bei Schritt 6 fortgesetzt.

### A2: Stimme ändern

**Trigger:** Follower tippt nach der Abstimmung auf eine andere Option (nach Schritt 6)
**Flow:**

1. System ersetzt die bisherige Stimme durch die neue und aktualisiert das Resultat.

### A3: Abstimmung beendet

**Trigger:** Die Abstimmungszeit ist abgelaufen (Schritt 1)
**Flow:**

1. System zeigt das Resultat mit «Abstimmung beendet»; die Optionen lassen sich nicht mehr wählen.

### A4: Entscheidung bekanntgegeben

**Trigger:** Die Reisenden haben ihre Entscheidung bekanntgegeben (Schritt 1)
**Flow:**

1. System zeigt das Resultat, markiert die gewählte Option mit «Unsere Entscheidung» und zeigt die Begründung.
2. Abstimmen ist nicht mehr möglich.

### A5: Name nicht angegeben

**Trigger:** Follower tippt auf «Abbrechen» (Schritt 4)
**Flow:**

1. System schliesst den Dialog; es wird keine Stimme gespeichert.

### A6: Stimme wird abgelehnt

**Trigger:** Die Abstimmung wurde in der Zwischenzeit beendet oder der Zugang gesperrt (Schritt 5)
**Flow:**

1. System zeigt «Die Abstimmung ist beendet.» bzw. «Dieser Zugang wurde gesperrt.» und speichert nichts.

### A7: Beitrags-Link

**Trigger:** Der Follower hat nur den Link zu diesem einen Beitrag (statt Reise-Link)
**Flow:**

1. System zeigt die Entscheidung, nimmt über diesen Link aber keine Stimme entgegen.

## Postconditions

### Success Postconditions

- Pro Follower ist genau eine Stimme für diese Entscheidung gespeichert.
- Die Reisegruppe sieht die neue Stimme im Gesamtresultat.

### Failure Postconditions

- Es wird keine Stimme gespeichert; eine frühere Stimme bleibt unverändert.

## Business Rules

### BR-039: Name statt Konto

Vor der ersten Teilnahme gibt der Follower einen Namen an (höchstens 40 Zeichen). Er gilt für dieses Gerät und
diesen Reise-Link; ein Konto ist nicht nötig.

### BR-040: Eine Stimme pro Follower

Jeder Follower hat pro Entscheidung eine Stimme. Solange die Abstimmung offen ist, kann er sie ändern.

### BR-041: Resultat nach der eigenen Stimme

Follower sehen das Resultat erst, wenn sie selbst abgestimmt haben oder die Abstimmung beendet ist.

### Weitere Regeln

- BR-012 (Kein Konto für Follower), siehe [UC-011](UC-011-tagebuch-per-link-lesen.md).
- BR-035 (Dauer der Abstimmung), siehe [UC-008](UC-008-entscheidung-stellen.md).
