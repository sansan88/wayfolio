# Use Case: Mitreisende einladen

## Overview

**Use Case ID:** UC-003  
**Use Case Name:** Mitreisende einladen  
**Primary Actor:** Reisende:r (Annehmen: Mitreisende:r)  
**Goal:** Eine Reisebegleitung zur Reise hinzufügen, damit beide Beiträge erfassen und bearbeiten  
**Status:** Implemented

**Anforderungen:** FR-004, FR-005

## Preconditions

- Reisende:r ist angemeldet und Mitglied der Reise.
- Die eingeladene Person hat eine eigene E-Mail-Adresse.

## Main Success Scenario

1. Reisende:r öffnet im Tab «Reisen» die Reise und tippt unter «Mitreisende» auf «Mitreisende einladen».
2. System erzeugt einen Einladungslink und öffnet die Teilen-Funktion mit dem Text «Reist du mit? Hier kannst du bei
   unserer Reise «…» mitschreiben:».
3. Reisende:r schickt den Link, z. B. per WhatsApp.
4. Mitreisende:r öffnet den Link und meldet sich an (UC-001, A3).
5. System zeigt «Du wirst zur Reise hinzugefügt …», fügt die Person als Mitreisende hinzu und öffnet die Reise.
6. Die Mitgliederliste zeigt die Person mit «schreibt mit».

## Alternative Flows

### A1: Keine Teilen-Funktion

**Trigger:** Browser bietet keine Teilen-Funktion an (Schritt 2)
**Flow:**

1. System kopiert den Link und meldet «Einladungslink kopiert (7 Tage gültig)».
2. Reisende:r fügt ihn selbst in eine Nachricht ein.

### A2: Bereits angemeldet

**Trigger:** Mitreisende:r ist auf dem Gerät schon angemeldet (Schritt 4)
**Flow:**

1. System nimmt die Einladung ohne erneute Anmeldung an.
2. Use Case wird bei Schritt 5 fortgesetzt.

### A3: Einladung ungültig

**Trigger:** Der Link ist abgelaufen oder wurde von einer anderen Person verwendet (Schritt 5)
**Flow:**

1. System zeigt «Diese Einladung ist ungültig oder abgelaufen.» bzw. «Diese Einladung wurde bereits verwendet.» und
   «Bitte um einen neuen Einladungslink.»
2. Mitreisende:r gelangt mit «Zu Little Footnotes» in die App, ohne Mitglied der Reise zu sein.

### A4: Mitreisende entfernen

**Trigger:** Besitzer:in möchte eine Person aus der Reise nehmen
**Flow:**

1. Besitzer:in tippt in der Mitgliederliste bei der Person auf das Papierkorb-Symbol.
2. System fragt «… entfernen?» mit dem Hinweis «Die bisherigen Beiträge bleiben in der Reise.»
3. Besitzer:in bestätigt mit «Entfernen»; System aktualisiert die Liste.

### A5: Reise verlassen

**Trigger:** Mitreisende:r möchte nicht mehr mitschreiben
**Flow:**

1. Mitreisende:r tippt in der Mitgliederliste beim eigenen Eintrag («(du)») auf das Symbol zum Verlassen.
2. System fragt «Reise verlassen?»; nach «Verlassen» verschwindet die Reise aus der eigenen Liste.

## Postconditions

### Success Postconditions

- Die eingeladene Person ist Mitglied der Reise und kann Beiträge erfassen, bearbeiten und löschen.
- Der Einladungslink ist verbraucht.

### Failure Postconditions

- Die eingeladene Person ist nicht Mitglied der Reise.

## Business Rules

### BR-026: Einladungslink

Ein Einladungslink ist 7 Tage gültig und kann nur von einer Person verwendet werden.

### BR-027: Jedes Mitglied lädt ein

Besitzer:in und Mitreisende dürfen Einladungslinks für die Reise erzeugen.

### BR-028: Mitgliedschaft beenden

Nur die Besitzer:in kann Mitreisende entfernen; Mitreisende können die Reise selbst verlassen. Die Besitzer:in kann
weder entfernt werden noch austreten. Beiträge bleiben in jedem Fall in der Reise.
