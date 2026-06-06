## 4. Lösungsstrategie

### Zentrale Architekturentscheidungen auf einen Blick

| Problem | Entscheidung | Begründung |
|---------|-------------|------------|
| Wie werden Spielereignisse erkannt? | Zustandsvergleich zwischen zwei aufeinanderfolgenden Polls | Riot stellt keine Event-API bereit; Polling ist die einzige Option |
| Wie werden Empfehlungen generiert? | Heuristik-first, LLM-optional | Heuristik ist sofort verfügbar (< 5 ms), kein Internet nötig; LLM enriched nur bei Bedarf |
| Wie werden mehrere LLM-Anbieter unterstützt? | Adapter-Pattern mit gemeinsamen `LlmProvider`-Interface | Neue Anbieter erfordern nur eine neue Datei |
| Wie wird die App auf den Spieler-PC gebracht? | Bridge als natives Binary (pkg), Flutter als .exe/.app/.deb | Keine Installation von Node.js oder Dart erforderlich |
| Wie wird der Prozesslebenszyklus verwaltet? | Bridge erhält beim Start die Parent-PID der Flutter-App | Bridge beendet sich automatisch, wenn die App geschlossen wird |
| Wie werden API-Keys sicher gespeichert? | `flutter_secure_storage` (OS-Keychain) | Verhindert Klartext-Speicherung im Dateisystem |

---
