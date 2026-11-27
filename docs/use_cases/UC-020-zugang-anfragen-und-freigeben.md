# Use Case: Zugang anfragen und freigeben

## Overview

**Use Case ID:** UC-020  
**Use Case Name:** Zugang anfragen und freigeben  
**Primary Actor:** Follower  
**Secondary Actor:** Reisende:r  
**Goal:** Nur Menschen lesen mit, die die Reisenden einzeln freigegeben haben  
**Status:** Draft

**Anforderungen:** FR-096, FR-097, FR-098, FR-099 (alle `Deferred`) · Konzept:
[konzept-zugangsschutz.md](../konzept-zugangsschutz.md), Variante 2b

## Preconditions

- Die Reise steht auf der Zugangsstufe «Link + Freigabe».

## Main Success Scenario

1. Follower öffnet den Reise-Link.
2. System zeigt «Diese Reise ist privat» und ein Feld für den Namen.
3. Follower gibt den Namen ein und sendet die Anfrage.
4. System speichert die Anfrage für dieses Gerät und zeigt «Anfrage gesendet».
5. Reisende:r sieht die offene Anfrage in den Reise-Einstellungen und als Hinweis im Feed.
6. Reisende:r nimmt die Anfrage an.
7. Follower öffnet den Link erneut; System zeigt das Tagebuch.

## Alternative Flows

### A1: Anfrage ablehnen

**Trigger:** Reisende:r lehnt ab (Schritt 6)
**Flow:**

1. Das Gerät bleibt gesperrt; der Follower sieht «Kein Zugang».

### A2: Gerät später sperren

**Trigger:** Reisende:r möchte einen Zugang zurückziehen
**Flow:**

1. Reisende:r sperrt das Gerät in der Liste der Freigaben.
2. System liefert diesem Gerät keine Reisedaten mehr.

### A3: Bekannter Name auf neuem Gerät

**Trigger:** Der Name hatte auf diesem Link schon eine Freigabe (Schritt 4)
**Flow:**

1. System markiert die Anfrage als «war schon freigegeben», damit die Reisenden mit einem Tipp bestätigen.

## Postconditions

### Success Postconditions

- Das Gerät ist für die Reise freigegeben, bis es gesperrt wird.

### Failure Postconditions

- Das Gerät erhält keinerlei Reisedaten.

## Business Rules

### BR-059: Gerät statt Konto

Die Freigabe gilt pro Gerät und wird im Browser gespeichert; es gibt kein Konto. Safari kann diesen Speicher nach
7 Tagen ohne Besuch löschen – dann ist eine neue Anfrage nötig (nicht bei der installierten App).
