# Use Case: Reise-Link mit Passwort schützen

## Overview

**Use Case ID:** UC-019  
**Use Case Name:** Reise-Link mit Passwort schützen  
**Primary Actor:** Reisende:r  
**Secondary Actor:** Follower  
**Goal:** Verhindern, dass ein weitergeleiteter oder öffentlich geposteter Reise-Link allein Zugang gibt  
**Status:** Draft

**Anforderungen:** FR-090, FR-091, FR-092, FR-093, FR-094, FR-095, NFR-021 · Konzept:
[konzept-zugangsschutz.md](../konzept-zugangsschutz.md)

## Preconditions

- Die Person ist angemeldet und Mitglied der Reise.

## Main Success Scenario

1. Reisende:r öffnet die Reise-Einstellungen und schaltet «Passwort für den Reise-Link» ein.
2. Reisende:r gibt ein Passwort ein und speichert.
3. System speichert das Passwort geschützt und meldet, dass Follower es beim ersten Öffnen eingeben müssen.
4. Reisende:r teilt die Reise; das Teilen-Menü zeigt «Passwort geschützt» und bietet «Link teilen» und «Passwort kopieren» getrennt an.
5. Reisende:r schickt Link und Passwort auf getrennten Wegen.
6. Follower öffnet den Link.
7. System zeigt «Diese Reise ist geschützt» und ein Passwortfeld, ohne Titel oder Inhalte der Reise.
8. Follower gibt das Passwort ein.
9. System prüft das Passwort, merkt sich die Freigabe für dieses Gerät und zeigt das Tagebuch.

## Alternative Flows

### A1: Falsches Passwort

**Trigger:** Das Passwort stimmt nicht (Schritt 9)
**Flow:**

1. System meldet «Passwort stimmt nicht».
2. Use Case wird bei Schritt 8 fortgesetzt.

### A2: Zu viele Fehlversuche

**Trigger:** 5 Fehlversuche in 15 Minuten (Schritt 9)
**Flow:**

1. System nimmt für 15 Minuten keine weiteren Versuche an und sagt das.

### A3: Gerät bereits freigeschaltet

**Trigger:** Das Gerät hat das aktuelle Passwort schon eingegeben (Schritt 6)
**Flow:**

1. System zeigt direkt das Tagebuch (UC-011).

### A4: Passwort ändern

**Trigger:** Reisende:r ändert das Passwort (Schritt 1–2)
**Flow:**

1. System speichert das neue Passwort und hebt alle bisherigen Freigaben auf.
2. Alle Follower müssen das neue Passwort beim nächsten Öffnen eingeben.

### A5: Passwort entfernen

**Trigger:** Reisende:r schaltet das Passwort aus
**Flow:**

1. Der Reise-Link öffnet wieder ohne Passwort.

### A6: Newsletter einer geschützten Reise

**Trigger:** Follower möchte Updates per E-Mail (UC-013)
**Flow:**

1. System bietet das Abonnieren erst an, wenn das Gerät freigeschaltet ist.

## Postconditions

### Success Postconditions

- Nur Geräte, die das aktuelle Passwort eingegeben haben, erhalten Reisedaten.

### Failure Postconditions

- Ein nicht freigeschaltetes Gerät erhält keinerlei Reisedaten.

## Business Rules

### BR-055: Optional

Das Passwort ist pro Reise optional; Standard bleibt «Link genügt».

### BR-056: Passwort getrennt

Das Passwort steht nie automatisch im geteilten Text und nie im Instagram-Bild.

### BR-057: Speicherung

Passwörter werden nur als Hash gespeichert; die Reisenden können ein vergessenes Passwort nur neu setzen.

### BR-058: Beitrags-Links

Offen (Entscheid PO): Empfehlung, dass Beitrags-Links ohne Passwort öffnen, weil sie gezielt geteilt werden und
einzeln sperrbar sind.
