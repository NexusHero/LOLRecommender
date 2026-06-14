import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:lol_coach/controllers/theme_controller.dart';
import 'package:lol_coach/screens/main_screen.dart';
import 'package:lol_coach/services/coach_service.dart';
import 'package:lol_coach/services/storage_service.dart';
import 'package:lol_coach/services/ws_client.dart';
import 'package:lol_coach/theme/app_theme.dart';
import 'package:lol_coach/utils/ddragon.dart';
import 'package:provider/provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  final storageService = StorageService();
  await storageService.init();

  // DDragon-Version im Hintergrund holen; Fallback greift falls kein Netz
  unawaited(initDDragonVersion());

  // Auto-start core on Desktop platforms if it exists
  if (Platform.isWindows || Platform.isMacOS || Platform.isLinux) {
    final exeDir = File(Platform.resolvedExecutable).parent.path;
    final coreName = Platform.isWindows ? 'core.exe' : 'core';
    final corePath = '$exeDir${Platform.pathSeparator}$coreName';

    if (File(corePath).existsSync()) {
      try {
        await Process.start(corePath, ['--parent-pid=$pid']);
      } catch (e) {
        debugPrint('Failed to start core: $e');
      }
    }
  }

  runApp(
    MultiProvider(
      providers: [
        Provider.value(value: storageService),
        ChangeNotifierProvider(create: (_) => ThemeController(storageService)),
        ChangeNotifierProvider(create: (_) => WsClient()),
        ChangeNotifierProxyProvider<WsClient, CoachService>(
          create: (ctx) => CoachService(ctx.read<WsClient>()),
          update: (_, client, coach) => coach ?? CoachService(client),
        ),
      ],
      child: const LolCoachApp(),
    ),
  );
}

class LolCoachApp extends StatelessWidget {
  const LolCoachApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeMode = context.watch<ThemeController>().mode;
    return MaterialApp(
      title: 'LoL Coach',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeMode,
      home: const MainScreen(),
    );
  }
}
