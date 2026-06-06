## 8. Querschnittliche Konzepte

### 8.1 Typsicherheit und Validierung

Das System setzt durchgehend auf statische Typen (TypeScript strict, Dart-Typsystem) und runtime-Validierung an der Systemgrenze.

**Strategie:** Zod-Schemas validieren alle Daten, die von der Riot-API empfangen werden. Innerhalb der Bridge werden nur typisierte Objekte weitergereicht — kein `any`, kein ungeprüftes JSON.

```typescript
// Eingehende Daten → immer durch Zod-Schema
const parsed = AllGameDataSchema.safeParse(raw);
if (!parsed.success) {
  console.warn("[Poller] Unexpected data format:", parsed.error.issues[0]);
  return; // Verarbeitung abgebrochen, kein Crash
}
// Ab hier: parsed.data ist vollständig typisiert
```

### 8.2 Fehlerbehandlung

| Ebene | Strategie |
|-------|-----------|
| Riot-API-Polling | Transiente Fehler werden bis zu `MAX_POLL_FAILURES = 3` toleriert; erst dann wird `GAME_INACTIVE` gebroadcastet |
| LLM-API-Aufruf | Bei Fehler wird auf die heuristische `reasoning`-Zeichenkette zurückgefallen — kein User-sichtbarer Fehler |
| WebSocket-Verbindung (Client) | Automatischer Reconnect mit exponentiellem Backoff (1 s → 2 s → 4 s → max. 30 s) |
| Zod-Validierungsfehler | Verarbeitung der aktuellen Nachricht wird abgebrochen; Polling läuft weiter |
| JSON-Parse-Fehler (WS) | `console.warn` mit gekürzter Rohdaten-Ausgabe; Verbindung bleibt offen |

### 8.3 Sicherheit

| Maßnahme | Implementierung |
|---------|-----------------|
| API-Key-Speicherung | `flutter_secure_storage` (macOS Keychain / Windows DPAPI / Linux libsecret) |
| TLS-Bypass (Riot-API) | `rejectUnauthorized: false` nur für `127.0.0.1:2999` — lokal, kein Angriffsrisiko |
| API-Key-Übertragung | Nur über lokale WebSocket-Verbindung (LAN); keine externe Übertragung |
| Dependency-Sicherheit | `npm audit` in CI; `pkg` → `@yao-pkg/pkg` (CVE GHSA-22r3-9w55-cj54 behoben) |
| License-Compliance | `license-checker-rseidelsohn` in CI; GPL/AGPL werden abgelehnt |

### 8.4 Testkonzept

| Ebene | Technologie | Abdeckung |
|-------|-------------|-----------|
| Unit-Tests Bridge | Jest + ts-jest | EventDetector, Parser, Heuristik, alle LLM-Provider, Poller, WsServer, Orchestrator, StateMinifier |
| Integrationstests Bridge | Jest | 5 realistische Spielverläufe (Losing/Winning/Scaling) |
| Unit-Tests Flutter | flutter_test | WsService State-Machine, Model-Deserialisierung |
| Testinfrastruktur | `fixtures.ts`, `FakeWebSocketChannel` | Vorgefertigte Testdaten; kein echter Netzwerkzugriff |

**Testprinzipien:**
- Dependency Injection in allen Kernklassen (Testbarkeit durch Konstruktor-Parameter)
- LLM-Provider werden durch Jest-Mocks ersetzt
- `clock: () => number` in `BridgeOrchestrator` ermöglicht Zeitsteuerung in Tests

### 8.5 Token-Optimierung (LLM)

Vor jedem LLM-Aufruf wird der Spielzustand durch `minifyGameState()` komprimiert:

```
Eingabe (Riot-API JSON):  ~4.000 Zeichen
Ausgabe (minifiziert):    ~200 Zeichen

Beispielausgabe:
  Time: 12:30
  Me: Ahri (Lvl 8, Gold: 1240, KDA: 3/1/2)
  My Items: Luden's Tempest, Sorcerer's Shoes
  Allies: Jinx (Lvl 7, KDA: 5/0/1), ...
  Enemies: Malphite (Lvl 8, KDA: 1/2/0), ...
```

Negative Spielzeiten (Ladebildschirm) werden auf `0:00` geclippt.

### 8.6 LLM-Cooldown

Um unkontrollierte API-Kosten zu vermeiden, wird ein LLM-Aufruf nur ausgelöst, wenn:

1. Ein LLM-Provider konfiguriert ist
2. Mindestens ein Flutter-Client verbunden ist
3. Das Ereignis `GAME_STARTED` ist — oder —
   `PLAYER_DIED` **und** Gold ≥ `HIGH_GOLD_THRESHOLD` (1.000) **und** letzte LLM-Anfrage vor mehr als `DEFAULT_LLM_COOLDOWN_MS` (7 Minuten)

### 8.7 Konfigurierbarkeit

| Parameter | Ort | Default |
|-----------|-----|---------|
| WebSocket-Port | `WS_PORT` (Umgebungsvariable) | 8765 |
| Summoner-Name | `SUMMONER_NAME` (Umgebungsvariable) oder WS-Nachricht `SET_SUMMONER` | (leer) |
| LLM-Anbieter | WS-Nachricht `SET_LLM_PROVIDER` oder `ANTHROPIC_API_KEY` (Umgebungsvariable) | Keiner |
| Champion-Klassifikationen | `bridge/src/data/champions.json` | Eingebaut |
| Item-Namen | `bridge/src/data/items.json` | Eingebaut |
| Heuristik-Schwellwerte | `champions.json → thresholds` | Eingebaut |

---
