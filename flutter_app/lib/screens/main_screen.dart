import 'package:flutter/material.dart';
import 'package:lol_coach/screens/home_screen.dart';
import 'package:lol_coach/services/ws_service.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/widgets/connection_form.dart';
import 'package:provider/provider.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 1; // Start on Settings tab

  @override
  void initState() {
    super.initState();
    // Listen to changes in connection status to show error snackbars
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ws = context.read<WsService>();
      ws.addListener(_onWsChanged);
    });
  }

  @override
  void dispose() {
    final ws = context.read<WsService>();
    ws.removeListener(_onWsChanged);
    super.dispose();
  }

  void _onWsChanged() {
    if (!mounted) return;
    final ws = context.read<WsService>();
    if (ws.status == ConnectionStatus.error && ws.lastError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Connection Error: ${ws.lastError}'),
          backgroundColor: AppColors.errorRed,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          const HomeScreen(),
          _buildSettingsTab(context),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        backgroundColor: AppColors.surfaceMedium,
        selectedItemColor: AppColors.primaryGold,
        unselectedItemColor: AppColors.textMuted,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.sports_esports_outlined),
            label: 'Coach',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            label: 'Settings',
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
        onConnect: (host, port, summonerName, providerType, apiKey) {
          ws.connect(host, port: port, summonerName: summonerName, providerType: providerType, apiKey: apiKey);
          // Auto-switch to Coach tab immediately
          setState(() {
            _currentIndex = 0;
          });
        },
      ),
    );
  }
}
