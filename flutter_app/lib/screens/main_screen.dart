// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart';
import 'package:lol_coach/screens/home_screen.dart';
import 'package:lol_coach/services/ws_service.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/widgets/connection_form.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 1; // Default to Settings until prefs are loaded

  @override
  void initState() {
    super.initState();
    _loadInitialTab();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WsService>().addListener(_onWsChanged);
    });
  }

  @override
  void dispose() {
    context.read<WsService>().removeListener(_onWsChanged);
    super.dispose();
  }

  Future<void> _loadInitialTab() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted && prefs.getString('host') != null) {
      setState(() => _currentIndex = 0);
    }
  }

  void _onWsChanged() {
    if (!mounted) return;
    final ws = context.read<WsService>();

    if (ws.status == ConnectionStatus.error && ws.lastError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Connection Error: ${ws.lastError}'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }

    if (ws.lastLlmError != null) {
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
              Expanded(child: Text('AI error: ${ws.lastLlmError}')),
            ],
          ),
          backgroundColor: AppColors.warning,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 6),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          NavigationRail(
            selectedIndex: _currentIndex,
            onDestinationSelected: (i) => setState(() => _currentIndex = i),
            labelType: NavigationRailLabelType.all,
            destinations: const [
              NavigationRailDestination(
                icon: Icon(Icons.sports_esports_outlined),
                selectedIcon: Icon(Icons.sports_esports),
                label: Text('Coach'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.settings_outlined),
                selectedIcon: Icon(Icons.settings),
                label: Text('Settings'),
              ),
            ],
          ),
          const VerticalDivider(
            width: 1, thickness: 1, color: AppColors.border,),
          Expanded(
            child: IndexedStack(
              index: _currentIndex,
              children: [
                const HomeScreen(),
                _buildSettingsTab(context),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsTab(BuildContext context) {
    final ws = context.watch<WsService>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        actions: [
          if (ws.status != ConnectionStatus.disconnected)
            IconButton(
              icon: const Icon(Icons.link_off),
              tooltip: 'Disconnect',
              onPressed: ws.disconnect,
            ),
        ],
      ),
      body: ConnectionForm(
        error: ws.status == ConnectionStatus.error ? ws.lastError : null,
        isConnecting: ws.status == ConnectionStatus.connecting,
        availableModels: ws.availableModels,
        availableModelsForProvider: ws.availableModelsProvider,
        isLoadingModels: ws.isLoadingModels,
        onLoadModels: ws.isConnected
            ? ws.loadModels
            : null,
        onConnect: (host, port, summonerName, providerType, model, apiKey) {
          ws.connect(
            host,
            port: port,
            summonerName: summonerName,
            providerType: providerType,
            model: model,
            apiKey: apiKey,
          );
          setState(() => _currentIndex = 0);
        },
      ),
    );
  }
}
