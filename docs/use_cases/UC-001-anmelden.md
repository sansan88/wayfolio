# Use Case: Anmelden

## Overview

**Use Case ID:** UC-001  
**Use Case Name:** Anmelden  
**Primary Actor:** Reisende:r (auch Mitreisende:r)  
**Goal:** Ohne Passwort in die App gelangen und dort die eigenen Reisen sehen  
**Status:** Implemented

**Anforderungen:** FR-001, C-013

## Preconditions

- Die Person hat Zugriff auf ihr E-Mail-Postfach auf dem Gerät, mit dem sie sich anmelden will.

## Main Success Scenario

1. Reisende:r tippt auf der Startseite auf «Anmelden» oder «Kostenlos starten».
2. System zeigt die Anmeldeseite mit einem Feld für die E-Mail-Adresse.
3. Reisende:r gibt die E-Mail-Adresse ein und tippt auf «Anmeldelink senden».
4. System sendet einen Anmeldelink an die Adresse und zeigt «Schau in dein Postfach».
5. Reisende:r öffnet den Link aus der Mail auf diesem Gerät.
6. System meldet die Person an und öffnet den Feed der zuletzt gewählten Reise.

## Alternative Flows

### A1: Noch keine Reise

**Trigger:** Die Person ist neu oder hat noch keine Reise (Schritt 6)
**Flow:**

1. System zeigt «Eure erste Reise» zum Anlegen einer Reise.
2. Weiter mit [UC-002](UC-002-reise-anlegen-und-verwalten.md).

### A2: Andere E-Mail verwenden

**Trigger:** Reisende:r hat sich bei der Adresse vertippt (nach Schritt 4)
**Flow:**

1. Reisende:r tippt auf «Andere E-Mail verwenden».
2. Use Case wird bei Schritt 2 fortgesetzt.

### A3: Anmelden über eine Einladung

**Trigger:** Mitreisende:r öffnet einen Einladungslink ohne angemeldet zu sein (statt Schritt 1)
**Flow:**

1. System zeigt die Anmeldeseite mit «Du bist eingeladen».
2. Schritte 3 bis 5 wie oben; der Anmeldelink führt zurück zur Einladung.
3. Weiter mit [UC-003](UC-003-mitreisende-einladen.md), Annehmen der Einladung.

### A4: Versand schlägt fehl

**Trigger:** Der Anmeldelink kann nicht gesendet werden (Schritt 4)
**Flow:**

1. System zeigt die Fehlermeldung unter dem Formular; die Eingabe bleibt erhalten.
2. Reisende:r versucht es erneut.

### A5: Bereits angemeldet

**Trigger:** Die Person ist schon angemeldet (Schritt 1)
**Flow:**

1. Im Browser zeigt die Startseite «Zur App» bzw. «Zu meinem Tagebuch» statt «Anmelden»; ein Tipp öffnet den Feed.
2. Die installierte App startet direkt im Feed.

### A6: Abmelden

**Trigger:** Reisende:r möchte sich auf diesem Gerät abmelden
**Flow:**

1. Reisende:r tippt im Tab «Reisen» auf «Abmelden».
2. System meldet die Person ab und zeigt wieder die Startseite.

## Postconditions

### Success Postconditions

- Die Person ist auf diesem Gerät angemeldet und bleibt es, bis sie sich abmeldet.
- Bei der ersten Anmeldung besteht ein Konto zur E-Mail-Adresse.

### Failure Postconditions

- Die Person bleibt abgemeldet; es werden keine Reisedaten angezeigt.

## Business Rules

### BR-021: Anmeldelink statt Passwort

Die Anmeldung erfolgt ausschliesslich über einen Link, der an die E-Mail-Adresse gesendet wird. Es gibt kein
Passwort.

### BR-022: Konto beim ersten Anmelden

Öffnet eine Person den Anmeldelink zum ersten Mal, entsteht ihr Konto. Mit der Anmeldung gilt die
Datenschutzerklärung.
