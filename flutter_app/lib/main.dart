import 'package:flutter/material.dart';
import 'package:lol_coach/screens/main_screen.dart';
import 'package:lol_coach/services/ws_service.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:provider/provider.dart';

void main() {
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
          primary: AppColors.primaryGold,
          secondary: AppColors.secondaryCyan,
          surface: AppColors.surfaceDark,
          error: AppColors.errorRed,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.surfaceMedium,
          foregroundColor: AppColors.primaryGold,
          elevation: 0,
          centerTitle: false,
          titleTextStyle: TextStyle(
            color: AppColors.primaryGold,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: 1,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primaryGold,
            foregroundColor: AppColors.bgDark,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.surfaceDark,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(4),
            borderSide: const BorderSide(color: AppColors.borderDark),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(4),
            borderSide: const BorderSide(color: AppColors.borderDark),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(4),
            borderSide: const BorderSide(color: AppColors.primaryGold),
          ),
          labelStyle: const TextStyle(color: AppColors.textMuted),
          hintStyle: const TextStyle(color: AppColors.textDarker),
        ),
        dividerTheme: const DividerThemeData(color: AppColors.borderDark),
      ),
      home: const MainScreen(),
    );
  }
}
