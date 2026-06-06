## 5. Bausteinsicht

### 5.1 Ebene 1 — Gesamtsystem

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial

package "LoL Coach System" {
  component "Bridge\n(Node.js / TypeScript)" as bridge
  component "Flutter Desktop App\n(Dart)" as app
}

bridge -right-> app : "WebSocket :8765"
@enduml
```

| Baustein | Verantwortung |
|---------|---------------|
| **Bridge** | Datenbeschaffung, Ereigniserkennung, Empfehlungsgenerierung, WebSocket-Server |
| **Flutter App** | Benutzeroberfläche, Verbindungsverwaltung, Darstellung von Spielzustand und Empfehlungen |

### 5.2 Ebene 2 — Bridge (Whitebox)

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam ArrowColor #555555

package "bridge/src" {
  component "index.ts\n[Composition Root]" as index
  component "orchestrator.ts\n[BridgeOrchestrator]" as orch
  component "poller.ts\n[LiveClientPoller]" as poller
  component "parser.ts\n[parseGameState()]" as parser
  component "eventDetector.ts\n[EventDetector]" as detector
  component "heuristic.ts\n[buildCompProfile / getHeuristicRec]" as heuristic
  component "stateMinifier.ts\n[minifyGameState]" as minifier
  component "llmProvider.ts\n[Factory + Interface]" as llmprov
  component "wsServer.ts\n[BridgeWsServer]" as wsserver

  package "data/" {
    component "champions.json" as champ
    component "items.json" as items
  }

  package "providers/" {
    component "claudeProvider.ts" as claude
    component "openaiProvider.ts" as openai
    component "geminiProvider.ts" as gemini
  }
}

index --> orch
orch --> poller
orch --> parser
orch --> detector
orch --> heuristic
orch --> minifier
orch --> llmprov
orch --> wsserver
llmprov --> claude
llmprov --> openai
llmprov --> gemini
heuristic --> champ
heuristic --> items
@enduml
```

**Schnittstellenübersicht Bridge-intern:**

| Schnittstelle | Von | Nach | Typ |
|--------------|-----|------|-----|
| `DataFetcher` | `LiveClientPoller` | extern (Riot API) | Async-Funktion |
| `AllGameData` | `LiveClientPoller` | `BridgeOrchestrator` | TypeScript-Interface (Zod-validiert) |
| `ParsedGameState` | `parseGameState()` | `EventDetector`, `BridgeOrchestrator` | TypeScript-Interface |
| `GameEvent[]` | `EventDetector` | `BridgeOrchestrator` | Discriminated Union |
| `ItemRecommendation` | `heuristic.ts` / `LlmProvider` | `BridgeWsServer` | TypeScript-Interface |
| `WsMessage` | `BridgeWsServer` | Flutter App | JSON over WebSocket |

### 5.3 Ebene 2 — Flutter App (Whitebox)

```
flutter_app/lib/
│
├── main.dart               ← Entry Point, Provider-Setup, Bridge-Autostart
│
├── services/
│   └── ws_service.dart     ← [WsService extends ChangeNotifier]
│                              WebSocket-Client, State-Machine, Auto-Reconnect
│
├── screens/
│   ├── main_screen.dart    ← [MainScreen] Bottom-Navigation, Snackbar-Fehler
│   └── home_screen.dart    ← [HomeScreen] Coach-Tab, Status-Routing
│
├── widgets/
│   ├── connection_form.dart      ← Verbindungseinstellungen, Provider-Auswahl
│   ├── game_view.dart            ← Hauptansicht während Spiel
│   ├── game_top_bar.dart         ← Spielmodus, Zeit, Gold
│   ├── local_player_card.dart    ← Eigener Champion, Stats, Items
│   ├── recommendation_panel.dart ← Item-Vorschläge + Erklärung
│   ├── scoreboard.dart           ← Teamansicht (Allies / Enemies)
│   └── shared_widgets.dart       ← Wiederverwendbare UI-Komponenten
│
├── models/
│   ├── game_state.dart
│   ├── player.dart
│   ├── active_player.dart
│   ├── item.dart
│   ├── recommendation.dart
│   └── ws_message.dart
│
└── theme/
    └── app_colors.dart     ← Zentrales Farbschema (LoL-Dark-Theme)
```

**State-Machine `WsService`:**

```plantuml
@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial

[*] --> disconnected

disconnected --> connecting : connect()
connecting --> connected : CONNECTED-Nachricht\nempfangen
connecting --> disconnected : Fehler / Timeout
connected --> disconnected : stream done /\nstream error
disconnected --> connecting : _scheduleReconnect()\n1 s → 2 s → 4 s → max. 30 s
@enduml
```

### 5.4 Ebene 3 — LLM Provider (Whitebox)

```plantuml
@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam classAttributeIconSize 0

interface LlmProvider {
  +getExplanation(state, rec): Promise<string>
}

class ClaudeProvider {
  sdk: @anthropic-ai/sdk
  model: claude-haiku-4-5-20251001
}

class OpenAiProvider {
  sdk: openai
  model: gpt-4o-mini
}

class GeminiProvider {
  sdk: @google/generative-ai
  model: gemini-2.0-flash
}

ClaudeProvider ..|> LlmProvider
OpenAiProvider ..|> LlmProvider
GeminiProvider ..|> LlmProvider
@enduml
```

Alle drei Provider:
- erhalten denselben `SYSTEM_PROMPT` aus `llmProvider.ts`
- sind auf 150 Output-Tokens limitiert
- fallen bei Fehler auf die heuristische `reasoning`-Zeichenkette zurück

---
