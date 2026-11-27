# Use Case: Entscheidung stellen

## Overview

**Use Case ID:** UC-008  
**Use Case Name:** Entscheidung stellen  
**Primary Actor:** Reisende:r  
**Goal:** Follower über eine Frage unterwegs abstimmen lassen und danach die eigene Entscheidung bekanntgeben  
**Status:** Obsolete

**Anforderungen:** FR-020

> **Hinweis:** Das Erfassen einer neuen Entscheidung (Schritte 1 bis 6) ist in der App derzeit nicht erreichbar:
> Seit dem Zusammenführen der Beitragsarten öffnet «+» nur noch den normalen Beitrag. Bestehende Entscheidungen
> werden weiterhin angezeigt, Follower stimmen ab (UC-012) und Reisende geben die Entscheidung bekannt (Schritte 7
> bis 10).

> **Obsolete seit 2026-11-27:** Entscheidungen wurden ausgebaut (Entscheid PO). Bei echtem Bedarf neu beurteilen.

## Preconditions

- Die Person ist angemeldet und Mitglied der Reise.

## Main Success Scenario

1. Reisende:r öffnet das Erfassen einer Entscheidung.
2. System zeigt den Dialog «Entscheidung» mit Frage, kurzer Beschreibung, zwei Optionen und der Dauer «Abstimmung
   offen» (48 Stunden vorgewählt).
3. Reisende:r gibt die Frage und mindestens zwei Optionen ein, optional eine Beschreibung.
4. Reisende:r wählt, wie lange die Abstimmung offen ist: «24 Stunden», «48 Stunden», «1 Woche» oder «bis wir
   entscheiden».
5. Reisende:r tippt auf «Posten».
6. System veröffentlicht die Entscheidung im Feed und in der Follower-Ansicht.
7. System zeigt der Reisegruppe laufend Stimmen und Anteile je Option.
8. Reisende:r tippt auf «Unsere Entscheidung bekanntgeben».
9. Reisende:r wählt die gewählte Option, schreibt optional «Warum wir uns so entschieden haben …» und tippt auf
   «Bekanntgeben».
10. System beendet die Abstimmung, markiert die Option mit «Unsere Entscheidung» und zeigt die Begründung.

## Alternative Flows

### A1: Weitere Optionen

**Trigger:** Es gibt mehr als zwei Möglichkeiten (Schritt 3)
**Flow:**

1. Reisende:r tippt auf «Option hinzufügen» (bis zu vier Optionen) oder entfernt eine Option wieder.
2. Use Case wird bei Schritt 4 fortgesetzt.

### A2: Unvollständige Eingabe

**Trigger:** Frage fehlt oder weniger als zwei Optionen sind ausgefüllt (Schritt 5)
**Flow:**

1. System lässt das Posten nicht zu.

### A3: Abstimmungszeit abgelaufen

**Trigger:** Die gewählte Dauer ist vorbei, ohne dass eine Entscheidung bekanntgegeben wurde (nach Schritt 7)
**Flow:**

1. System zeigt «Abstimmung beendet» und nimmt keine Stimmen mehr an.
2. Reisende:r kann die Entscheidung trotzdem bekanntgeben (Schritt 8).

### A4: Entscheidung löschen

**Trigger:** Die Frage hat sich erledigt
**Flow:**

1. Siehe [UC-005](UC-005-beitrag-bearbeiten-oder-loeschen.md), A7 und A8.

## Postconditions

### Success Postconditions

- Die Entscheidung ist als Beitrag mit Frage und Optionen veröffentlicht.
- Nach dem Bekanntgeben ist die Abstimmung beendet; Follower sehen die gewählte Option und die Begründung.

### Failure Postconditions

- Es wird keine Entscheidung veröffentlicht bzw. die Abstimmung bleibt offen.

## Business Rules

### BR-034: Frage und Optionen

Eine Entscheidung hat eine Frage und zwei bis vier Optionen; die Beschreibung ist optional. Fotos und Links gehören
nicht dazu.

### BR-035: Dauer der Abstimmung

Die Abstimmung ist 24 Stunden, 48 Stunden, eine Woche oder bis zur Bekanntgabe offen. Danach nimmt sie keine Stimmen
mehr an.

### BR-036: Bekanntgabe beendet die Abstimmung

Mit «Bekanntgeben» ist die Entscheidung endgültig: Die Abstimmung ist beendet und die gewählte Option samt
Begründung ist für alle sichtbar.

### Weitere Regeln

- BR-031 (Entscheidungen nicht bearbeitbar), siehe [UC-005](UC-005-beitrag-bearbeiten-oder-loeschen.md).
