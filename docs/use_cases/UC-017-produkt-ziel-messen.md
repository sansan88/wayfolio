# Use Case: Produkt-Ziel messen

## Overview

**Use Case ID:** UC-017  
**Use Case Name:** Produkt-Ziel messen  
**Primary Actor:** Betreiber  
**Goal:** Erkennen, ob Reisen bis zum Ende lebendig bleiben (Produkt-Ziel in [vision.md](../vision.md))  
**Status:** Draft

**Anforderungen:** FR-080, FR-081, FR-082, FR-083, NFR-018, C-015

## Preconditions

- Der Betreiber hat Zugriff auf die Auswertung.
- Mindestens eine Reise hat ein Startdatum.

## Main Success Scenario

1. Betreiber öffnet die Auswertung.
2. System berechnet pro Reise die Reisetage vom Start bis zum Ende bzw. bis heute in der Zeitzone der Reise.
3. System zeigt pro Reise den Anteil Reisetage mit mindestens einem Beitrag.
4. System zeigt für abgeschlossene Reisen, ob in der letzten Reisewoche Beiträge erfasst wurden.
5. System zeigt die mittlere Erfassungsdauer eines Beitrags.
6. Betreiber vergleicht die Werte mit den Zielwerten des Produkt-Ziels.

## Alternative Flows

### A1: Reise ohne Enddatum

**Trigger:** Die Reise hat kein Enddatum (Schritt 2)
**Flow:**

1. System rechnet bis heute und zählt die Reise nicht als abgeschlossen.

### A2: Testreisen

**Trigger:** Reisen des Testkontos oder Reisen ohne Beiträge (Schritt 2)
**Flow:**

1. System schliesst sie aus der Auswertung aus und weist ihre Anzahl aus.

## Postconditions

### Success Postconditions

- Der Betreiber kennt die aktuellen Werte beider Messgrössen und kann das Produkt-Ziel am 27.02.2027 überprüfen.

### Failure Postconditions

- Keine Werte werden verändert; die Auswertung liest nur.

## Business Rules

### BR-018: Reisetag

Ein Reisetag ist ein Kalendertag zwischen Start- und Enddatum in der Zeitzone der Reise; ein Beitrag zählt für den
Tag seines Zeitpunkts, auch wenn er rückdatiert wurde.

### BR-019: Ohne Tracking

Die Messung nutzt nur Daten, die die App ohnehin speichert, plus eine anonyme Erfassungsdauer – kein
Drittanbieter-Tracking, keine Cookies für Follower.

### BR-020: Nur aggregiert

Die Auswertung zeigt Anteile pro Reise, keine Inhalte von Beiträgen.
