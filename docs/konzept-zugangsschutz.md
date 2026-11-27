# Konzept: Zugangsschutz für Reise-Links

Stand 2026-11-27 · Status: zur Entscheidung durch Sandro Scalco · Anforderungen FR-090 – FR-099, Use Cases
UC-019, UC-020

## Ausgangslage

Heute genügt der Secret Link (`/t/<token>`): Wer ihn hat, liest mit. Das ist bewusst einfach – keine App, kein
Konto (Vision: «Daheim weiss man, wie es geht»). Das Risiko: Wird der Link weitergeleitet oder öffentlich gepostet,
liest jede und jeder mit, bis die Reisenden ihn erneuern («Neuen Link erzeugen», der alte wird gesperrt).

Schon vorhanden und für beide Ideen nutzbar:

- Follower haben eine **Geräte-Identität**: Beim ersten Mitmachen (z. B. Abstimmen) geben sie einen Namen ein; das
  Gerät bekommt ein zufälliges Token, gespeichert im Browser, der Server kennt nur den Hash (`followers`).
- `followers.blocked_at` erlaubt schon, ein einzelnes Gerät zu sperren.
- Abonnent:innen des Newsletters haben ein Konto (Magic Link).

## Idee 1: Link + Passwort

**Ablauf.** In den Reise-Einstellungen legen die Reisenden optional ein Passwort fest. Wer den Link öffnet, sieht
zuerst nur «Diese Reise ist geschützt» und ein Passwortfeld – keinen Titel, keine Fotos. Nach dem richtigen
Passwort merkt sich das Gerät die Freigabe; danach öffnet der Link wie heute direkt das Tagebuch.

**Beim Teilen.** Das Teilen-Menü der Reise zeigt, dass ein Passwort gilt, und bietet zwei getrennte Schritte:
«Link teilen» und «Passwort kopieren». Der Hinweis empfiehlt, das Passwort auf einem anderen Weg zu schicken
(z. B. persönlich oder per SMS statt in dieselbe Gruppe). Die Beitrags-Einleitung («Wir sind heute hier.») bleibt
gleich; das Passwort steht nie automatisch im geteilten Text.

**Technik (Skizze).**

- `share_links.password_hash` (bcrypt über `pgcrypto`) und `password_version` (Zähler).
- `follower-api` prüft bei jedem Aufruf: Ist ein Passwort gesetzt und das Gerät nicht für die aktuelle
  `password_version` freigeschaltet, gibt es nur `{ locked: true }` zurück.
- Neue Aktion `unlock` mit Passwort → bei Erfolg wird die Freigabe am Geräte-Token gespeichert
  (`followers.unlocked_version`). Ohne Namen möglich: Das Gerät wird dabei als Follower angelegt.
- **Bremse gegen Durchprobieren:** höchstens 5 Fehlversuche pro Link und Gerät in 15 Minuten, danach Wartezeit.
- **Passwort ändern** erhöht `password_version`: Alle Geräte müssen das neue Passwort eingeben. **Passwort
  entfernen** macht den Link wieder offen.

**Offene Punkte zur Entscheidung.**

1. **Beitrags-Links** (`/p/<token>`): Empfehlung *ohne* Passwort – sie werden gezielt für einen Moment geteilt,
   zeigen nur diesen Beitrag und lassen sich einzeln sperren. Alternative: Passwort der Reise gilt auch dort.
2. **Newsletter:** Abonnieren nur nach Freischaltung (sonst umgeht man das Passwort über die Mail). Bestehende
   Abos bleiben aktiv. Links in der Mail führen zur Reise; ein neues Gerät verlangt dort das Passwort.
3. **Instagram-Bild:** enthält keinen Link und keine Reise-Adresse – unabhängig vom Passwort.

**Bewertung.**

| Kriterium                       | Einschätzung                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| Schutz bei öffentlichem Posten  | Gut, solange das Passwort getrennt vom Link verschickt wird                                  |
| Aufwand für Follower            | Einmal pro Gerät ein Wort eingeben                                                           |
| Aufwand für Reisende            | Einmal festlegen, Passwort weitergeben                                                       |
| Grenzen                         | Wer Link *und* Passwort weitergibt, gibt den Zugang weiter; Safari löscht gespeicherte Daten einer Website nach 7 Tagen ohne Besuch, dann ist das Passwort erneut nötig (nicht bei der auf dem Home-Bildschirm installierten App) |
| Aufwand Umsetzung               | Klein bis mittel: Migration, `follower-api`, Sperrbildschirm, Reise-Einstellungen, Teilen-Menü |

## Idee 2: Registrierung bzw. Freigabe durch die Reisenden

Zwei Varianten:

**2a – Konto für Follower (Magic Link, wie beim Newsletter).** Follower melden sich mit ihrer E-Mail an; die
Reisenden sehen die Konten und können sie entfernen. Die Anmeldung bleibt auf dem Gerät erhalten (Sitzung mit
Refresh-Token), muss also nicht jedes Mal wiederholt werden – aber auf jedem neuen Gerät und nach dem Löschen der
Browserdaten. Hürde: Für viele Grosseltern ist «Mail auf dem Handy öffnen und Link antippen» der schwierigste
Schritt. Widerspricht dem Versprechen «ohne Konto» auf der Startseite.

**2b – Zugangsanfrage ohne Konto (empfohlen, falls Idee 2).** Wer den Link öffnet, gibt seinen Namen ein und
sendet eine Anfrage («Mami möchte mitlesen»). Die Reisenden sehen offene Anfragen in den Reise-Einstellungen
(und als Hinweis im Feed) und nehmen sie an oder lehnen ab. Das Gerät merkt sich die Freigabe über das bestehende
Geräte-Token.

- Vorteil: Der Link allein nützt niemandem; die Reisenden wissen genau, wer mitliest, und können einzelne Geräte
  sperren (`blocked_at` gibt es schon).
- Nachteil: Wartezeit bis zur Freigabe, Arbeit für die Reisenden, jedes neue Gerät braucht eine neue Anfrage.
- **Cookie oder Browser-Speicher?** Ein Cookie des Servers ginge nicht zuverlässig: Die Edge Function läuft auf
  einer anderen Domain als die App, Safari blockiert solche Drittanbieter-Cookies. Bleibt der Browser-Speicher
  (wie heute) – mit derselben 7-Tage-Grenze von Safari. Ein verlorenes Gerät müsste erneut anfragen; abmildern
  liesse sich das mit einer «Wiedererkennung»: gleicher Name auf demselben Link wird als Anfrage markiert
  («war schon freigegeben»), damit die Reisenden mit einem Tipp bestätigen.
- Cookie-Hinweis: Der Geräte-Speicher ist technisch notwendig und braucht kein Banner, gehört aber in die
  Datenschutzerklärung (`LegalPage.tsx`, `STAND`).

## Empfehlung

1. **Jetzt:** Idee 1 als **optionale** Einstellung pro Reise. Standard bleibt «Link genügt», damit das Versprechen
   «ohne App, ohne Konto» für alle gilt, die es nicht brauchen. Klein umzusetzen, schützt gegen öffentliches Posten.
2. **Später, falls Bedarf:** Variante 2b als dritte Stufe «Link + Freigabe». Die Einstellung wird dann zur Wahl
   *Zugang: Link genügt · Link + Passwort · Link + Freigabe*.
3. **Nicht:** Variante 2a – sie verschiebt die Hürde zu den Follower:innen und widerspricht der Vision.

Beide Ideen ändern die Datenbearbeitung nicht grundsätzlich (gleiche Geräte-Token), aber die Datenschutzerklärung
muss Passwort-Hash, Fehlversuche bzw. Anfragen nennen.
