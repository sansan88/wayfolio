# Use Case: Erinnerung bei Funkstille

## Overview

**Use Case ID:** UC-021  
**Use Case Name:** Erinnerung bei Funkstille  
**Primary Actor:** System  
**Secondary Actor:** Reisende:r (Empfang, Einstellung)  
**Goal:** Reisende per E-Mail sanft erinnern, wenn einige Tage kein Beitrag mehr kam, damit die Reise lebendig bleibt  
**Status:** Implemented

**Anforderungen:** FR-084, FR-085

## Preconditions

- Die Reise läuft (Start erreicht, Ende nicht überschritten) und hat mindestens einen veröffentlichten Beitrag.
- Für die Reise ist eine Erinnerung eingestellt (Standard: nach 3 Tagen).

## Main Success Scenario

1. System startet alle 15 Minuten einen Lauf (zusammen mit dem Newsletter-Versand, UC-015).
2. System ermittelt die fälligen Reisen: letzter Beitrag (massgebend ist, wann er erfasst wurde) liegt mindestens so
   viele Tage zurück wie eingestellt, und seit diesem Beitrag ging noch keine Erinnerung raus.
3. System schickt allen Besitzer:innen der Reise mit bestätigter E-Mail eine Mail «Bist du noch da?» mit der Anzahl
   Tage seit dem letzten Beitrag, dem Hinweis auf Claude und dem Knopf «Beitrag schreiben».
4. System merkt sich den Zeitpunkt der Erinnerung; bis zum nächsten Beitrag kommt keine weitere.

## Alternative Flows

### A1: Erinnerung ändern oder ausschalten

**Trigger:** Reisende:r öffnet «Reise bearbeiten»
**Flow:**

1. Reisende:r wählt bei «Erinnerung» nach 2, 3, 5 oder 7 Tagen oder «aus» und sichert.

### A2: Vorschau

**Trigger:** Betreiber startet einen Probelauf (`dryRun`)
**Flow:**

1. System liefert Betreff und Inhalt jeder fälligen Erinnerung, versendet nichts und merkt sich nichts.

### A3: Versand schlägt fehl

**Trigger:** Die Mail kann nicht gesendet werden (Schritt 3)
**Flow:**

1. System hält den Fehler fest; ohne erfolgreichen Versand wird kein Zeitpunkt gesetzt und der nächste Lauf versucht
   es erneut.

## Postconditions

### Success Postconditions

- Die Besitzer:innen haben genau eine Erinnerung für diese Pause erhalten.

### Failure Postconditions

- Ohne erfolgreichen Versand bleibt die Reise fällig.

## Hinweise

- Die Erinnerung trifft etwa zur Tageszeit des letzten Beitrags ein, weil sie genau N Tage danach fällig wird.
- Mitreisende (Rolle `coauthor`) bekommen keine Erinnerung.
