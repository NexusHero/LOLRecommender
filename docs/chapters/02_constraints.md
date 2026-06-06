## 2. Randbedingungen

### 2.1 Technische Randbedingungen

| Randbedingung | Hintergrund |
|--------------|-------------|
| Riot Live Client API läuft auf `https://127.0.0.1:2999` mit selbstsigniertem Zertifikat | Die API ist ein nicht-dokumentierter, lokaler HTTP-Server des LoL-Clients. TLS-Verifikation muss deaktiviert werden. |
| Die Bridge muss als eigenständige ausführbare Datei distribuierbar sein | Endnutzer haben keine Node.js-Laufzeit. Der Bundle wird via `@yao-pkg/pkg` in ein natives Binary kompiliert. |
| Die Flutter-App muss auf Windows, macOS und Linux laufen | Desktop-only; mobile Unterstützung ist nicht geplant. |
| LLM-API-Aufrufe entstehen Kosten | Die Architektur muss einen Cooldown-Mechanismus erzwingen und Tokens durch State-Minification minimieren. |
| Keine persistente Backend-Infrastruktur | Das gesamte System läuft lokal auf dem Rechner des Spielers. Kein Cloud-Backend, keine Datenbank. |

### 2.2 Organisatorische Randbedingungen

| Randbedingung | Hintergrund |
|--------------|-------------|
| Open-Source-Projekt (MIT-Lizenz) | Alle verwendeten Bibliotheken müssen mit MIT kompatibel sein. GPL/AGPL sind ausgeschlossen. |
| CI/CD über GitHub Actions | Security-Scan (npm audit), License-Check und Build-Pipeline laufen bei jedem Push. |
| Kein dediziertes Ops-Team | Die Architektur muss wartungsarm sein; Monitoring ist nicht eingeplant. |

### 2.3 Konventionen

| Konvention | Anwendung |
|-----------|-----------|
| Conventional Commits | Alle Git-Commits folgen dem Format `type(scope): message` |
| TypeScript strict mode | Aktiviert in `tsconfig.json`; kein implizites `any` |
| very_good_analysis | Flutter Lint-Preset für konsistente Dart-Code-Qualität |
| arc42 (Markdown) | Diese Dokumentation |

---
