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

/// The in-game hero: the single "do this now" recommendation, rendered as the
/// app's one striking glass card. Restructured from the old RECOMMENDATIONS +
/// GAME PLAN panels into one scannable card — eyebrow, big action sentence,
/// the core item, win-condition + matchup chips, and supporting lines.
class RecommendationPanel extends StatefulWidget {
  const RecommendationPanel({
    required this.recommendation,
    super.key,
    this.triggerEvent,
    this.opponentChampion,
    this.isAnalyzing = false,
    this.recommendationTime,
    this.tokenUsage,
    this.tokenBudget = 0,
    this.isBudgetExceeded = false,
  });
  final ItemRecommendation recommendation;
  final String? triggerEvent;
  final String? opponentChampion;
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

  /// Runs the 5 s freshness ticker only while we actually have a timestamp,
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

  /// The one-line action that headlines the card.
  String get _heroAction {
    final s = widget.recommendation.strategy;
    final action = s?.immediateAction.trim();
    if (action != null && action.isNotEmpty) return action;
    final summary = s?.summary.trim();
    if (summary != null && summary.isNotEmpty) return summary;
    return widget.recommendation.reasoning;
  }

  /// The headline item — the first core pick, else the first listed item.
  RecommendedItem? get _heroItem {
    final items = widget.recommendation.items;
    if (items.isEmpty) return null;
    return items.firstWhere(
      (i) => i.isCore,
      orElse: () => items.first,
    );
  }

  @override
  Widget build(BuildContext context) {
    final rec = widget.recommendation;
    final colors = context.colors;
    final isLlm = rec.isLlm;
    final accent = isLlm ? colors.magic : colors.textSecondary;
    final hero = _heroItem;
    final strategy = rec.strategy;
    final rest = rec.items.where((i) => i != hero).toList();

    final card = GameCard(
      accent: isLlm ? colors.magic : null,
      glow: isLlm,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Eyebrow(
            label: isLlm ? 'DO THIS NOW' : 'SUGGESTED',
            color: accent,
            trailing: widget.isAnalyzing ? _UpdatingChip(color: accent) : null,
          ),
          const SizedBox(height: 12),
          Text(_heroAction, style: AppTextStyles.hero),
          if (hero != null) ...[
            const SizedBox(height: 18),
            _HeroItem(item: hero, accent: accent, isLlm: isLlm),
          ],
          if (rest.isNotEmpty) ...[
            const SizedBox(height: 10),
            ...rest.map((i) => _SecondaryItem(item: i)),
          ],
          if (strategy != null || widget.opponentChampion != null) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (strategy != null)
                  AppBadge.champagne('◆ ${_winLabel(strategy.winCondition)}'),
                if (widget.opponentChampion != null)
                  AppBadge.neutral('vs ${widget.opponentChampion}'),
              ],
            ),
          ],
          if (strategy?.laneMatchupAnalysis != null ||
              strategy?.counterPlay != null) ...[
            const SizedBox(height: 4),
            _LinesBlock(strategy: strategy!),
          ],
          _Footer(
            timeAgo: _timeAgo(),
            usage: widget.tokenUsage,
            budget: widget.tokenBudget,
            exceeded: widget.isBudgetExceeded,
          ),
        ],
      ),
    );

    // The flash overlay sits above the card and fades to nothing at rest, so
    // it never alters the steady-state appearance.
    final flashColor = isLlm ? colors.magic : colors.gold;
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
                      borderRadius: BorderRadius.circular(18),
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

    if (!isLlm) return withFlash;

    return AiSweepingBorder(
      strokeWidth: 2.5,
      sweepFraction: 0.32,
      duration: const Duration(milliseconds: 1600),
      child: withFlash,
    );
  }
}

String _winLabel(WinCondition w) => switch (w) {
      WinCondition.early => 'Early-game win',
      WinCondition.mid => 'Mid-game win',
      WinCondition.late => 'Late-game win',
    };

/// Uppercase eyebrow with a short leading rule, optionally trailed by a chip.
class _Eyebrow extends StatelessWidget {
  const _Eyebrow({required this.label, required this.color, this.trailing});
  final String label;
  final Color color;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 14,
          height: 1,
          color: color.withValues(alpha: 0.6),
        ),
        const SizedBox(width: 8),
        Text(label, style: AppTextStyles.eyebrow.copyWith(color: color)),
        const Spacer(),
        if (trailing != null) trailing!,
      ],
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
        Text('Updating…', style: AppTextStyles.micro.copyWith(color: color)),
      ],
    );
  }
}

/// The headline item, rendered in a tinted rounded row.
class _HeroItem extends StatelessWidget {
  const _HeroItem({
    required this.item,
    required this.accent,
    required this.isLlm,
  });
  final RecommendedItem item;
  final Color accent;
  final bool isLlm;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isLlm ? colors.magicSubtle : colors.surface2,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isLlm ? colors.magicLine : colors.border,
        ),
      ),
      child: Row(
        children: [
          ItemSlot(
            itemId: item.id,
            displayName: item.name,
            size: 52,
            borderColor: isLlm ? colors.magicLine : colors.border,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.name, style: AppTextStyles.heading),
                const SizedBox(height: 3),
                Text(
                  item.reason,
                  style: AppTextStyles.caption.copyWith(
                    color: colors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          if (isLlm)
            AppBadge.violet(item.isCore ? 'Core' : 'Buy')
          else
            AppBadge.neutral(item.isCore ? 'Core' : 'Buy'),
        ],
      ),
    );
  }
}

/// A compact secondary (situational) pick beneath the hero item.
class _SecondaryItem extends StatelessWidget {
  const _SecondaryItem({required this.item});
  final RecommendedItem item;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Row(
        children: [
          ItemSlot(itemId: item.id, displayName: item.name),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.name, style: AppTextStyles.bodyBold),
                Text(
                  item.reason,
                  style: AppTextStyles.caption.copyWith(
                    color: colors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          AppBadge.neutral(item.isCore ? 'Core' : 'Situational'),
        ],
      ),
    );
  }
}

/// The labelled supporting lines (Matchup / Counter).
class _LinesBlock extends StatelessWidget {
  const _LinesBlock({required this.strategy});
  final Strategy strategy;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final lines = <(String, String)>[
      if (strategy.laneMatchupAnalysis != null)
        ('Matchup', strategy.laneMatchupAnalysis!),
      if (strategy.counterPlay != null) ('Counter', strategy.counterPlay!),
    ];
    return Column(
      children: [
        for (var i = 0; i < lines.length; i++)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 13),
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(color: colors.hairlineSoft),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 64,
                  child: Text(
                    lines[i].$1.toUpperCase(),
                    style: AppTextStyles.eyebrow.copyWith(
                      color: colors.textDisabled,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    lines[i].$2,
                    style: AppTextStyles.caption.copyWith(
                      color: colors.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

/// Footer strip: session token usage on the left, freshness on the right.
class _Footer extends StatelessWidget {
  const _Footer({
    required this.timeAgo,
    this.usage,
    this.budget = 0,
    this.exceeded = false,
  });

  final String timeAgo;
  final TokenUsage? usage;
  final int budget;
  final bool exceeded;

  String _fmt(int n) {
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}k';
    return '$n';
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final String? left;
    if (exceeded) {
      left = 'Token budget exhausted';
    } else if (usage != null) {
      left = '${_fmt(usage!.sessionInput)} in · ${_fmt(usage!.sessionOutput)}'
          ' out';
    } else {
      left = null;
    }
    if (left == null && timeAgo.isEmpty) return const SizedBox.shrink();

    final color = exceeded ? colors.error : colors.textDisabled;
    return Container(
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.only(top: 14),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: colors.hairlineSoft)),
      ),
      child: Row(
        children: [
          if (left != null)
            Text(left, style: AppTextStyles.micro.copyWith(color: color)),
          const Spacer(),
          if (timeAgo.isNotEmpty)
            Text(
              timeAgo,
              style: AppTextStyles.micro.copyWith(color: colors.textDisabled),
            ),
        ],
      ),
    );
  }
}
