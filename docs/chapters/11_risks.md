## 11. Risiken und technische Schulden

### 11.1 Risiken

| ID | Risiko | Wahrscheinlichkeit | Auswirkung | Maßnahme |
|----|--------|-------------------|------------|----------|
| R1 | **Riot ändert die Live Client API ohne Ankündigung** (undokumentiert) | Mittel | Hoch — Poller empfängt keine validen Daten mehr | Zod-Schemas schnell anpassen; CI-Alert bei Validierungsfehlern |
| R2 | **LLM-API-Kosten steigen** | Niedrig | Mittel — Nutzung wird unwirtschaftlich | Cooldown-Mechanismus vorhanden; Anbieter wechselbar |
| R3 | **`@yao-pkg/pkg` wird abandoned** | Niedrig | Mittel — kein Binary-Build mehr möglich | Fork oder Wechsel zu `nexe` als Alternative |
| R4 | **Windows-EPERM-Bug im Watchdog** | Niedrig | Niedrig — Bridge beendet sich fälschlich bei elevated privileges | Dokumentiert in `index.ts`; Workaround: Bridge manuell starten |
| R5 | **Riot blockiert Live Client API für Drittanwendungen** | Niedrig | Sehr hoch — gesamte Kernfunktion bricht weg | Kein technischer Workaround möglich; API-ToS beachten |

### 11.2 Technische Schulden

| ID | Schuld | Priorität | Aufwand | Beschreibung |
|----|--------|-----------|---------|-------------|
| S1 | **Statische Champion-Klassifikationen** | Hoch | Mittel | AP/CC/Healer-Listen decken nicht alle Champions ab und berücksichtigen keine Build-Varianzen (z. B. AP-Corki). Mittelfristig: Daten aus einer Community-API (Data Dragon) laden. |
| S2 | **Keine Flutter-Widget-Tests** | Hoch | Mittel | `GameView`, `RecommendationPanel`, `Scoreboard` sind ungetestet. Bei Refactorings fehlt das Safety Net. |
| S3 | **Kein E2E-Test (Bridge + App)** | Mittel | Hoch | Die Integration zwischen Bridge und Flutter ist nur manuell getestet. Ein automatisierter E2E-Test würde Regressions frühzeitig erkennen. |
| S4 | **Keine Build-Path-Strategie in `build_unix.sh`** | Niedrig | Niedrig | `cd`-basierte relative Pfade sind fragil. Wechsel zu absoluten Pfaden via `$(dirname "$0")` würde Fehler wie den zip-Pfadfehler strukturell verhindern. |
| S5 | **Jest 29 + ts-jest 29 — koordiniertes Upgrade ausstehend** | Niedrig | Niedrig | Jest 30 + ts-jest 30 sind verfügbar, müssen koordiniert gehoben werden. Kein funktionaler Impact. |
| S6 | **Keine Positions-Logik in der Heuristik** | Niedrig | Mittel | Empfehlungen unterscheiden nicht zwischen Support, Carry, Jungler. Ein ADC erhält die gleichen Empfehlungen wie ein Support. |

---
