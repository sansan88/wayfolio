# Use Case: Bild für Instagram erstellen

## Overview

**Use Case ID:** UC-018  
**Use Case Name:** Bild für Instagram erstellen  
**Primary Actor:** Reisende:r (auch Mitreisende:r)  
**Goal:** Einen erfassten Beitrag ohne erneutes Abtippen als Bild mit Datum und Ort auf Instagram teilen  
**Status:** Implemented

**Anforderungen:** FR-047, FR-057, FR-058, FR-059, NFR-019, NFR-020

## Preconditions

- Die Person ist angemeldet und Mitglied der Reise.
- Der Beitrag ist gespeichert.

## Main Success Scenario

1. Reisende:r tippt am Beitrag auf den Teilen-Knopf an der unteren Bildkante.
2. System zeigt die Teilen-Auswahl: «Nur diesen Beitrag teilen», «Mit Reise-Link teilen», «Bild für Instagram».
3. Reisende:r wählt «Bild für Instagram».
4. System erstellt im Format Story ein Bild im Stil der Produktseite mit Reisetag, Datum, Titel bzw. Ortschaft, Region und Land, dem ersten Foto und der Marke Little Footnotes und zeigt die Vorschau.
5. Reisende:r tippt auf «Teilen».
6. System öffnet das Teilen-Menü des Geräts mit dem Bild.
7. Reisende:r wählt Instagram und postet die Story in der Instagram-App.

## Alternative Flows

### A1: Beitrag statt Story

**Trigger:** Reisende:r wählt «Beitrag» (Schritt 4)
**Flow:**

1. System erstellt das Bild im Hochformat für den Feed neu.
2. Use Case wird bei Schritt 5 fortgesetzt.

### A2: Anderes Foto wählen

**Trigger:** Der Beitrag hat mehrere Fotos (Schritt 4)
**Flow:**

1. Reisende:r tippt auf ein anderes Vorschaubild.
2. System erstellt das Bild mit diesem Foto neu.

### A3: Beitrag ohne Foto

**Trigger:** Der Beitrag hat weder Foto noch Routenbild (Schritt 4)
**Flow:**

1. System zeigt statt des Fotos den Anfang des Textes als Zitat.

### A4: Kein Teilen-Menü

**Trigger:** Der Browser kann keine Bilder teilen (Schritt 6)
**Flow:**

1. System lädt das Bild herunter und meldet «Bild gespeichert – in Instagram auswählen».

### A5: Abbrechen

**Trigger:** Reisende:r tippt auf «Abbrechen» oder schliesst das Teilen-Menü (Schritt 5–7)
**Flow:**

1. Use Case endet ohne Änderung.

## Postconditions

### Success Postconditions

- Das Bild ist an die gewählte App übergeben; in Little Footnotes ändert sich nichts.

### Failure Postconditions

- Kein Bild wurde übergeben; der Beitrag ist unverändert.

## Business Rules

### BR-051: Formate

Story 1080 × 1920 px, Beitrag 1080 × 1350 px. In der Story bleiben die oberen und unteren 250 px frei von Text und
Foto, weil Instagram sie überdeckt.

### BR-052: Inhalt

Das Bild zeigt Reisetag (falls die Reise ein Startdatum hat), Datum, eigenen Titel oder sonst die Ortschaft,
darunter Region und Land, ein Foto und die Marke mit Adresse – aber keinen Reise-Link und keinen Secret Link.

### BR-053: Lokal erzeugt

Das Bild entsteht auf dem Gerät. Erst beim Teilen geht es an die App, die die Reisenden wählen.

### BR-054: Nur für Reisende

Das Instagram-Bild gibt es nur in der Ansicht der Reisegruppe, nicht für Follower.
