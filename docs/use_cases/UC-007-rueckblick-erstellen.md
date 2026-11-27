# Use Case: Rückblick erstellen

## Overview

**Use Case ID:** UC-007  
**Use Case Name:** Rückblick erstellen  
**Primary Actor:** Reisende:r  
**Secondary Actor:** Claude (Anthropic)  
**Goal:** Die Beiträge der letzten Tage in einem Beitrag mit wenigen Absätzen zusammenfassen lassen  
**Status:** Implemented

**Anforderungen:** FR-030, FR-034, NFR-004, NFR-005, C-011

## Preconditions

- Die Person ist angemeldet und Mitglied der Reise.
- Der Dialog «Neuer Beitrag» ist offen (UC-004) und das Textfeld ist leer.

## Main Success Scenario

1. Reisende:r tippt auf «Mit Claude schreiben».
2. System prüft die Einwilligung und zeigt die Auswahl «Aus Stichworten und Fotos» oder «Rückblick der letzten
   Tage».
3. Reisende:r wählt «Rückblick der letzten Tage».
4. System prüft das Tageslimit und sammelt die Beiträge seit dem letzten Rückblick mit Datum, Ort und Text sowie bis
   zu vier Fotos, über den Zeitraum verteilt.
5. System sendet diese Angaben zusammen mit Name und Beschreibung der Reise an Claude.
6. System setzt Titel und Text des Rückblicks in den Dialog ein und meldet «Rückblick von Claude – passe ihn ruhig
   an.».
7. Reisende:r passt den Text an und ergänzt bei Bedarf Fotos, Ort oder Zeitpunkt.
8. Reisende:r tippt auf «Posten».
9. System veröffentlicht den Beitrag als Rückblick.

## Alternative Flows

### A1: Erste Nutzung ohne Einwilligung

**Trigger:** Es liegt keine Einwilligung vor (Schritt 2)
**Flow:**

1. Siehe [UC-006](UC-006-mit-claude-schreiben.md), A1.

### A2: Keine neuen Beiträge

**Trigger:** Seit dem letzten Rückblick (bzw. in den letzten 14 Tagen) gibt es keine Beiträge (Schritt 4)
**Flow:**

1. System meldet «In den letzten Tagen gibt es keine neuen Beiträge seit dem letzten Rückblick.»
2. Der Dialog bleibt unverändert offen.

### A3: Rückblick verwerfen

**Trigger:** Reisende:r tippt in der Meldung auf «Rückgängig» (nach Schritt 6)
**Flow:**

1. System stellt Titel und Text wieder her, wie sie vorher waren.
2. Ein danach geposteter Beitrag gilt nicht als Rückblick.

### A4: Tageslimit erreicht oder Claude nicht erreichbar

**Trigger:** Tageslimit erreicht oder Claude antwortet nicht (Schritt 4 oder 5)
**Flow:**

1. Siehe [UC-006](UC-006-mit-claude-schreiben.md), A4 und A5.

## Postconditions

### Success Postconditions

- Der Rückblick ist als Beitrag veröffentlicht und erscheint in Feed, Zeitleiste und Follower-Ansicht.
- Der nächste Rückblick fasst nur Beiträge zusammen, die nach diesem veröffentlicht wurden.

### Failure Postconditions

- Es wird kein Rückblick erzeugt; Titel und Text im Dialog bleiben unverändert.

## Business Rules

### BR-032: Zeitraum des Rückblicks

Ein Rückblick umfasst die Beiträge seit dem letzten Rückblick der Reise, höchstens aber die letzten 14 Tage
(maximal 40 Beiträge). Frühere Rückblicke dienen nur als Stilvorlage und werden nicht nochmals zusammengefasst.

### BR-033: Rückblick als eigene Beitragsart

Ein Beitrag zählt als Rückblick, wenn sein Text aus «Rückblick der letzten Tage» stammt und nicht rückgängig gemacht
wurde. Er bleibt danach ein normal bearbeitbarer Beitrag.

### Weitere Regeln

- BR-006 (Einwilligung), BR-007 (Bildumfang), BR-008 (Tageslimit) und BR-009 (Sprache und Stil), siehe
  [UC-006](UC-006-mit-claude-schreiben.md).
