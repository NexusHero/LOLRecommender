import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lol_coach/models/recommendation.dart';
import 'package:lol_coach/models/strategy.dart';
import 'package:lol_coach/models/token_usage.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/theme/app_text_styles.dart';
import 'package:lol_coach/widgets/common/ai_sweeping_border.dart';
import 'package:lol_coach/widgets/common/badge.dart';
import 'package:lol_coach/widgets/common/game_card.dart';
import 'package:lol_coach/widgets/common/item_slot.dart';

/// Human-readable label + icon for the raw game event that triggered the
/// current recommendation. Returns null for events not worth surfacing
/// (e.g. plain ticks).
({String label, IconData icon})? _triggerMeta(String? event) {
  switch (event) {
    case 'GAME_STARTED':
      return (label: 'Game start', icon: Icons.flag_outlined);
    case 'PLAYER_DIED':
      return (label: 'After your death', icon: Icons.dangerous_outlined);
    case 'HIGH_GOLD_REACHED':
      return (label: 'Gold to spend', icon: Icons.monetization_on_outlined);
    case 'LEVEL_UP':
      return (label: 'Level up', icon: Icons.trending_up);
    case 'ITEM_PURCHASED':
      return (label: 'Build changed', icon: Icons.shopping_bag_outlined);
    case 'MANUAL':
      return (label: 'Manual refresh', icon: Icons.refresh);
    default:
      return null;
  }
}

class RecommendationPanel extends StatefulWidget {
  const RecommendationPanel({
    required this.recommendation,
    super.key,
    this.triggerEvent,
    this.isAnalyzing = false,
    this.recommendationTime,
    this.tokenUsage,
    this.tokenBudget = 0,
    this.isBudgetExceeded = false,
  });
  final ItemRecommendation recommendation;
  final String? triggerEvent;
  final bool isAnalyzing;
  final DateTime? recommendationTime;
  final TokenUsage? tokenUsage;
  final int tokenBudget;
  final bool isBudgetExceeded;

  @override
  State<RecommendationPanel> createState() => _RecommendationPanelState();
}

class _RecommendationPanelState extends State<RecommendationPanel>
    with SingleTickerProviderStateMixin {
  // One-shot highlight when a fresh recommendation arrives — the attention
  // cue for a second-monitor glance.
  late final AnimationController _flash;

  // Keeps the "Xs ago" freshness label live without an external rebuild.
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    _flash = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    );
    _syncTicker();
  }

  @override
  void didUpdateWidget(RecommendationPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    final t = widget.recommendationTime;
    if (t != null && t != oldWidget.recommendationTime) {
      // A genuinely new recommendation landed → flash to catch the eye.
      _flash.forward(from: 0);
    }
    _syncTicker();
  }

  /// Runs the 1 Hz freshness ticker only while we actually have a timestamp,
  /// so static usages (and widget tests) never leave a timer pending.
  void _syncTicker() {
    final needed = widget.recommendationTime != null;
    if (needed && _ticker == null) {
      _ticker = Timer.periodic(const Duration(seconds: 5), (_) {
        if (mounted) setState(() {});
      });
    } else if (!needed) {
      _ticker?.cancel();
      _ticker = null;
    }
  }

  @override
  void dispose() {
    _ticker?.cancel();
    _flash.dispose();
    super.dispose();
  }

  String _timeAgo() {
    if (widget.recommendationTime == null) return '';
    final diff = DateTime.now().difference(widget.recommendationTime!);
    if (diff.inSeconds < 10) return 'just now';
    if (diff.inSeconds < 60) return '${diff.inSeconds}s ago';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    return '${diff.inHours}h ago';
  }

  IconData get _providerIcon =>
      widget.recommendation.isLlm ? Icons.smart_toy_outlined : Icons.tune;

  @override
  Widget build(BuildContext context) {
    final rec = widget.recommendation;
    final colors = context.colors;
    final timeAgo = _timeAgo();
    final providerColor = rec.isLlm ? colors.magic : colors.textSecondary;
    final trigger = _triggerMeta(widget.triggerEvent);

    final card = GameCard(
      borderColor: rec.isLlm ? colors.magic : colors.border,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(_providerIcon, size: 18, color: providerColor),
              const SizedBox(width: 8),
              Text(
                'RECOMMENDATIONS',
                style: AppTextStyles.label.copyWith(
                  color: colors.textSecondary,
                ),
              ),
              const Spacer(),
              if (widget.isAnalyzing)
                _UpdatingChip(color: providerColor)
              else if (timeAgo.isNotEmpty)
                Text(
                  timeAgo,
                  style: AppTextStyles.caption.copyWith(
                    color: colors.textSecondary,
                  ),
                ),
            ],
          ),
          if (trigger != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(trigger.icon, size: 13, color: colors.gold),
                const SizedBox(width: 5),
                Text(
                  trigger.label,
                  style: AppTextStyles.captionBold.copyWith(color: colors.gold),
                ),
              ],
            ),
          ],
          const SizedBox(height: 12),
          Divider(color: colors.border, height: 1),
          const SizedBox(height: 12),
          if (rec.items.isEmpty)
            Text(
              'No specific counter items needed.',
              style: AppTextStyles.caption.copyWith(
                color: colors.textSecondary,
              ),
            )
          else
            ...rec.items.map((item) => _RecItemTile(item: item)),
          Divider(color: colors.border, height: 16),
          Text(
            rec.reasoning,
            style: AppTextStyles.caption.copyWith(color: colors.textSecondary),
          ),
          if (rec.strategy != null) ...[
            const SizedBox(height: 12),
            _StrategyCard(strategy: rec.strategy!),
          ],
          if (widget.tokenUsage != null || widget.isBudgetExceeded) ...[
            const SizedBox(height: 10),
            _TokenUsageRow(
              usage: widget.tokenUsage,
              budget: widget.tokenBudget,
              exceeded: widget.isBudgetExceeded,
            ),
          ],
        ],
      ),
    );

    // The flash overlay sits above the card and fades to nothing at rest, so
    // it never alters the steady-state appearance.
    final flashColor = rec.isLlm ? colors.magic : colors.gold;
    final withFlash = AnimatedBuilder(
      animation: _flash,
      builder: (context, child) {
        final v = 1.0 - Curves.easeOut.transform(_flash.value);
        return Stack(
          children: [
            child!,
            if (v > 0)
              Positioned.fill(
                child: IgnorePointer(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: flashColor.withValues(alpha: v),
                        width: 2.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: flashColor.withValues(alpha: v * 0.5),
                          blurRadius: 28,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        );
      },
      child: card,
    );

    if (!rec.isLlm) return withFlash;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: colors.magic.withValues(alpha: 0.22),
            blurRadius: 24,
            offset: const Offset(0, 4),
          ),
          BoxShadow(
            color: colors.magic.withValues(alpha: 0.08),
            blurRadius: 50,
            spreadRadius: 2,
          ),
        ],
      ),
      child: AiSweepingBorder(
        strokeWidth: 2.5,
        sweepFraction: 0.32,
        duration: const Duration(milliseconds: 1600),
        child: withFlash,
      ),
    );
  }
}

/// Small animated "Updating…" pill shown while a refresh is in flight and the
/// previous advice is still on screen (so it never looks stale-but-frozen).
class _UpdatingChip extends StatelessWidget {
  const _UpdatingChip({required this.color});
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: 10,
          height: 10,
          child: CircularProgressIndicator(strokeWidth: 1.6, color: color),
        ),
        const SizedBox(width: 6),
        Text(
          'Updating…',
          style: AppTextStyles.caption.copyWith(color: color),
        ),
      ],
    );
  }
}

class _StrategyCard extends StatelessWidget {
  const _StrategyCard({required this.strategy});
  final Strategy strategy;

  String get _conditionLabel => switch (strategy.winCondition) {
        WinCondition.early => 'EARLY WIN',
        WinCondition.mid => 'MID WIN',
        WinCondition.late => 'LATE WIN',
      };

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final conditionColor = switch (strategy.winCondition) {
      WinCondition.early => colors.success,
      WinCondition.mid => colors.gold,
      WinCondition.late => colors.magic,
    };
    final conditionSubtle = switch (strategy.winCondition) {
      WinCondition.early => colors.successSubtle,
      WinCondition.mid => colors.goldSubtle,
      WinCondition.late => colors.magicSubtle,
    };

    return GameCard(
      borderColor: conditionColor,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.military_tech_outlined,
                size: 15,
                color: colors.gold,
              ),
              const SizedBox(width: 6),
              Text(
                'GAME PLAN',
                style: AppTextStyles.label.copyWith(
                  color: colors.textSecondary,
                ),
              ),
              const Spacer(),
              AppBadge(
                _conditionLabel,
                bg: conditionSubtle,
                fg: conditionColor,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(strategy.summary, style: AppTextStyles.bodyBold),
          const SizedBox(height: 8),
          _StrategyRow(
            icon: Icons.arrow_forward,
            iconColor: colors.textSecondary,
            label: 'NOW',
            text: strategy.immediateAction,
          ),
          const SizedBox(height: 4),
          _StrategyRow(
            icon: Icons.flag_outlined,
            iconColor: conditionColor,
            label: 'LATE',
            text: strategy.lateGamePlan,
          ),
          if (strategy.laneMatchupAnalysis != null ||
              strategy.counterPlay != null) ...[
            Divider(color: colors.border, height: 16),
            if (strategy.laneMatchupAnalysis != null) ...[
              _StrategyRow(
                icon: Icons.compare_arrows,
                iconColor: colors.textSecondary,
                label: 'MATCHUP',
                text: strategy.laneMatchupAnalysis!,
              ),
              const SizedBox(height: 4),
            ],
            if (strategy.counterPlay != null)
              _StrategyRow(
                icon: Icons.gps_fixed,
                iconColor: colors.warning,
                label: 'COUNTER',
                text: strategy.counterPlay!,
              ),
          ],
        ],
      ),
    );
  }
}

class _StrategyRow extends StatelessWidget {
  const _StrategyRow({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.text,
  });

  final IconData icon;
  final Color iconColor;
  final String label;
  final String text;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 13, color: iconColor),
        const SizedBox(width: 5),
        AppBadge(label, bg: colors.surfaceDark, fg: colors.textSecondary),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: AppTextStyles.caption.copyWith(
              color: colors.textSecondary,
            ),
          ),
        ),
      ],
    );
  }
}

class _TokenUsageRow extends StatelessWidget {
  const _TokenUsageRow({this.usage, this.budget = 0, this.exceeded = false});

  final TokenUsage? usage;
  final int budget;
  final bool exceeded;

  String _fmt(int n) {
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}k';
    return '$n';
  }

  double? get _budgetFraction {
    if (budget <= 0 || usage == null) return null;
    return (usage!.sessionInput / budget).clamp(0.0, 1.0);
  }

  Color _resolveColor(AppColors colors) {
    if (exceeded) return colors.error;
    final f = _budgetFraction;
    if (f != null && f >= 0.8) return colors.warning;
    return colors.textSecondary;
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final color = _resolveColor(colors);
    final fraction = _budgetFraction;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Divider(color: colors.border, height: 1),
        const SizedBox(height: 6),
        Row(
          children: [
            Icon(Icons.token_outlined, size: 12, color: color),
            const SizedBox(width: 5),
            if (exceeded)
              Text(
                'Token budget exhausted — using heuristic',
                style: AppTextStyles.caption.copyWith(color: color),
              )
            else if (usage != null)
              Expanded(
                child: Text(
                  'Session: ${_fmt(usage!.sessionInput)} in'
                  ' / ${_fmt(usage!.sessionOutput)} out'
                  '${budget > 0 ? ' · ${_fmt(usage!.sessionInput)}'
                      '/${_fmt(budget)}' : ''}',
                  style: AppTextStyles.caption.copyWith(color: color),
                ),
              ),
          ],
        ),
        if (fraction != null) ...[
          const SizedBox(height: 4),
          ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: LinearProgressIndicator(
              value: fraction,
              minHeight: 3,
              backgroundColor: colors.border,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ],
      ],
    );
  }
}

class _RecItemTile extends StatelessWidget {
  const _RecItemTile({required this.item});
  final RecommendedItem item;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isCore = item.isCore;
    // Core items are the at-a-glance answer — render them larger and bolder
    // than situational picks so they read from across the room.
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          ItemSlot(
            itemId: item.id,
            displayName: item.name,
            size: isCore ? 42 : 34,
            borderColor: isCore ? colors.gold : colors.borderAccent,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        item.name,
                        style: isCore
                            ? const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                              )
                            : AppTextStyles.bodyBold,
                      ),
                    ),
                    const SizedBox(width: 6),
                    AppBadge(
                      isCore ? 'CORE' : 'SITUATIONAL',
                      bg: isCore ? colors.goldSubtle : colors.allySubtle,
                      fg: isCore ? colors.gold : colors.textSecondary,
                    ),
                  ],
                ),
                Text(
                  item.reason,
                  style: AppTextStyles.caption.copyWith(
                    color: colors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
