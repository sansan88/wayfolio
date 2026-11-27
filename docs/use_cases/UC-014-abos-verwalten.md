# Use Case: Abos verwalten

## Overview

**Use Case ID:** UC-014  
**Use Case Name:** Abos verwalten  
**Primary Actor:** Abonnent:in (Abonnent:innen sehen: Reisende:r)  
**Goal:** Selbst steuern, wie oft und ob Mails zu einer Reise kommen – bzw. als Reisende wissen, wer sie bekommt  
**Status:** Implemented

**Anforderungen:** FR-062, FR-063, FR-065

## Preconditions

- Die Abonnent:in hat mindestens ein Abo bestätigt (UC-013).

## Main Success Scenario

1. Abonnent:in öffnet «Meine Abos», z. B. über «Abo-Einstellungen» in einer Newsletter-Mail, und meldet sich bei Bedarf
   an (UC-001).
2. System zeigt pro abonnierter Reise eine Karte mit der Häufigkeit («Bei jedem Beitrag» oder «Wöchentlich»), dem
   Schalter «Pausieren», «Reise lesen» und «Abo beenden».
3. Abonnent:in wählt eine andere Häufigkeit.
4. System speichert die Änderung sofort.
5. Abonnent:in schaltet «Pausieren» ein.
6. System speichert die Pause; bis zum Ausschalten kommen keine Mails zu dieser Reise.

## Alternative Flows

### A1: Abo beenden

**Trigger:** Abonnent:in tippt auf «Abo beenden» (Schritt 3)
**Flow:**

1. System fragt «Abo beenden?» mit «Du bekommst keine E-Mails mehr zu «…».»
2. Abonnent:in bestätigt mit «Beenden».
3. System entfernt das Abo und meldet «Abo beendet».

### A2: Abmelden über den Link in der Mail

**Trigger:** Abonnent:in tippt in einer Newsletter-Mail auf «Abmelden» (statt Schritt 1)
**Flow:**

1. System meldet das Abo ohne Anmeldung ab und zeigt «Abgemeldet» mit «Du bekommst keine E-Mails mehr zu «…».».
2. Ist der Link ungültig, zeigt das System «Hoppla» und «Der Abmelde-Link ist ungültig oder schon verwendet.».

### A3: Reise lesen

**Trigger:** Abonnent:in tippt auf «Reise lesen» (Schritt 2)
**Flow:**

1. System öffnet das Tagebuch der Reise über ihren Reise-Link (UC-011).
2. Ist der Reise-Link gesperrt, fehlt der Knopf.

### A4: Name ändern

**Trigger:** Abonnent:in möchte anders angesprochen werden (Schritt 2)
**Flow:**

1. Abonnent:in ändert unter «Dein Konto» den Namen.
2. System speichert ihn beim Verlassen des Feldes und meldet «Name gespeichert».

### A5: Noch keine Abos

**Trigger:** Das Konto hat kein aktives Abo (Schritt 2)
**Flow:**

1. System zeigt «Du hast noch keine Reise abonniert.» mit dem Hinweis, über den Reise-Link «Updates per E-Mail» zu
   wählen.

### A6: Änderung schlägt fehl

**Trigger:** Keine Verbindung oder Serverfehler (Schritt 4 oder 6)
**Flow:**

1. System meldet «Änderung konnte nicht gespeichert werden.» und zeigt wieder den gespeicherten Stand.

### A7: Abonnent:innen einer Reise sehen

**Trigger:** Reisende:r öffnet im Tab «Reisen» die Reise (statt Schritt 1)
**Flow:**

1. System zeigt unter «Newsletter-Abos» alle Abonnent:innen mit Name, E-Mail und Status («Bei jedem Beitrag»,
   «Wöchentlich», «pausiert» oder «E-Mail nicht bestätigt»).
2. Reisende:r tippt bei einer Person auf das Papierkorb-Symbol.
3. System fragt «… entfernen?» mit «… bekommt keine Updates dieser Reise mehr per E-Mail.»
4. Nach «Entfernen» löscht das System das Abo und nimmt die Person aus der Liste.

## Postconditions

### Success Postconditions

- Häufigkeit und Status des Abos sind gespeichert; der nächste Versand (UC-015) richtet sich danach.
- Ein beendetes, abgemeldetes oder entferntes Abo erhält keine Mails mehr.

### Failure Postconditions

- Das Abo bleibt im bisherigen Zustand.

## Business Rules

### BR-042: Pause

Ein pausiertes Abo erhält keine Mails. Während der Pause lässt sich die Häufigkeit nicht ändern.

### BR-043: Transparenz gegenüber den Reisenden

Alle Mitglieder einer Reise sehen Name, E-Mail-Adresse und Häufigkeit der Abonnent:innen und dürfen Abos entfernen.
«Meine Abos» weist die Abonnent:in darauf hin.

### BR-044: Abmelden ohne Anmeldung

Jede Mail enthält einen persönlichen Abmeldelink, der ohne Anmeldung funktioniert.

### Weitere Regeln

- BR-015 (Bestätigung) und BR-017 (Häufigkeit), siehe [UC-013](UC-013-newsletter-abonnieren.md).
