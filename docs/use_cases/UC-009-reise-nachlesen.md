# Use Case: Reise nachlesen

## Overview

**Use Case ID:** UC-009  
**Use Case Name:** Reise nachlesen  
**Primary Actor:** Reisende:r (auch Mitreisende:r)  
**Goal:** Die eigene Reise zeitlich, räumlich und in Bildern wiedererleben – auch ohne Netz  
**Status:** Implemented

**Anforderungen:** FR-040, FR-041, FR-042, FR-043, FR-044, FR-046, FR-070, FR-071, FR-072, NFR-010, NFR-011, NFR-013,
NFR-015

## Preconditions

- Die Person ist angemeldet und Mitglied der aktuellen Reise.

## Main Success Scenario

1. Reisende:r öffnet den Tab «Feed».
2. System zeigt alle Beiträge der Reise als Karten, die neuesten zuerst, je mit Reisetag («Tag N»), Zeitpunkt und
   Name der verfassenden Person.
3. System zeigt oben die Zeitleiste mit einem Punkt pro Reisetag; beim Scrollen wandert der aktive Punkt mit.
4. Reisende:r tippt auf einen Punkt der Zeitleiste.
5. System springt im Feed zu den Beiträgen dieses Tages.
6. Reisende:r öffnet den Tab «Karte».
7. System zeigt die Route aller Orte; Orte mit Fotos erscheinen mit dem neuesten Foto als Marker.
8. Reisende:r tippt auf einen Ort.
9. System zeigt Reisetag, Datum, Land, «Ort … von …», die Fotos und alle Beiträge von diesem Ort; mit den Pfeilen
   wechselt Reisende:r zum vorherigen oder nächsten Ort.
10. Reisende:r öffnet den Tab «Galerie».
11. System zeigt alle Fotos und Videos der Reise nach Tagen gruppiert; ein Tipp öffnet ein Bild gross mit Zeitpunkt
    und Ort, mit Pfeilen zum vorherigen und nächsten Bild.

## Alternative Flows

### A1: Ort aus einem Beitrag öffnen

**Trigger:** Reisende:r tippt im Feed auf den Ort eines Beitrags (Schritt 2)
**Flow:**

1. System wechselt zur Karte und zeigt diesen Ort mit seinen Beiträgen.
2. Use Case wird bei Schritt 9 fortgesetzt.

### A2: Ziehen zum Aktualisieren

**Trigger:** Reisende:r möchte neue Beiträge von Mitreisenden sehen (Schritt 2 oder 11)
**Flow:**

1. Reisende:r zieht den Feed bzw. die Galerie nach unten.
2. System zeigt den fahrenden Camper und lädt die Inhalte neu.

### A3: Ohne Verbindung

**Trigger:** Das Gerät ist offline
**Flow:**

1. System zeigt «Offline – zuletzt geladene Inhalte» und die zuletzt geladenen Beiträge, Fotos und Kartenausschnitte.

### A4: Als App installieren

**Trigger:** Reisende:r tippt im Tab «Reisen» auf «Als App installieren»
**Flow:**

1. Bietet der Browser die Installation an, startet System sie direkt; sonst zeigt es eine Anleitung für den
   Home-Bildschirm.
2. Die installierte App startet direkt im Feed.

### A5: Neue Version verfügbar

**Trigger:** Eine neue App-Version wurde veröffentlicht
**Flow:**

1. System zeigt «Neue Version verfügbar · Aktualisieren».
2. Reisende:r tippt darauf; System lädt die neue Version.
3. Alternativ prüft Reisende:r im Tab «Reisen» mit «Nach Updates suchen»; ohne neue Version meldet das System «Du
   hast die neueste Version».

### A6: Fehlender Tag

**Trigger:** Reisende:r tippt in der Zeitleiste auf einen gestrichelten Punkt mit «+» (Schritt 4)
**Flow:**

1. Siehe [UC-004](UC-004-beitrag-erfassen.md), A3.

### A7: Fotos nur in die Galerie

**Trigger:** Reisende:r tippt in der Galerie auf «+» (Schritt 11)
**Flow:**

1. Reisende:r wählt Fotos oder Videos.
2. System lädt sie hoch, ohne einen Beitrag zu erstellen, und meldet «Zur Galerie hinzugefügt».

### A8: Foto endgültig löschen

**Trigger:** Reisende:r tippt in der Grossansicht auf das Papierkorb-Symbol (Schritt 11)
**Flow:**

1. System fragt «Endgültig löschen?» mit dem Hinweis, dass das Bild auch aus Beiträgen verschwindet.
2. Nach «Löschen» entfernt das System das Foto bzw. Video aus Galerie und Beiträgen.

### A9: Noch keine Beiträge

**Trigger:** Die Reise hat noch keine Beiträge oder Orte (Schritt 2 oder 7)
**Flow:**

1. System zeigt «Eure Reise beginnt hier» im Feed bzw. «Noch keine Standorte» auf der Karte, jeweils mit dem Hinweis
   auf «+».

## Postconditions

### Success Postconditions

- Die zuletzt geladenen Beiträge, Fotos und Kartenausschnitte sind auf dem Gerät für die Offline-Nutzung gespeichert.

### Failure Postconditions

- Ohne Verbindung und ohne gespeicherte Inhalte zeigt das System eine Fehlermeldung statt der Beiträge.

## Business Rules

### BR-037: Chronologisch, nicht algorithmisch

Der Feed zeigt alle Beiträge nach Zeitpunkt, die neuesten zuerst. Der Reisetag zählt ab dem Startdatum der Reise,
ohne Startdatum ab dem ältesten Beitrag.

### BR-038: Offline-Inhalte

Ohne Verbindung zeigt die App die zuletzt geladenen Inhalte und weist darauf hin, dass sie nicht aktuell sein
müssen.

### Weitere Regeln

- BR-003 (Ein Punkt pro Tag), siehe [UC-004](UC-004-beitrag-erfassen.md).
- BR-014 (Keine Reichweite), siehe [UC-011](UC-011-tagebuch-per-link-lesen.md).
