import 'package:lol_coach/theme/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/ws_service.dart';
import '../widgets/connection_form.dart';
import '../widgets/game_view.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<WsService>(
      builder: (context, ws, _) {
        return Scaffold(
          appBar: AppBar(
            title: Row(children: [
              const Text('LoL Coach'),
              const SizedBox(width: 8),
              _StatusDot(status: ws.status),
            ]),
            actions: [
              if (ws.status != ConnectionStatus.disconnected)
                IconButton(
                  icon: const Icon(Icons.link_off),
                  tooltip: 'Disconnect',
                  onPressed: ws.disconnect,
                ),
            ],
          ),
          body: _buildBody(context, ws),
        );
      },
    );
  }

  Widget _buildBody(BuildContext context, WsService ws) {
    switch (ws.status) {
      case ConnectionStatus.disconnected:
      case ConnectionStatus.error:
      case ConnectionStatus.connecting:
        return ConnectionForm(
          error: ws.status == ConnectionStatus.error ? ws.lastError : null,
          isConnecting: ws.status == ConnectionStatus.connecting,
          onConnect: (host, port) => ws.connect(host, port: port),
        );

      case ConnectionStatus.connected:
        if (!ws.gameActive) return const _WaitingView();
        return GameView(
          gameState: ws.gameState!,
          recommendation: ws.recommendation,
          lastEvent: ws.lastEvent,
        );
    }
  }
}

class _StatusDot extends StatelessWidget {
  final ConnectionStatus status;
  const _StatusDot({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      ConnectionStatus.connected => Colors.greenAccent,
      ConnectionStatus.connecting => Colors.orange,
      ConnectionStatus.error => Colors.redAccent,
      ConnectionStatus.disconnected => Colors.grey,
    };
    return Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}

class _WaitingView extends StatelessWidget {
  const _WaitingView();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.sports_esports_outlined,
              size: 64, color: Colors.grey.shade700),
          const SizedBox(height: 16),
          const Text(
            'Waiting for game start...',
            style: TextStyle(color: AppColors.textMuted, fontSize: 16),
          ),
          const SizedBox(height: 8),
          const Text(
            'Start a League of Legends match',
            style: TextStyle(color: AppColors.textDark, fontSize: 12),
          ),
        ],
      ),
    );
  }
}
