import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lol_coach/controllers/theme_controller.dart';
import 'package:lol_coach/services/coach_service.dart';
import 'package:lol_coach/services/storage_service.dart';
import 'package:lol_coach/services/ws_client.dart';

/// [StorageService] needs async `init()` before use, so it's constructed in
/// `main()` and injected here via `ProviderScope(overrides: ...)`.
final storageServiceProvider = Provider<StorageService>((ref) {
  throw UnimplementedError(
    'storageServiceProvider must be overridden in ProviderScope',
  );
});

final wsClientProvider = Provider<WsClient>((ref) {
  final client = WsClient();
  ref.onDispose(client.dispose);
  return client;
});

final themeControllerProvider = Provider<ThemeController>((ref) {
  final controller = ThemeController(ref.watch(storageServiceProvider));
  ref.onDispose(controller.dispose);
  return controller;
});

/// Mirrors the previous `ChangeNotifierProxyProvider<WsClient, CoachService>`
/// dependency wiring. These services remain plain `ChangeNotifier`s — riverpod
/// only manages their lifecycle/construction here. Widgets that need to
/// rebuild on internal state changes still wrap with `ListenableBuilder`.
final coachServiceProvider = Provider<CoachService>((ref) {
  final service = CoachService(
    ref.watch(wsClientProvider),
    ref.watch(storageServiceProvider),
  );
  ref.onDispose(service.dispose);
  return service;
});
