import 'package:flutter/material.dart';
import 'package:lol_coach/services/ws_service.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/theme/app_text_styles.dart';
import 'package:lol_coach/widgets/game_view.dart';
import 'package:provider/provider.dart';

String _providerLabel(String type) => switch (type) {
      'claude' => 'Claude',
      'openai' => 'GPT-4o',
      'gemini' => 'Gemini',
      _ => 'Basic',
    };

bool _isAiProvider(String type) => type != 'none';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<WsService>(
      builder: (context, ws, _) {
        return Scaffold(
          appBar: AppBar(
            title: Row(
              children: [
                const Text('LoL Coach'),
                const SizedBox(width: 8),
                _StatusDot(status: ws.status),
                if (ws.isConnected) ...[
                  const SizedBox(width: 10),
                  _ProviderChip(providerType: ws.activeProviderType),
                ],
              ],
            ),
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
          floatingActionButton: ws.gameActive ? _buildFab(ws) : null,
        );
      },
    );
  }

  Widget _buildFab(WsService ws) {
    final provider = ws.activeProviderType;
    final isAi = _isAiProvider(provider);
    final label = ws.isAnalyzing
        ? 'Analysing...'
        : isAi
            ? 'Analyse with ${_providerLabel(provider)}'
            : 'Analyse (Basic)';

    return FloatingActionButton.extended(
      onPressed: ws.isAnalyzing ? null : ws.triggerAnalysis,
      backgroundColor: isAi ? AppColors.magic : AppColors.gold,
      foregroundColor: Colors.white,
      icon: ws.isAnalyzing
          ? const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: Colors.white,
              ),
            )
          : Icon(isAi ? Icons.smart_toy_outlined : Icons.bolt),
      label: Text(label),
    );
  }

  Widget _buildBody(BuildContext context, WsService ws) {
    switch (ws.status) {
      case ConnectionStatus.disconnected:
      case ConnectionStatus.error:
        return _buildNotConnectedView();
      case ConnectionStatus.connecting:
        return const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Connecting to bridge...', style: AppTextStyles.caption),
            ],
          ),
        );
      case ConnectionStatus.connected:
        if (!ws.gameActive || ws.gameState == null) return const _WaitingView();
        return GameView(
          gameState: ws.gameState!,
          recommendation: ws.recommendation,
          lastEvent: ws.lastEvent,
          recommendationTime: ws.recommendationTime,
        );
    }
  }

  Widget _buildNotConnectedView() {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.link_off, size: 56, color: AppColors.textDisabled),
          SizedBox(height: 16),
          Text('Not Connected', style: AppTextStyles.heading),
          SizedBox(height: 8),
          Text(
            'Use the Settings tab on the left to connect.',
            style: AppTextStyles.caption,
          ),
        ],
      ),
    );
  }
}

class _StatusDot extends StatelessWidget {
  const _StatusDot({required this.status});
  final ConnectionStatus status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      ConnectionStatus.connected => AppColors.success,
      ConnectionStatus.connecting => AppColors.warning,
      ConnectionStatus.error => AppColors.errorLight,
      ConnectionStatus.disconnected => AppColors.textDisabled,
    };
    return Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}

class _ProviderChip extends StatelessWidget {
  const _ProviderChip({required this.providerType});
  final String providerType;

  @override
  Widget build(BuildContext context) {
    final isAi = _isAiProvider(providerType);
    final color = isAi ? AppColors.magic : AppColors.textSecondary;
    final bg = isAi ? AppColors.magicSubtle : AppColors.surfaceDark;
    final icon = isAi ? Icons.smart_toy_outlined : Icons.tune;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: color),
          const SizedBox(width: 4),
          Text(
            _providerLabel(providerType),
            style: AppTextStyles.caption.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _WaitingView extends StatelessWidget {
  const _WaitingView();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.sports_esports_outlined,
              size: 56,
              color: AppColors.textDisabled,
            ),
            SizedBox(height: 20),
            Text('Ready to coach', style: AppTextStyles.heading),
            SizedBox(height: 20),
            _StepRow(
              icon: Icons.check_circle_outline,
              color: AppColors.success,
              text: 'Bridge connected',
            ),
            SizedBox(height: 12),
            _StepRow(
              icon: Icons.radio_button_unchecked,
              color: AppColors.textSecondary,
              text: 'Start a League of Legends match',
            ),
            SizedBox(height: 12),
            _StepRow(
              icon: Icons.radio_button_unchecked,
              color: AppColors.textSecondary,
              text: 'Tap "Analyse" to get AI item advice',
            ),
          ],
        ),
      ),
    );
  }
}

class _StepRow extends StatelessWidget {
  const _StepRow({
    required this.icon,
    required this.color,
    required this.text,
  });
  final IconData icon;
  final Color color;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 12),
        Expanded(child: Text(text, style: AppTextStyles.body)),
      ],
    );
  }
}
