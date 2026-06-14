import 'package:flutter/material.dart';
import 'package:lol_coach/services/storage_service.dart';

/// App-global holder for the selected [ThemeMode]. Lives above `MaterialApp`
/// (provided at the root) because it drives `MaterialApp.themeMode` — unlike
/// the screen-scoped `SettingsController`. The choice is persisted via
/// [StorageService] (shared_preferences), like the other settings.
class ThemeController extends ChangeNotifier {
  ThemeController(this._storage) : _mode = _decode(_storage.themeMode);

  final StorageService _storage;
  ThemeMode _mode;

  ThemeMode get mode => _mode;

  Future<void> setMode(ThemeMode mode) async {
    if (mode == _mode) return;
    _mode = mode;
    notifyListeners();
    await _storage.setThemeMode(_encode(mode));
  }

  static ThemeMode _decode(String? raw) => switch (raw) {
        'light' => ThemeMode.light,
        'dark' => ThemeMode.dark,
        'system' => ThemeMode.system,
        _ => ThemeMode.dark, // first-launch default
      };

  static String _encode(ThemeMode mode) => switch (mode) {
        ThemeMode.light => 'light',
        ThemeMode.dark => 'dark',
        ThemeMode.system => 'system',
      };
}
