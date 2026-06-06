## 7. Verteilungssicht

### 7.1 Infrastrukturübersicht

```plantuml
@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam nodeBackgroundColor #F5F5F5
skinparam nodeBorderColor #AAAAAA
skinparam ArrowColor #555555

node "Spieler-PC (Desktop)" {
  node "LoL Coach App-Verzeichnis" {
    artifact "LoLCoach.exe / lol_coach.app\n(Flutter UI + Dart Runtime)" as flutter_bin
    artifact "bridge.exe / bridge\n(Node.js Runtime + Bundle via pkg)" as bridge_bin
  }

  node "League of Legends Client\n:2999 (HTTPS)" as lol

  database "OS-Keychain\n(API-Key-Speicher)" as keychain
  note right of keychain
    macOS: Keychain
    Windows: DPAPI
    Linux: libsecret
  end note
}

cloud "LLM-API (extern)" as llm {
  [Anthropic / OpenAI / Google]
}

flutter_bin --> bridge_bin : startet als\nKindprozess
bridge_bin --> lol : HTTPS :2999
bridge_bin --> llm : HTTPS (optional)
flutter_bin --> keychain : API-Key lesen/schreiben
@enduml
```

### 7.2 Deployment-Artefakte

| Artefakt | Plattform | Erzeugung | Inhalt |
|---------|-----------|-----------|--------|
| `LoLCoach.msix` | Windows | `deployment/build_installer.ps1` | Flutter-App + `bridge.exe` (via MSIX-Bundle) |
| `LoLCoach-Mac.zip` | macOS | `deployment/build_unix.sh` | `lol_coach.app` + `bridge` Binary (im .app-Bundle) |
| `LoLCoach-Linux.tar.gz` | Linux | `deployment/build_unix.sh` | Flutter-Bundle + `bridge` Binary |

### 7.3 Build-Pipeline (CI/CD)

```plantuml
@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam ActivityBorderColor #888888
skinparam ActivityBackgroundColor #F5F5F5

|GitHub|
start
:git push tag v*;

fork
  |ubuntu-latest|
  :Bridge Linux Binary;
  :Flutter Linux Build;
  :LoLCoach-Linux.tar.gz;
fork again
  |macos-latest|
  :Bridge macOS Binary;
  :Flutter macOS Build;
  :LoLCoach-Mac.zip;
fork again
  |windows-latest|
  :Bridge Windows .exe;
  :Flutter Windows Build;
  :LoLCoach.msix;
end fork

|GitHub|
:GitHub Release\n(softprops/action-gh-release);
stop
@enduml
```

**Zusätzliche Workflows:**

| Workflow | Trigger | Prüfung |
|---------|---------|--------|
| `ci.yml` | Push / PR | TypeScript-Build, Jest-Tests |
| `security.yml` | Push / PR / wöchentlich | `npm audit --audit-level=high`, License-Check |
| `webpack.yml` | Push / PR | webpack-Bundle |
| `docs.yml` | Push / PR | TypeDoc-Generierung |

---
