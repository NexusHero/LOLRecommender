// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart';
import 'package:lol_coach/screens/home_screen.dart';
import 'package:lol_coach/screens/settings_screen.dart';
import 'package:lol_coach/services/coach_service.dart';
import 'package:lol_coach/services/ws_client.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  @override
  void initState() {
    super.initState();
    _maybeOpenSettingsOnFirstRun();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CoachService>().addListener(_onWsChanged);
    });
  }

  @override
  void dispose() {
    context.read<CoachService>().removeListener(_onWsChanged);
    super.dispose();
  }

  Future<void> _maybeOpenSettingsOnFirstRun() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted && prefs.getString('host') == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _openSettings());
    }
  }

  void _onWsChanged() {
    if (!mounted) return;
    final ws = context.read<CoachService>();

    if (ws.status == ConnectionStatus.error && ws.lastError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Connection Error: ${ws.lastError}'),
          backgroundColor: context.colors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }

    if (ws.lastLlmError != null) {
      final errorMsg = ws.lastLlmError!;
      ws.clearLlmError();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(
                Icons.warning_amber_rounded,
                color: Colors.white,
                size: 18,
              ),
              const SizedBox(width: 10),
              Expanded(child: Text('AI error: $errorMsg')),
            ],
          ),
          backgroundColor: context.colors.warning,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 6),
        ),
      );
    }
  }

  void _openSettings() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => SettingsScreen(
          onConnected: () => Navigator.of(context).pop(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return HomeScreen(onOpenSettings: _openSettings);
  }
}
