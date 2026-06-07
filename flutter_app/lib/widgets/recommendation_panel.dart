// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart' hide Badge;
import 'package:lol_coach/models/recommendation.dart';
import 'package:lol_coach/models/strategy.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/theme/app_text_styles.dart';
import 'package:lol_coach/widgets/shared_widgets.dart';

class RecommendationPanel extends StatelessWidget {
  const RecommendationPanel({
    required this.recommendation,
    super.key,
    this.recommendationTime,
  });
  final ItemRecommendation recommendation;
  final DateTime? recommendationTime;

  String _timeAgo() {
    if (recommendationTime == null) return '';
    final diff = DateTime.now().difference(recommendationTime!);
    if (diff.inSeconds < 10) return 'just now';
    if (diff.inSeconds < 60) return '${diff.inSeconds}s ago';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    return '${diff.inHours}h ago';
  }

  @override
  Widget build(BuildContext context) {
    final timeAgo = _timeAgo();

    return GameCard(
      borderColor: recommendation.isLlm ? AppColors.magic : AppColors.border,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.lightbulb_outline, size: 15, color: AppColors.cyan),
              const SizedBox(width: 6),
              const Text('RECOMMENDATIONS', style: AppTextStyles.label),
              const Spacer(),
              if (timeAgo.isNotEmpty) ...[
                Text(timeAgo, style: AppTextStyles.caption),
                const SizedBox(width: 8),
              ],
              Badge(
                recommendation.isLlm ? 'AI' : 'AUTO',
                bg: recommendation.isLlm ? AppColors.magicSubtle : AppColors.allySubtle,
                fg: recommendation.isLlm ? AppColors.magic : AppColors.cyan,
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (recommendation.items.isEmpty)
            const Text(
              'No specific counter items needed.',
              style: AppTextStyles.caption,
            )
          else
            ...recommendation.items.map((item) => _RecItemTile(item: item)),
          const Divider(color: AppColors.border, height: 16),
          Text(recommendation.reasoning, style: AppTextStyles.caption),
          if (recommendation.strategy != null) ...[
            const SizedBox(height: 12),
            _StrategyCard(strategy: recommendation.strategy!),
          ],
        ],
      ),
    );
  }
}

class _StrategyCard extends StatelessWidget {
  const _StrategyCard({required this.strategy});
  final Strategy strategy;

  Color get _conditionColor => switch (strategy.winCondition) {
        WinCondition.early => AppColors.success,
        WinCondition.mid => AppColors.gold,
        WinCondition.late => AppColors.magic,
      };

  Color get _conditionSubtle => switch (strategy.winCondition) {
        WinCondition.early => AppColors.successSubtle,
        WinCondition.mid => AppColors.goldSubtle,
        WinCondition.late => AppColors.magicSubtle,
      };

  String get _conditionLabel => switch (strategy.winCondition) {
        WinCondition.early => 'EARLY WIN',
        WinCondition.mid => 'MID WIN',
        WinCondition.late => 'LATE WIN',
      };

  @override
  Widget build(BuildContext context) {
    return GameCard(
      borderColor: _conditionColor,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.military_tech_outlined, size: 15, color: AppColors.gold),
              const SizedBox(width: 6),
              const Text('GAME PLAN', style: AppTextStyles.label),
              const Spacer(),
              Badge(
                _conditionLabel,
                bg: _conditionSubtle,
                fg: _conditionColor,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(strategy.summary, style: AppTextStyles.bodyBold),
          const SizedBox(height: 8),
          _StrategyRow(
            icon: Icons.arrow_forward,
            iconColor: AppColors.cyan,
            label: 'NOW',
            text: strategy.immediateAction,
          ),
          const SizedBox(height: 4),
          _StrategyRow(
            icon: Icons.flag_outlined,
            iconColor: _conditionColor,
            label: 'LATE',
            text: strategy.lateGamePlan,
          ),
          if (strategy.laneMatchupAnalysis != null || strategy.counterPlay != null) ...[
            const Divider(color: AppColors.border, height: 16),
            if (strategy.laneMatchupAnalysis != null) ...[
              _StrategyRow(
                icon: Icons.compare_arrows,
                iconColor: AppColors.textSecondary,
                label: 'MATCHUP',
                text: strategy.laneMatchupAnalysis!,
              ),
              const SizedBox(height: 4),
            ],
            if (strategy.counterPlay != null)
              _StrategyRow(
                icon: Icons.gps_fixed,
                iconColor: AppColors.warning,
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
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 13, color: iconColor),
        const SizedBox(width: 5),
        Badge(label, bg: AppColors.surfaceDark, fg: AppColors.textSecondary),
        const SizedBox(width: 6),
        Expanded(child: Text(text, style: AppTextStyles.caption)),
      ],
    );
  }
}

class _RecItemTile extends StatelessWidget {
  const _RecItemTile({required this.item});
  final RecommendedItem item;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          ItemSlot(
            itemId: item.id,
            displayName: item.name,
            borderColor: item.isCore ? AppColors.gold : AppColors.borderAccent,
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
                    Badge(
                      item.isCore ? 'CORE' : 'SITUATIONAL',
                      bg: item.isCore ? AppColors.goldSubtle : AppColors.allySubtle,
                      fg: item.isCore ? AppColors.gold : AppColors.textSecondary,
                    ),
                  ],
                ),
                Text(item.reason, style: AppTextStyles.caption),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
