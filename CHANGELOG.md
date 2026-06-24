# Changelog

All notable changes to this project are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

### Changed
- Redesigned the desktop UI to the **Elevated** glass visual language — violet AI accent, champagne win-condition accent, frosted-glass cards over a gradient canvas, a refreshed type scale, and an in-game **hero card** that leads with the single most important action. The palette is exposed as an `AppColors` `ThemeExtension` (dark + light).

### Added
- Role-aware LLM coaching (Claude / OpenAI / Gemini)
- Heuristic counter-item engine covering 170+ champions
- Flutter desktop app (macOS, Windows, Linux)
- WebSocket bridge with live reconnect and exponential backoff
- Event triggers: `GAME_STARTED`, `ITEM_PURCHASED`, `PLAYER_DIED`, manual FAB
- Multi-provider AI support — or fully offline heuristic-only mode
- CI pipeline (lint, type-check, bridge tests, flutter analyze)
- Windows MSIX + macOS/Linux build scripts

---

<!-- Add a new entry when cutting a release:

## [1.0.0] - YYYY-MM-DD

### Added
### Changed
### Fixed
### Removed
-->
