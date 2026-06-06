## 12. Glossar

| Begriff | Definition |
|---------|-----------|
| **ADC** | *Attack Damage Carry* — Champion-Rolle, die primär physischen Schaden austeilt |
| **AP** | *Ability Power* — magische Schadensquelle in League of Legends |
| **AD** | *Attack Damage* — physische Schadensquelle in League of Legends |
| **AsyncAPI** | Spezifikationsstandard für ereignisgesteuerte APIs (analog zu OpenAPI für REST) |
| **Bridge** | Der Node.js/TypeScript-Prozess, der zwischen der Riot-API und der Flutter-App vermittelt |
| **CC** | *Crowd Control* — Fähigkeiten, die Gegner verlangsamen, betäuben oder immobilisieren |
| **CompProfile** | Interne Datenstruktur, die die Zusammensetzung des Gegner-Teams beschreibt (AP-Ratio, AD-Ratio, CC-Score, Heal-Score) |
| **Cooldown** | Wartezeit zwischen zwei aufeinanderfolgenden LLM-Aufrufen (Standard: 7 Minuten) |
| **Data Dragon** | Offizielle statische Datenquelle von Riot Games für Item- und Champion-Informationen |
| **EventDetector** | Bridge-Komponente, die durch Vergleich zweier Spielzustände Ereignisse erkennt |
| **GameEvent** | Typisiertes Ereignis in der Bridge (z. B. `GAME_STARTED`, `ITEM_PURCHASED`) |
| **Heuristik** | Regelbasiertes System zur Item-Empfehlung ohne externe API-Abhängigkeit |
| **iSAQB** | *International Software Architecture Qualification Board* — Zertifizierungsgremium für Software-Architekten |
| **Live Client API** | Lokaler HTTP-Server des League-of-Legends-Clients, der Echtzeit-Spielzustand bereitstellt |
| **LLM** | *Large Language Model* — KI-Modell für natürlichsprachige Texterzeugung (Claude, GPT, Gemini) |
| **LlmProvider** | Interface und Adapter-Pattern für alle unterstützten LLM-Anbieter |
| **minifyGameState** | Funktion, die den Spielzustand auf eine kompakte Zeichenkette reduziert, um LLM-Token-Kosten zu minimieren |
| **MSIX** | Windows-App-Paketformat für den Microsoft Store und Sideloading |
| **ParsedGameState** | Normalisierter Spielzustand nach dem Parser — Grundstruktur für alle Folgekomponenten |
| **pkg / @yao-pkg/pkg** | Tool zum Kompilieren von Node.js-Anwendungen in plattformspezifische Binaries |
| **Provider (Flutter)** | State-Management-Pattern (`ChangeNotifier` + `Provider`-Package) |
| **Retry with Backoff** | Strategie zur Fehlerbehandlung: Wiederholungsversuche mit wachsenden Wartezeiten |
| **WsMessage** | Gemeinsames Nachrichtenformat zwischen Bridge und Flutter App (JSON over WebSocket) |
| **WsService** | Flutter-Dienst (`ChangeNotifier`), der die WebSocket-Verbindung zur Bridge verwaltet |
| **Zod** | TypeScript-Bibliothek zur Schema-Deklaration und Runtime-Validierung |
