import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:lol_coach/screens/main_screen.dart';
import 'package:lol_coach/services/ws_service.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/utils/ddragon.dart';
import 'package:provider/provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // DDragon-Version im Hintergrund holen; Fallback greift falls kein Netz
  unawaited(initDDragonVersion());

  // Auto-start bridge on Desktop platforms if it exists
  if (Platform.isWindows || Platform.isMacOS || Platform.isLinux) {
    final exeDir = File(Platform.resolvedExecutable).parent.path;
    final bridgeName = Platform.isWindows ? 'bridge.exe' : 'bridge';
    final bridgePath = '$exeDir${Platform.pathSeparator}$bridgeName';

    if (File(bridgePath).existsSync()) {
      try {
        await Process.start(bridgePath, ['--parent-pid=$pid']);
      } catch (e) {
        debugPrint('Failed to start bridge: $e');
      }
    }
  }

  runApp(
    ChangeNotifierProvider(
      create: (_) => WsService(),
      child: const LolCoachApp(),
    ),
  );
}

class LolCoachApp extends StatelessWidget {
  const LolCoachApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LoL Coach',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: AppColors.bgDark,
        colorScheme: const ColorScheme.dark(
          primary: AppColors.gold,
          secondary: AppColors.cyan,
          surface: AppColors.surfaceDark,
          error: AppColors.error,
          onSurface: AppColors.textPrimary,
          onSurfaceVariant: AppColors.textSecondary,
          outline: AppColors.border,
          // SegmentedButton selected state
          secondaryContainer: AppColors.allySubtle,
          onSecondaryContainer: AppColors.cyan,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.surfaceMedium,
          foregroundColor: AppColors.textPrimary,
          elevation: 0,
          centerTitle: false,
          titleTextStyle: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.gold,
            foregroundColor: AppColors.bgDark,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.surfaceDark,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.gold),
          ),
          labelStyle: const TextStyle(color: AppColors.textSecondary),
          hintStyle: const TextStyle(color: AppColors.textDisabled),
        ),
        dividerTheme: const DividerThemeData(color: AppColors.border),
        navigationRailTheme: const NavigationRailThemeData(
          backgroundColor: AppColors.surfaceMedium,
          selectedIconTheme: IconThemeData(color: AppColors.gold),
          unselectedIconTheme: IconThemeData(color: AppColors.textSecondary),
          selectedLabelTextStyle: TextStyle(
            color: AppColors.gold,
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelTextStyle: TextStyle(
            color: AppColors.textSecondary,
            fontSize: 11,
          ),
          useIndicator: true,
          indicatorColor: AppColors.goldSubtle,
        ),
      ),
      home: const MainScreen(),
    );
  }
}
