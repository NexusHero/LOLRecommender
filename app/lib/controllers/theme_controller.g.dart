// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'theme_controller.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$themeControllerHash() => r'039e22e99c5c0189c3eb3d8ab216b74f4a3d719f';

/// App-global holder for the selected [ThemeMode]. Lives above `MaterialApp`
/// (provided at the root) because it drives `MaterialApp.themeMode` — unlike
/// the screen-scoped `SettingsController`. The choice is persisted via
/// [StorageService] (shared_preferences), like the other settings.
///
/// `keepAlive: true` — this must survive for the app's lifetime, not be
/// disposed when no widget happens to be watching it (riverpod's default
/// for generated providers is autoDispose).
///
/// Copied from [ThemeController].
@ProviderFor(ThemeController)
final themeControllerProvider =
    NotifierProvider<ThemeController, ThemeMode>.internal(
  ThemeController.new,
  name: r'themeControllerProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$themeControllerHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$ThemeController = Notifier<ThemeMode>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
