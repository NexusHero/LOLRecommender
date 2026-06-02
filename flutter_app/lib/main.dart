import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/ws_service.dart';
import 'screens/home_screen.dart';

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
        scaffoldBackgroundColor: const Color(0xFF0A1628),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFC89B3C),
          secondary: Color(0xFF0BC4E3),
          surface: Color(0xFF0D1B2E),
          error: Color(0xFFC3291F),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF091428),
          foregroundColor: Color(0xFFC89B3C),
          elevation: 0,
          centerTitle: false,
          titleTextStyle: TextStyle(
            color: Color(0xFFC89B3C),
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: 1,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFC89B3C),
            foregroundColor: const Color(0xFF0A1628),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFF0D1B2E),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(4),
            borderSide: const BorderSide(color: Color(0xFF1E3A5F)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(4),
            borderSide: const BorderSide(color: Color(0xFF1E3A5F)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(4),
            borderSide: const BorderSide(color: Color(0xFFC89B3C)),
          ),
          labelStyle: const TextStyle(color: Color(0xFF7A7A7A)),
          hintStyle: const TextStyle(color: Color(0xFF3A3A3A)),
        ),
        dividerTheme: const DividerThemeData(color: Color(0xFF1E3A5F)),
      ),
      home: const HomeScreen(),
    );
  }
}
