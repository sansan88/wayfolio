# Use Case: In der Nähe entdecken

## Overview

**Use Case ID:** UC-022  
**Use Case Name:** In der Nähe entdecken  
**Primary Actor:** Reisende:r  
**Secondary Actor:** Andere Reisende (Tipps), Wikipedia, OpenStreetMap  
**Goal:** Unterwegs sehen, was es rund um den eigenen Standort zu entdecken gibt  
**Status:** Implemented

**Anforderungen:** FR-086, FR-087

## Preconditions

- Reisende:r ist angemeldet.
- Standort freigegeben oder die aktuelle Reise hat mindestens einen Ort.

## Main Success Scenario

1. Reisende:r tippt im Feed oben links auf den Kompass.
2. System ermittelt den Ausgangspunkt: GPS, falls freigegeben, sonst den letzten Ort der Reise («Rund um …»).
3. System zeigt im Reiter «Reisende» die Links aus Beiträgen anderer Reisen im Umkreis (Standard 25 km), sortiert
   nach Distanz, mit Dienst (z. B. Google Maps, Airbnb, Instagram) und «N× empfohlen», wenn mehrere denselben Link
   gesetzt haben.
4. Reisende:r wechselt zu «Wikipedia» (Artikel mit Ortsangabe, Deutsch vor Englisch, höchstens 10 km) oder «Orte»
   (Aussichtspunkte, Strände, Wasserfälle, Campingplätze, Museen … aus OpenStreetMap, höchstens 25 km).
5. Reisende:r tippt einen Eintrag an; der Link öffnet sich in einem neuen Tab.

## Alternative Flows

### A1: Umkreis ändern

**Trigger:** Reisende:r wählt 5, 10, 25 oder 50 km.
**Flow:**

1. System lädt die Liste der gewählten Quelle neu (Ergebnisse werden pro Ort, Quelle und Umkreis zwischengespeichert).

### A2: Standort neu bestimmen

**Trigger:** Reisende:r tippt oben rechts auf das Standort-Symbol.
**Flow:**

1. System fragt GPS ab und lädt die Liste für den neuen Ort.

### A3: Nichts gefunden oder Quelle nicht erreichbar

**Flow:**

1. System zeigt einen Hinweis (z. B. grösseren Umkreis probieren bzw. später nochmals versuchen).

### A4: Eigene Links nicht teilen

**Trigger:** Reisende:r schaltet unter «Reise bearbeiten» «Links als Tipps teilen» aus.
**Flow:**

1. Links dieser Reise erscheinen bei anderen nicht mehr.

## Postconditions

- Es wird nichts gespeichert; eigene Reisen erscheinen nie in den eigenen Tipps.

## Datenschutz

- Tipps (RPC `nearby_tips`): nur Link (Teilen-/Tracking-Parameter entfernt), Seitentitel des Links und Ort auf zwei
  Nachkommastellen gerundet (~1 km), Distanz nur vom gerundeten Punkt. Nie Namen, Reisetitel, Texte oder Fotos. Nur
  Beiträge mit Sichtbarkeit «Follower», frühestens 24 h bzw. nach der Standort-Verzögerung der Reise.
- Wikipedia über die Edge Function `nearby` (Wikipedia sieht nur den Server und den gerundeten Ort).
- OpenStreetMap direkt aus dem Browser (overpass-api.de lehnt Anfragen aus Rechenzentren ab), gerundeter Ort.
