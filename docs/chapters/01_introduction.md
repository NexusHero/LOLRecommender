## 1. Einführung und Ziele

### 1.1 Aufgabenstellung

**LoL Coach** ist ein KI-gestützter Item-Berater für das Spiel *League of Legends*. Das System liest während eines laufenden Spiels Echtzeit-Daten aus der lokalen Riot-Games-Live-Client-API aus, erkennt spielrelevante Ereignisse und gibt dem Spieler kontextbezogene Item-Empfehlungen — entweder regelbasiert oder durch eine KI-generierte Erklärung angereichert.

Das System löst folgendes Problem: Während eines Spiels müssen Spieler in kurzer Zeit entscheiden, welche Items sie als Nächstes kaufen. Diese Entscheidung hängt von der gegnerischen Teamzusammensetzung ab (AP/AD-Verhältnis, CC-Dichte, Heilchampions) und überfordert besonders unerfahrene Spieler.

### 1.2 Qualitätsziele

| Priorität | Qualitätsmerkmal | Ziel |
|-----------|-----------------|------|
| 1 | **Verfügbarkeit** | Empfehlungen sind auch ohne Internetzugang verfügbar (Heuristik-Modus) |
| 2 | **Reaktionszeit** | Heuristische Empfehlung in < 5 ms; LLM-Erklärung in < 3 s |
| 3 | **Sicherheit** | API-Keys werden im OS-Keychain gespeichert, nicht im Klartext |
| 4 | **Änderbarkeit** | Champion- und Item-Daten können ohne Code-Deployment aktualisiert werden |
| 5 | **Testbarkeit** | Alle Kernkomponenten sind durch Unit-Tests abgedeckt; Abhängigkeiten sind injizierbar |

### 1.3 Stakeholder

| Rolle | Erwartung |
|-------|-----------|
| **Spieler** | Schnelle, verständliche Item-Empfehlungen während des Spiels |
| **Entwickler** | Klare Komponentenstruktur, einfache Erweiterbarkeit um neue LLM-Anbieter |
| **Betreiber (Selbsthosting)** | Einfache Installation als eigenständige .exe/.app ohne externe Abhängigkeiten |

---
