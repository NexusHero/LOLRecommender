// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lol_coach/providers.dart';
import 'package:lol_coach/services/coach_service.dart';
import 'package:lol_coach/services/ws_client.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/theme/app_text_styles.dart';
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
          appBar: AppBar(
            title: Row(
              children: [
                const Text('LoL Coach'),
                const SizedBox(width: 8),
                _StatusDot(status: ws.status),
              ],
            ),
            actions: [
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
            ],
          ),
          body: Column(
            children: [
              if (ws.isConnected)
                _AiModeBanner(
                  providerType: ws.activeProviderType,
                  llmFailed: ws.llmFailed,
                ),
              Expanded(child: _buildBody(context, ws)),
            ],
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
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              Text(
                'Connecting to core...',
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
          Icon(Icons.link_off, size: 56, color: colors.textDisabled),
          const SizedBox(height: 16),
          const Text('Not Connected', style: AppTextStyles.heading),
          const SizedBox(height: 8),
          Text(
            'Tap the settings icon to connect.',
            style: AppTextStyles.caption.copyWith(color: colors.textSecondary),
          ),
        ],
      ),
    );
  }
}

// ─── Status dot ──────────────────────────────────────────────────────────────

class _StatusDot extends StatelessWidget {
  const _StatusDot({required this.status});
  final ConnectionStatus status;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final color = switch (status) {
      ConnectionStatus.connected => colors.success,
      ConnectionStatus.connecting => colors.warning,
      ConnectionStatus.error => colors.errorLight,
      ConnectionStatus.disconnected => colors.textDisabled,
    };
    return Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}

// ─── AI mode banner ──────────────────────────────────────────────────────────

class _AiModeBanner extends StatefulWidget {
  const _AiModeBanner({required this.providerType, required this.llmFailed});
  final String providerType;
  final bool llmFailed;

  @override
  State<_AiModeBanner> createState() => _AiModeBannerState();
}

class _AiModeBannerState extends State<_AiModeBanner>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _pulse;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
    _pulse = Tween<double>(begin: 0.35, end: 1).animate(
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
    final color = failed
        ? colors.warning
        : isAi
            ? colors.magic
            : colors.textSecondary;
    final bg = failed
        ? colors.warning.withValues(alpha: 0.08)
        : isAi
            ? colors.magic.withValues(alpha: 0.1)
            : colors.surfaceDark;
    final label = _providerLabel(widget.providerType);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeOut,
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: bg,
        border: Border(
          bottom: BorderSide(
            color: color.withValues(alpha: 0.25),
          ),
        ),
      ),
      child: Row(
        children: [
          if (failed)
            Icon(
              Icons.warning_amber_rounded,
              size: 14,
              color: colors.warning,
            )
          else
            AnimatedBuilder(
              animation: _pulse,
              builder: (_, __) => Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: color.withValues(alpha: isAi ? _pulse.value : 0.45),
                  boxShadow: isAi && !failed
                      ? [
                          BoxShadow(
                            color: colors.magic.withValues(
                              alpha: _pulse.value * 0.7,
                            ),
                            blurRadius: 8,
                            spreadRadius: 1,
                          ),
                        ]
                      : null,
                ),
              ),
            ),
          const SizedBox(width: 10),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: Text(
              failed
                  ? '$label unavailable'
                  : isAi
                      ? '$label is coaching you'
                      : 'Basic rules active',
              key: ValueKey('${widget.providerType}_$failed'),
              style: AppTextStyles.caption.copyWith(
                color: color,
                fontWeight: FontWeight.w600,
              ),
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
    final label = ws.isAnalyzing ? 'Analysing...' : 'Refresh advice';

    final fab = FloatingActionButton.extended(
      onPressed: ws.isAnalyzing ? null : ws.triggerAnalysis,
      tooltip: 'Manually refresh — advice also updates automatically',
      backgroundColor: isAi ? colors.magic : colors.gold,
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
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.sports_esports_outlined,
              size: 56,
              color: colors.textDisabled,
            ),
            const SizedBox(height: 20),
            const Text('Ready to coach', style: AppTextStyles.heading),
            const SizedBox(height: 20),
            _StepRow(
              icon: Icons.check_circle_outline,
              color: colors.success,
              text: 'Core connected',
            ),
            const SizedBox(height: 12),
            _StepRow(
              icon: Icons.radio_button_unchecked,
              color: colors.textSecondary,
              text: 'Start a League of Legends match',
            ),
            const SizedBox(height: 12),
            _StepRow(
              icon: Icons.radio_button_unchecked,
              color: colors.textSecondary,
              text: 'Advice appears automatically as the match unfolds',
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
