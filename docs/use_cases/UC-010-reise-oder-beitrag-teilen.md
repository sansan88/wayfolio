# Use Case: Reise oder Beitrag teilen

## Overview

**Use Case ID:** UC-010  
**Use Case Name:** Reise oder Beitrag teilen  
**Primary Actor:** Reisende:r  
**Goal:** Familie und Freunden den Zugang zur Reise oder zu einem einzelnen Moment geben  
**Status:** Implemented

**Anforderungen:** FR-050, FR-051, FR-052, NFR-006

## Preconditions

- Die Person ist angemeldet und Mitglied der Reise.

## Main Success Scenario

1. Reisende:r tippt bei einem Beitrag auf «Teilen».
2. System fragt, ob der Link zur ganzen Reise oder nur zu diesem Beitrag geteilt werden soll.
3. Reisende:r wählt «Ganze Reise».
4. System öffnet die Teilen-Funktion des Geräts mit Foto, Einleitung («Wir sind heute hier.» bzw. «Wir haben ein Update für euch») und Secret Link der Reise.
5. Reisende:r wählt den Empfänger, z. B. die Familiengruppe in WhatsApp.

## Alternative Flows

### A1: Nur diesen Beitrag teilen

**Trigger:** Reisende:r wählt «Nur dieser Beitrag» (Schritt 3)
**Flow:**

1. System erzeugt einen eigenen Secret Link für diesen Beitrag, falls noch keiner besteht.
2. Use Case wird bei Schritt 4 mit diesem Link fortgesetzt.

### A2: Link sperren

**Trigger:** Reisende:r möchte einen geteilten Link zurückziehen
**Flow:**

1. Reisende:r sperrt den Link.
2. System lehnt jeden weiteren Aufruf dieses Links ab.

### A3: Keine Teilen-Funktion

**Trigger:** Der Browser unterstützt die Teilen-Funktion nicht (Schritt 4)
**Flow:**

1. System kopiert Text und Link in die Zwischenablage und bestätigt das.

## Postconditions

### Success Postconditions

- Der Empfänger hat einen Link, der ohne Konto das Tagebuch bzw. den Beitrag öffnet (UC-011).

### Failure Postconditions

- Kein neuer Link ist erzeugt oder versendet.

## Business Rules

### BR-010: Secret Link

Ein Link ist nicht erratbar und nirgends auffindbar. Wer ihn hat, kann lesen; mehr Rechte gibt er nicht.

### BR-011: Beitrags-Link

Ein Beitrags-Link zeigt nur diesen Beitrag, nie die übrige Reise.
