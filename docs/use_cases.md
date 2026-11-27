# Use Cases – Übersicht

Abgeleitet aus [requirements.md](requirements.md). Detaillierte Spezifikationen liegen in [use_cases/](use_cases/) (verlinkt in der Tabelle); die übrigen sind noch zu spezifizieren.

```mermaid
flowchart LR
    reisende([👤 Reisende:r])
    mitreisende([🧳 Mitreisende:r])
    follower([👀 Follower])
    abonnent([📧 Abonnent:in])
    besucher([🌐 Besucher:in])
    betreiber([🔧 Betreiber])
    system([🖥️ System])
    claude([🤖 Claude / Anthropic])

    subgraph "Little Footnotes"
        UC001[UC-001\nAnmelden]
        UC002[UC-002\nReise anlegen und verwalten]
        UC003[UC-003\nMitreisende einladen]
        UC004[UC-004\nBeitrag erfassen]
        UC005[UC-005\nBeitrag bearbeiten oder löschen]
        UC006[UC-006\nMit Claude schreiben]
        UC007[UC-007\nRückblick erstellen]
        UC008[UC-008\nEntscheidung stellen]
        UC009[UC-009\nReise nachlesen]
        UC010[UC-010\nReise oder Beitrag teilen]
        UC011[UC-011\nTagebuch per Link lesen]
        UC012[UC-012\nAn Entscheidung teilnehmen]
        UC013[UC-013\nNewsletter abonnieren]
        UC014[UC-014\nAbos verwalten]
        UC015[UC-015\nNewsletter versenden]
        UC016[UC-016\nIn Warteliste eintragen]
        UC017[UC-017\nProdukt-Ziel messen]
    end

    reisende --> UC001
    reisende --> UC002
    reisende --> UC003
    reisende --> UC004
    reisende --> UC005
    reisende --> UC006
    reisende --> UC007
    reisende --> UC008
    reisende --> UC009
    reisende --> UC010
    mitreisende --> UC001
    mitreisende --> UC004
    mitreisende --> UC005
    mitreisende --> UC006
    mitreisende --> UC009
    follower --> UC011
    follower --> UC012
    follower --> UC013
    abonnent --> UC014
    besucher --> UC016
    betreiber --> UC017
    system --> UC015
    UC006 --> claude
    UC007 --> claude
```

`UC-006` und `UC-007` setzen die KI-Einwilligung voraus (FR-030). Mitreisende werden durch `UC-003` zu Mitgliedern
der Reise.

## Rückverfolgbarkeit

| Use Case | Titel                           | Akteure                       | Anforderungen                          |
| -------- | ------------------------------- | ----------------------------- | -------------------------------------- |
| UC-001   | Anmelden                        | Reisende:r, Mitreisende:r     | FR-001                                 |
| UC-002   | Reise anlegen und verwalten     | Reisende:r                    | FR-002, FR-003, FR-006, FR-082         |
| UC-003   | Mitreisende einladen            | Reisende:r, Mitreisende:r     | FR-004, FR-005                         |
| [UC-004](use_cases/UC-004-beitrag-erfassen.md) | Beitrag erfassen                | Reisende:r, Mitreisende:r     | FR-010 – FR-016, FR-021, FR-045        |
| UC-005   | Beitrag bearbeiten oder löschen | Reisende:r, Mitreisende:r     | FR-015, FR-018, FR-019                 |
| [UC-006](use_cases/UC-006-mit-claude-schreiben.md) | Mit Claude schreiben            | Reisende:r, Mitreisende:r     | FR-030 – FR-033, FR-035                |
| UC-007   | Rückblick erstellen             | Reisende:r                    | FR-030, FR-034                         |
| UC-008   | Entscheidung stellen            | Reisende:r                    | FR-020                                 |
| UC-009   | Reise nachlesen                 | Reisende:r, Mitreisende:r     | FR-040 – FR-044, FR-046, FR-070 – FR-072 |
| [UC-010](use_cases/UC-010-reise-oder-beitrag-teilen.md) | Reise oder Beitrag teilen       | Reisende:r                    | FR-050 – FR-052                        |
| [UC-011](use_cases/UC-011-tagebuch-per-link-lesen.md) | Tagebuch per Link lesen         | Follower                      | FR-017, FR-053 – FR-055                |
| UC-012   | An Entscheidung teilnehmen      | Follower                      | FR-056                                 |
| [UC-013](use_cases/UC-013-newsletter-abonnieren.md) | Newsletter abonnieren           | Follower                      | FR-060, FR-061                         |
| UC-014   | Abos verwalten                  | Abonnent:in, Reisende:r       | FR-062, FR-063, FR-065                 |
| UC-015   | Newsletter versenden            | System                        | FR-064                                 |
| UC-016   | In Warteliste eintragen         | Besucher:in                   | FR-073, FR-074                         |
| [UC-017](use_cases/UC-017-produkt-ziel-messen.md) | Produkt-Ziel messen             | Betreiber                     | FR-080, FR-081, FR-083                 |
