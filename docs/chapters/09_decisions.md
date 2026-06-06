## 9. Architekturentscheidungen

### ADR-001: Heuristik-first mit optionalem LLM

**Kontext:** Item-Empfehlungen müssen auch ohne Internetzugang und ohne konfiguriertem API-Key funktionieren.

**Entscheidung:** Die regelbasierte Heuristik-Engine ist immer aktiv und liefert sofort eine Empfehlung. Der LLM-Anbieter ist optional und reichert die Empfehlung bei Bedarf mit einer natürlichsprachigen Erklärung an.

**Konsequenzen:**
- (+) Offline-Betrieb vollständig funktionsfähig
- (+) Keine Latenz-Abhängigkeit vom LLM für die Kernfunktion
- (+) Fallback bei LLM-Fehler ist nahtlos
- (−) Heuristik-Erklärungen sind weniger kontextbezogen als LLM-Erklärungen

---

### ADR-002: Adapter-Pattern für LLM-Anbieter

**Kontext:** Drei verschiedene LLM-APIs (Anthropic, OpenAI, Google) sollen austauschbar nutzbar sein.

**Entscheidung:** Gemeinsames `LlmProvider`-Interface mit `getExplanation(state, rec): Promise<string>`. Factory-Funktion `createLlmProvider(type, apiKey)` erzeugt die konkrete Implementierung.

**Konsequenzen:**
- (+) Neue Anbieter erfordern nur eine neue Datei in `providers/`
- (+) Orchestrator ist vollständig entkoppelt vom konkreten Anbieter
- (+) Einfach mockbar in Tests
- (−) Static-Import aller Provider notwendig (für webpack/pkg-Bundling)

---

### ADR-003: WebSocket statt REST-Polling durch Flutter

**Kontext:** Die Flutter-App muss kontinuierlich Spielzustand-Updates empfangen.

**Entscheidung:** Die Bridge betreibt einen WebSocket-Server. Flutter ist Client. Events werden gepusht, nicht gepollt.

**Konsequenzen:**
- (+) Echtzeit-Updates ohne Polling-Overhead auf App-Seite
- (+) Bidirektionale Kommunikation (`SET_SUMMONER`, `SET_LLM_PROVIDER`)
- (+) Bridge-seitige Filterung unnötiger Updates möglich
- (−) Verbindungsmanagement (Reconnect, Zustandswiederherstellung) auf Client-Seite nötig

---

### ADR-004: Prozessmodell — Bridge als eigenständiger Kindprozess

**Kontext:** Die Bridge ist ein Node.js-Prozess; die Flutter-App ist eine Dart-Laufzeit. Beide müssen zusammen starten und enden.

**Entscheidung:** Die Flutter-App startet die Bridge via `Process.start()` mit `--parent-pid=<PID>`. Die Bridge überwacht die Parent-PID alle 2 Sekunden und beendet sich selbst, wenn der Parent nicht mehr existiert.

**Konsequenzen:**
- (+) Kein manueller Bridge-Start für Endnutzer
- (+) Automatisches Cleanup beim App-Schließen
- (−) Auf Windows kann `process.kill(pid, 0)` bei unterschiedlichen Integrity-Levels EPERM werfen (dokumentierter Workaround vorhanden)

---

### ADR-005: Deployment als native Binaries via pkg

**Kontext:** Endnutzer haben keine Node.js-Laufzeit installiert.

**Entscheidung:** Die Bridge wird mit `@yao-pkg/pkg` in ein plattformspezifisches Binary kompiliert (`.exe`, macOS-Binary, Linux-Binary). Das Binary enthält die gesamte Node.js-Laufzeit und das webpack-Bundle.

**Konsequenzen:**
- (+) Zero-Dependency-Installation für Endnutzer
- (+) `pkg` wurde durch `@yao-pkg/pkg` ersetzt (aktiv gepflegt, keine CVE)
- (−) Bundle-Größe ~50 MB durch eingebettete Node.js-Runtime
- (−) Webpack muss mit `minimize: false` konfiguriert sein (pkg-Kompatibilität)

---

### ADR-006: Zod für Runtime-Validierung an der API-Grenze

**Kontext:** Die Riot Live Client API ist nicht offiziell dokumentiert und kann sich ändern. Fehlende oder falsche Felder würden zu Runtime-Crashes führen.

**Entscheidung:** Alle eingehenden API-Daten werden durch Zod-Schemas validiert. Fehlende optionale Felder werden durch `.catch(defaultValue)` abgefangen.

**Konsequenzen:**
- (+) Keine unerwarteten `undefined`-Fehler tief im Code
- (+) Typsicherheit vom Netzwerk bis zur Verarbeitungslogik
- (+) Schema dokumentiert die erwartete API-Struktur
- (−) Leichter Overhead durch Schema-Validierung (vernachlässigbar bei 1 s Polling-Intervall)

---

### ADR-007: Champion- und Item-Daten in JSON-Konfigurationsdateien

**Kontext:** Champion-Klassifikationen und Item-Namen waren als TypeScript-Konstanten hardcodiert. Meta-Änderungen erforderten ein Code-Deployment.

**Entscheidung:** Auslagern in `bridge/src/data/champions.json` und `bridge/src/data/items.json`. TypeScript importiert die JSON-Dateien statisch (`resolveJsonModule: true`); webpack bundelt sie ins Binary.

**Konsequenzen:**
- (+) Meta-Updates ohne Code-Änderung möglich (JSON-Datei editieren, neu bundeln)
- (+) Schwellwerte sind benannt und selbstdokumentierend
- (−) JSON wird statisch ins Binary gebacken; Laufzeit-Austausch ohne Neustart nicht möglich

---
