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

class RecommendationPanel extends StatelessWidget {
  const RecommendationPanel({
    required this.recommendation,
    super.key,
    this.recommendationTime,
    this.tokenUsage,
    this.tokenBudget = 0,
    this.isBudgetExceeded = false,
  });
  final ItemRecommendation recommendation;
  final DateTime? recommendationTime;
  final TokenUsage? tokenUsage;
  final int tokenBudget;
  final bool isBudgetExceeded;

  String _timeAgo() {
    if (recommendationTime == null) return '';
    final diff = DateTime.now().difference(recommendationTime!);
    if (diff.inSeconds < 10) return 'just now';
    if (diff.inSeconds < 60) return '${diff.inSeconds}s ago';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    return '${diff.inHours}h ago';
  }

  IconData get _providerIcon {
    return recommendation.isLlm ? Icons.smart_toy_outlined : Icons.tune;
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final timeAgo = _timeAgo();
    final providerColor =
        recommendation.isLlm ? colors.magic : colors.textSecondary;

    final card = GameCard(
      borderColor: recommendation.isLlm ? colors.magic : colors.border,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header — calm icon + title, no provider/AI chrome
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
              if (timeAgo.isNotEmpty)
                Text(
                  timeAgo,
                  style: AppTextStyles.caption.copyWith(
                    color: colors.textSecondary,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Divider(color: colors.border, height: 1),
          const SizedBox(height: 12),
          if (recommendation.items.isEmpty)
            Text(
              'No specific counter items needed.',
              style: AppTextStyles.caption.copyWith(
                color: colors.textSecondary,
              ),
            )
          else
            ...recommendation.items.map((item) => _RecItemTile(item: item)),
          Divider(color: colors.border, height: 16),
          Text(
            recommendation.reasoning,
            style: AppTextStyles.caption.copyWith(color: colors.textSecondary),
          ),
          if (recommendation.strategy != null) ...[
            const SizedBox(height: 12),
            _StrategyCard(strategy: recommendation.strategy!),
          ],
          if (tokenUsage != null || isBudgetExceeded) ...[
            const SizedBox(height: 10),
            _TokenUsageRow(
              usage: tokenUsage,
              budget: tokenBudget,
              exceeded: isBudgetExceeded,
            ),
          ],
        ],
      ),
    );

    if (!recommendation.isLlm) return card;

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
        child: card,
      ),
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
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          ItemSlot(
            itemId: item.id,
            displayName: item.name,
            borderColor: item.isCore ? colors.gold : colors.borderAccent,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(item.name, style: AppTextStyles.bodyBold),
                    ),
                    const SizedBox(width: 6),
                    AppBadge(
                      item.isCore ? 'CORE' : 'SITUATIONAL',
                      bg: item.isCore ? colors.goldSubtle : colors.allySubtle,
                      fg: item.isCore ? colors.gold : colors.textSecondary,
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
