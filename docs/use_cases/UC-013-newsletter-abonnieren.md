# Use Case: Newsletter abonnieren

## Overview

**Use Case ID:** UC-013  
**Use Case Name:** Newsletter abonnieren  
**Primary Actor:** Follower  
**Goal:** Neue Fussnoten der Reise per E-Mail erhalten  
**Status:** Implemented

**Anforderungen:** FR-060, FR-061, FR-063, NFR-012

## Preconditions

- Der Follower hat das Tagebuch über einen gültigen Reise-Link geöffnet (UC-011).

## Main Success Scenario

1. Follower tippt unten im Tagebuch auf «Updates per E-Mail».
2. System zeigt die Wahl der Häufigkeit («bei jedem Beitrag» oder «wöchentlich») und ein Feld für die E-Mail.
3. Follower wählt die Häufigkeit, gibt die E-Mail ein und bestätigt.
4. System sendet einen Bestätigungslink an die Adresse.
5. Follower öffnet den Bestätigungslink.
6. System legt das Konto an, aktiviert das Abo und zeigt «Meine Abos».

## Alternative Flows

### A1: Konto besteht bereits

**Trigger:** Die Adresse hat schon ein Konto (Schritt 4)
**Flow:**

1. System sendet einen Anmeldelink; nach dem Öffnen ist das Abo dieser Reise aktiv.

### A2: Bestätigung bleibt aus

**Trigger:** Der Follower öffnet den Bestätigungslink nie (Schritt 5)
**Flow:**

1. Das Abo bleibt inaktiv; Reisende sehen es als «E-Mail nicht bestätigt».

### A3: Ungültige Adresse

**Trigger:** Die E-Mail hat kein gültiges Format (Schritt 3)
**Flow:**

1. System zeigt einen Hinweis und sendet nichts.

## Postconditions

### Success Postconditions

- Ein aktives Abo verbindet das Konto mit der Reise und der gewählten Häufigkeit.
- Jede Mail enthält einen Abmeldelink, der ohne Anmeldung funktioniert.

### Failure Postconditions

- Es wird kein aktives Abo angelegt und keine Mail an fremde Adressen ausser dem Bestätigungslink versendet.

## Business Rules

### BR-015: Bestätigung

Ein Abo wird erst nach Bestätigung über den Link aktiv (Double Opt-in).

### BR-016: Nur mit Reise-Link

Abonnieren ist nur mit einem gültigen Follower-Link der Reise möglich.

### BR-017: Häufigkeit

«Bei jedem Beitrag» versendet neue Beiträge beim nächsten Lauf (alle 15 Minuten); «wöchentlich» höchstens alle
sieben Tage eine Zusammenfassung.
