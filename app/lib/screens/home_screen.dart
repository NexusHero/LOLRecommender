// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lol_coach/providers.dart';
import 'package:lol_coach/services/coach_service.dart';
import 'package:lol_coach/services/ws_client.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/theme/app_text_styles.dart';
import 'package:lol_coach/widgets/common/app_background.dart';
import 'package:lol_coach/widgets/game_view.dart';

String _providerLabel(String type) => switch (type) {
      'claude' => 'Claude',
      'openai' => 'GPT-4o',
      'gemini' => 'Gemini',
      _ => 'Basic',
    };

bool _isAiProvider(String type) => type != 'none' && type.isNotEmpty;

class HomeScreen extends ConsumerWidget {
  const HomeScreen({this.onOpenSettings, super.key});

  final VoidCallback? onOpenSettings;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ws = ref.watch(coachServiceProvider);
    return ListenableBuilder(
      listenable: ws,
      builder: (context, _) {
        return Scaffold(
          extendBodyBehindAppBar: true,
          appBar: AppBar(
            titleSpacing: 20,
            title: const Text('LoL Coach', style: AppTextStyles.heading),
            actions: [
              if (ws.isConnected)
                Padding(
                  padding: const EdgeInsets.only(right: 4),
                  child: _LivePill(
                    providerType: ws.activeProviderType,
                    llmFailed: ws.llmFailed,
                  ),
                ),
              if (ws.status != ConnectionStatus.disconnected)
                IconButton(
                  icon: const Icon(Icons.link_off),
                  tooltip: 'Disconnect',
                  onPressed: ws.disconnect,
                ),
              IconButton(
                icon: const Icon(Icons.settings_outlined),
                tooltip: 'Settings',
                onPressed: onOpenSettings,
              ),
              const SizedBox(width: 4),
            ],
          ),
          body: AppBackground(
            child: SafeArea(child: _buildBody(context, ws)),
          ),
          floatingActionButton: ws.gameActive ? _PulsingFab(ws: ws) : null,
        );
      },
    );
  }

  Widget _buildBody(BuildContext context, CoachService ws) {
    switch (ws.status) {
      case ConnectionStatus.disconnected:
      case ConnectionStatus.error:
        return _buildNotConnectedView(context);
      case ConnectionStatus.connecting:
        return Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: context.colors.magic),
              const SizedBox(height: 16),
              Text(
                'Connecting to core…',
                style: AppTextStyles.caption.copyWith(
                  color: context.colors.textSecondary,
                ),
              ),
            ],
          ),
        );
      case ConnectionStatus.connected:
        if (!ws.gameActive || ws.gameState == null) return const _WaitingView();
        return GameView(
          gameState: ws.gameState!,
          recommendation: ws.recommendation,
          lastEvent: ws.lastEvent,
          triggerEvent: ws.triggerEvent,
          isAnalyzing: ws.isAnalyzing,
          recommendationTime: ws.recommendationTime,
          tokenUsage: ws.lastTokenUsage,
          isBudgetExceeded: ws.isBudgetExceeded,
          riskLevel: _isAiProvider(ws.activeProviderType) ? ws.riskLevel : null,
          onRiskLevelChanged:
              _isAiProvider(ws.activeProviderType) ? ws.setRiskLevel : null,
          aiEnabled: _isAiProvider(ws.activeProviderType),
        );
    }
  }

  Widget _buildNotConnectedView(BuildContext context) {
    final colors = context.colors;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.link_off, size: 52, color: colors.textDisabled),
          const SizedBox(height: 18),
          const Text('Not connected', style: AppTextStyles.title),
          const SizedBox(height: 8),
          Text(
            'Open Settings to connect.',
            style: AppTextStyles.body.copyWith(color: colors.textSecondary),
          ),
        ],
      ),
    );
  }
}

// ─── Live pill ───────────────────────────────────────────────────────────────

/// Compact header pill mirroring the design's "<Provider> · live" indicator,
/// with a breathing violet dot while the AI is coaching.
class _LivePill extends StatefulWidget {
  const _LivePill({required this.providerType, required this.llmFailed});
  final String providerType;
  final bool llmFailed;

  @override
  State<_LivePill> createState() => _LivePillState();
}

class _LivePillState extends State<_LivePill>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _pulse;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
    _pulse = Tween<double>(begin: 0.4, end: 1).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isAi = _isAiProvider(widget.providerType);
    final failed = isAi && widget.llmFailed;
    final label = _providerLabel(widget.providerType);
    final Color color;
    final String text;
    if (failed) {
      color = colors.warning;
      text = '$label unavailable';
    } else if (isAi) {
      color = colors.magic;
      text = '$label · live';
    } else {
      color = colors.textSecondary;
      text = 'Basic rules';
    }

    return Container(
      padding: const EdgeInsets.fromLTRB(9, 5, 11, 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(100),
        border: Border.all(color: color.withValues(alpha: 0.28)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (failed)
            Icon(Icons.warning_amber_rounded, size: 13, color: color)
          else
            AnimatedBuilder(
              animation: _pulse,
              builder: (_, __) => Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: color.withValues(alpha: isAi ? _pulse.value : 0.5),
                  boxShadow: isAi
                      ? [
                          BoxShadow(
                            color: colors.magic.withValues(
                              alpha: _pulse.value * 0.8,
                            ),
                            blurRadius: 8,
                            spreadRadius: 1,
                          ),
                        ]
                      : null,
                ),
              ),
            ),
          const SizedBox(width: 7),
          Text(
            text,
            style: AppTextStyles.micro.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Pulsing FAB ─────────────────────────────────────────────────────────────

class _PulsingFab extends StatefulWidget {
  const _PulsingFab({required this.ws});
  final CoachService ws;

  @override
  State<_PulsingFab> createState() => _PulsingFabState();
}

class _PulsingFabState extends State<_PulsingFab>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
    _scale = Tween<double>(begin: 1, end: 1.05).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final ws = widget.ws;
    final provider = ws.activeProviderType;
    final isAi = _isAiProvider(provider) && !ws.llmFailed;
    // Advice is pushed automatically on key events (level up, item buys,
    // deaths, gold thresholds). This button is just a manual refresh.
    final label = ws.isAnalyzing ? 'Analysing…' : 'Refresh advice';

    final fab = FloatingActionButton.extended(
      onPressed: ws.isAnalyzing ? null : ws.triggerAnalysis,
      tooltip: 'Manually refresh — advice also updates automatically',
      backgroundColor: isAi ? colors.magicHot : colors.gold,
      foregroundColor: Colors.white,
      elevation: isAi ? 10 : 4,
      icon: ws.isAnalyzing
          ? const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: Colors.white,
              ),
            )
          : const Icon(Icons.refresh),
      label: Text(label),
    );

    if (!isAi || ws.isAnalyzing) return fab;

    return AnimatedBuilder(
      animation: _scale,
      builder: (_, child) => Transform.scale(scale: _scale.value, child: child),
      child: fab,
    );
  }
}

// ─── Waiting view ────────────────────────────────────────────────────────────

class _WaitingView extends StatelessWidget {
  const _WaitingView();

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              Icons.sports_esports_outlined,
              size: 48,
              color: colors.textDisabled,
            ),
            const SizedBox(height: 22),
            const Text('Ready to coach', style: AppTextStyles.title),
            const SizedBox(height: 22),
            const _StepRow(
              done: true,
              text: 'Core connected',
            ),
            const SizedBox(height: 14),
            const _StepRow(
              done: false,
              text: 'Start a League of Legends match',
            ),
            const SizedBox(height: 14),
            const _StepRow(
              done: false,
              text: 'Advice appears automatically as the match unfolds',
            ),
          ],
        ),
      ),
    );
  }
}

class _StepRow extends StatelessWidget {
  const _StepRow({required this.done, required this.text});
  final bool done;
  final String text;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final color = done ? colors.success : colors.textDisabled;
    return Row(
      children: [
        Container(
          width: 18,
          height: 18,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: color, width: 1.5),
          ),
          child: done
              ? Icon(Icons.check, size: 11, color: color)
              : null,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: AppTextStyles.body.copyWith(
              color: done ? colors.textPrimary : colors.textSecondary,
            ),
          ),
        ),
      ],
    );
  }
}
