# Use Case: Mit Claude schreiben

## Overview

**Use Case ID:** UC-006  
**Use Case Name:** Mit Claude schreiben  
**Primary Actor:** Reisende:r (auch Mitreisende:r)  
**Secondary Actor:** Claude (Anthropic)  
**Goal:** Aus Stichworten und Fotos einen Entwurf erhalten oder vorhandenen Text überarbeiten lassen  
**Status:** Implemented

**Anforderungen:** FR-030, FR-031, FR-032, FR-033, FR-035, NFR-004, NFR-005, C-011

## Preconditions

- Der Beitrags-Dialog ist offen (UC-004 oder UC-005).
- Die Person ist Mitglied der Reise.

## Main Success Scenario

1. Reisende:r gibt einige Stichworte ein und/oder wählt Fotos.
2. Reisende:r tippt auf «Mit Claude schreiben».
3. System prüft die Einwilligung und das Tageslimit.
4. System sendet Stichworte, Ort, Zeitpunkt und bis zu vier verkleinerte Fotos an Claude.
5. System setzt den Entwurf (Titel und Text) in den Beitrag ein.
6. Reisende:r passt den Entwurf an.
7. Use Case endet; gespeichert wird erst beim Posten.

## Alternative Flows

### A1: Erste Nutzung ohne Einwilligung

**Trigger:** Es liegt keine Einwilligung vor (Schritt 3)
**Flow:**

1. System erklärt in einem Dialog, welche Daten an Anthropic gehen.
2a. Reisende:r tippt «Ja, aktivieren»: System speichert die Einwilligung; weiter bei Schritt 4.
2b. Reisende:r lehnt ab: Use Case endet ohne Datenübermittlung.

### A2: Vorhandenen Text überarbeiten

**Trigger:** Im Beitrag steht bereits Text (Schritt 2)
**Flow:**

1. System bietet Korrekturlesen, Kürzen, Länger, Umformulieren (mit eigenem Wunsch) oder Neu aus Stichworten an.
2. Reisende:r wählt eine Aktion.
3. Use Case wird bei Schritt 3 fortgesetzt.

### A3: Entwurf verwerfen

**Trigger:** Der Entwurf passt nicht (Schritt 6)
**Flow:**

1. Reisende:r tippt auf «Rückgängig».
2. System stellt den Text vor dem Entwurf wieder her.

### A4: Tageslimit erreicht

**Trigger:** Das Tageslimit ist ausgeschöpft (Schritt 3)
**Flow:**

1. System meldet, dass das Tageslimit erreicht ist.
2. Use Case endet; der Beitrag bleibt unverändert.

### A5: Claude nicht erreichbar

**Trigger:** Fehler oder Zeitüberschreitung (Schritt 4)
**Flow:**

1. System zeigt eine Fehlermeldung; Eingaben bleiben erhalten.

## Postconditions

### Success Postconditions

- Der Beitrag enthält einen Entwurf, der noch nicht gespeichert ist.
- Die Nutzung ist für das Tageslimit gezählt.

### Failure Postconditions

- Der Beitrag ist unverändert; ohne Einwilligung wurden keine Daten übermittelt.

## Business Rules

### BR-006: Einwilligung

Daten gehen nur an Anthropic, wenn eine Einwilligung gespeichert ist; der Server prüft das ebenfalls. Die
Einwilligung lässt sich im Profil jederzeit widerrufen.

### BR-007: Bildumfang

Höchstens vier Fotos pro Anfrage, verkleinert auf 1024 px.

### BR-008: Tageslimit

Höchstens 40 Anfragen pro Person und Tag (konfigurierbar).

### BR-009: Sprache und Stil

Entwürfe folgen der Schweizer Rechtschreibung und dem Stil der bisherigen Beiträge der Reise.
