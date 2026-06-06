## 6. Laufzeitsicht

### 6.1 Szenario: Spielstart mit LLM-Empfehlung

```plantuml
@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam sequenceArrowThickness 1.5
skinparam sequenceParticipantBorderColor #888888

participant "Flutter App" as app
participant "WsService" as ws
participant "Bridge" as bridge
participant "Riot API" as riot
participant "LLM API" as llm

app -> ws : connect()
ws -> bridge : WebSocket öffnen
bridge --> ws : CONNECTED
ws --> app : status: connected

bridge -> riot : GET /liveclientdata/allgamedata
riot --> bridge : 200 JSON

bridge -> bridge : poll() → parse()\ndetect() → GAME_STARTED
bridge -> bridge : buildCompProfile()\ngetHeuristicRec()\nminifyGameState()
bridge -> llm : POST (optional)
llm --> bridge : LLM-Antwort

bridge --> ws : GAME_STARTED (gameState)
ws --> app : UI aktualisieren
bridge --> ws : RECOMMENDATION (Heuristik + LLM)
ws --> app : UI aktualisieren
@enduml
```

### 6.2 Szenario: Feind kauft Item (Heuristik-only)

```plantuml
@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam sequenceArrowThickness 1.5

participant "Bridge" as bridge
participant "Riot API" as riot
participant "Flutter App" as app

bridge -> riot : GET /liveclientdata/allgamedata
riot --> bridge : 200 JSON
bridge -> bridge : detect() → ITEM_PURCHASED

note over bridge
  LLM nur wenn:
  Gold ≥ 1.000 UND
  Cooldown abgelaufen
end note

bridge --> app : ITEM_PURCHASED (gameState)
bridge --> app : RECOMMENDATION (Heuristik)
@enduml
```

### 6.3 Szenario: Verbindungsabbruch mit Auto-Reconnect

```plantuml
@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam sequenceArrowThickness 1.5

participant "Flutter App" as app
participant "WsService" as ws

ws -> ws : stream schließt unerwartet\n_onDone() aufgerufen
ws --> app : status: disconnected
ws -> ws : _scheduleReconnect() → Timer(1 s)
...1 Sekunde Pause...
ws -> ws : _doConnect() → WebSocket öffnen
ws --> app : status: connecting
ws -> ws : CONNECTED-Nachricht empfangen
ws --> app : status: connected
@enduml
```

### 6.4 Szenario: Bridge-Autostart und Prozessüberwachung

```plantuml
@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam sequenceArrowThickness 1.5

participant "Flutter App\n(main.dart)" as app
participant "Bridge\n(index.ts)" as bridge

app -> bridge : Process.start(bridge,\n['--parent-pid=<PID>'])
activate bridge
bridge -> bridge : setInterval alle 2 s:\nkill(parentPid, 0)

note over app : App wird geschlossen

bridge -> bridge : EPERM oder ESRCH
bridge -> bridge : process.exit(0)
deactivate bridge
@enduml
```

---
