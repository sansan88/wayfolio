# Use Case: Tagebuch per Link lesen

## Overview

**Use Case ID:** UC-011  
**Use Case Name:** Tagebuch per Link lesen  
**Primary Actor:** Follower  
**Goal:** Ohne App und ohne Konto erfahren, wo die Reisenden sind und wie es ihnen geht  
**Status:** Implemented

**Anforderungen:** FR-017, FR-053, FR-054, FR-055, NFR-002, NFR-006, NFR-008, NFR-009, NFR-010

## Preconditions

- Der Follower hat einen gültigen Secret Link der Reise erhalten (UC-010).

## Main Success Scenario

1. Follower öffnet den Link im Browser.
2. System prüft den Link und zeigt das Tagebuch mit den Beiträgen, neueste zuerst.
3. Follower scrollt durch die Beiträge, sieht Fotos, Texte, Orte und Links.
4. Follower öffnet die Karte über den Knopf oben rechts.
5. System zeigt die Route mit allen Orten.
6. Follower tippt auf einen Ort und springt mit «‹ Tagebuch» zurück zum Tagebuch.

## Alternative Flows

### A1: Beitrags-Link

**Trigger:** Der Link gilt nur für einen Beitrag (Schritt 1)
**Flow:**

1. System zeigt nur diesen einen Beitrag, ohne Zugang zur übrigen Reise.

### A2: Link gesperrt oder ungültig

**Trigger:** Der Link ist gesperrt oder existiert nicht (Schritt 2)
**Flow:**

1. System zeigt einen Hinweis, dass der Link nicht mehr gilt, ohne Reisedaten preiszugeben.

### A3: Ort aus einem Beitrag öffnen

**Trigger:** Follower tippt in einem Beitrag auf den Ort (Schritt 3)
**Flow:**

1. System öffnet die Karte genau an diesem Ort.

### A4: Updates per E-Mail

**Trigger:** Follower tippt unten auf «Updates per E-Mail»
**Flow:**

1. Siehe [UC-013](UC-013-newsletter-abonnieren.md).

## Postconditions

### Success Postconditions

- Follower hat die Beiträge gesehen; es wird kein Konto angelegt und nichts gezählt, das Reisende als Reichweite sehen.

### Failure Postconditions

- Bei ungültigem Link werden keine Reisedaten ausgeliefert.

## Business Rules

### BR-012: Kein Konto für Follower

Follower lesen ohne Konto; der Zugriff läuft ausschliesslich über die Prüfung des Secret Links.

### BR-013: Keine Downloads

Die Follower-Ansicht bietet keinen Download für Fotos und Videos.

### BR-014: Keine Reichweite

Es gibt keine Likes, Followerzahlen oder Aufrufzahlen; Beiträge erscheinen chronologisch.
