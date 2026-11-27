# Use Case: In Warteliste eintragen

## Overview

**Use Case ID:** UC-016  
**Use Case Name:** In Warteliste eintragen  
**Primary Actor:** Besucher:in  
**Goal:** Die Produktseite in der eigenen Sprache lesen und beim Start öffentlicher Reisen informiert werden  
**Status:** Implemented

**Anforderungen:** FR-073, FR-074, C-009

## Preconditions

- Die Person hat die Startseite von Little Footnotes geöffnet.

## Main Success Scenario

1. System zeigt die Produktseite in der Sprache des Browsers (Deutsch, Englisch, Französisch oder Spanisch).
2. Besucher:in scrollt zu den Angeboten und sieht neben «Private Reise» (CHF 0) die «Öffentliche Reise» mit dem
   Vermerk «Bald verfügbar».
3. Besucher:in gibt unter «Sagt mir Bescheid, wenn es so weit ist» die E-Mail-Adresse ein und tippt auf «Eintragen».
4. System speichert die Adresse mit der Sprache des Browsers.
5. System zeigt «Danke – ihr steht auf der Liste. Wir melden uns, sobald öffentliche Reisen bereit sind.»

## Alternative Flows

### A1: Sprache wechseln

**Trigger:** Besucher:in möchte die Seite in einer anderen Sprache lesen (Schritt 1)
**Flow:**

1. Besucher:in wählt oben die Sprache.
2. System zeigt alle Texte der Produktseite in dieser Sprache und merkt sich die Wahl für den nächsten Besuch.

### A2: Bereits eingetragen

**Trigger:** Die Adresse steht schon auf der Warteliste (Schritt 4)
**Flow:**

1. System behandelt die Eintragung als Erfolg und speichert die Adresse kein zweites Mal.
2. Use Case wird bei Schritt 5 fortgesetzt.

### A3: Eintragen schlägt fehl

**Trigger:** Ungültige Adresse oder keine Verbindung (Schritt 4)
**Flow:**

1. System zeigt «Das hat nicht geklappt. Bitte Adresse prüfen und nochmals versuchen.»
2. Besucher:in korrigiert die Adresse und versucht es erneut.

### A4: Automatische Eintragung

**Trigger:** Ein Programm füllt das Formular automatisch aus (Schritt 3)
**Flow:**

1. System zeigt die Bestätigung, speichert aber nichts.

## Postconditions

### Success Postconditions

- Die E-Mail-Adresse steht einmal auf der Warteliste für öffentliche Reisen.

### Failure Postconditions

- Es wird keine Adresse gespeichert.

## Business Rules

### BR-048: Eine einzige Nachricht

Die Adresse wird nur verwendet, um einmalig über den Start öffentlicher Reisen zu informieren – kein Newsletter.
Eine Mail an das Team genügt, um den Eintrag zu löschen.

### BR-049: Ein Eintrag pro Adresse

Jede Adresse steht höchstens einmal auf der Warteliste, unabhängig von Gross- und Kleinschreibung. Lesen kann die
Liste nur der Betreiber.

### BR-050: Sprache der Produktseite

Die Produktseite gibt es auf Deutsch, Englisch, Französisch und Spanisch. Ohne gespeicherte Wahl gilt die Sprache des
Browsers, sonst Deutsch. Rechtstexte bleiben deutsch.

### Weitere Regeln

- Öffentliche Reisen selbst sind noch nicht gebaut (FR-075, Deferred).
