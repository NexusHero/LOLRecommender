// ignore_for_file: lines_longer_than_80_chars
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

bool _isAiProvider(String type) => type != 'none' && type.isNotEmpty;

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
          body: Column(
            children: [
              if (ws.isConnected)
                _AiModeBanner(providerType: ws.activeProviderType),
              Expanded(child: _buildBody(context, ws)),
            ],
          ),
          floatingActionButton: ws.gameActive ? _PulsingFab(ws: ws) : null,
        );
      },
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

// ─── Status dot ──────────────────────────────────────────────────────────────

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

// ─── AI mode banner ──────────────────────────────────────────────────────────

class _AiModeBanner extends StatefulWidget {
  const _AiModeBanner({required this.providerType});
  final String providerType;

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
    final isAi = _isAiProvider(widget.providerType);
    final color = isAi ? AppColors.magic : AppColors.textSecondary;
    final bg = isAi
        ? AppColors.magic.withValues(alpha: 0.1)
        : AppColors.surfaceDark;
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
            color: color.withValues(alpha: isAi ? 0.25 : 0.1),
          ),
        ),
      ),
      child: Row(
        children: [
          AnimatedBuilder(
            animation: _pulse,
            builder: (_, __) => Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: color.withValues(alpha: isAi ? _pulse.value : 0.45),
                boxShadow: isAi
                    ? [
                        BoxShadow(
                          color: AppColors.magic.withValues(
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
              isAi ? '$label is coaching you' : 'Basic rules active',
              key: ValueKey(widget.providerType),
              style: AppTextStyles.caption.copyWith(
                color: color,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const Spacer(),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            child: isAi
                ? Container(
                    key: const ValueKey('ai'),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.magic.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(
                        color: AppColors.magic.withValues(alpha: 0.35),
                      ),
                    ),
                    child: const Text(
                      'AI',
                      style: TextStyle(
                        color: AppColors.magic,
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.2,
                      ),
                    ),
                  )
                : Container(
                    key: const ValueKey('basic'),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceMedium,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'BASIC',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2,
                      ),
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
  final WsService ws;

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
    final ws = widget.ws;
    final provider = ws.activeProviderType;
    final isAi = _isAiProvider(provider);
    final label = ws.isAnalyzing
        ? 'Analysing...'
        : isAi
            ? 'Analyse with ${_providerLabel(provider)}'
            : 'Analyse (Basic)';

    final fab = FloatingActionButton.extended(
      onPressed: ws.isAnalyzing ? null : ws.triggerAnalysis,
      backgroundColor: isAi ? AppColors.magic : AppColors.gold,
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
          : Icon(isAi ? Icons.smart_toy_outlined : Icons.bolt),
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
