// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart' hide Badge;
import 'package:lol_coach/models/recommendation.dart';
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
        ],
      ),
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
