import 'package:lol_coach/theme/app_colors.dart';
import 'package:flutter/material.dart' hide Badge;
import '../models/recommendation.dart';
import 'shared_widgets.dart';

class RecommendationPanel extends StatelessWidget {
  final ItemRecommendation recommendation;
  const RecommendationPanel({super.key, required this.recommendation});

  @override
  Widget build(BuildContext context) {
    return GameCard(
      borderColor:
          recommendation.isLlm ? const AppColors.purpleLight : const AppColors.borderDark,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.lightbulb_outline,
                size: 15, color: AppColors.primaryGold),
            const SizedBox(width: 6),
            const Text(
              'RECOMMENDATIONS',
              style: TextStyle(
                color: AppColors.primaryGold,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.5,
              ),
            ),
            const Spacer(),
            Badge(
              recommendation.isLlm ? 'AI' : 'AUTO',
              bg: recommendation.isLlm
                  ? const AppColors.purpleDark
                  : const AppColors.blueDarker,
              fg: recommendation.isLlm
                  ? const AppColors.magicPurple
                  : const AppColors.secondaryCyan,
            ),
          ]),
          const SizedBox(height: 10),
          if (recommendation.items.isEmpty)
            const Text(
              'No specific counter items needed.',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13),
            )
          else
            ...recommendation.items.map((item) => _RecItemTile(item: item)),
          const Divider(color: AppColors.borderDark, height: 16),
          Text(
            recommendation.reasoning,
            style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _RecItemTile extends StatelessWidget {
  final RecommendedItem item;
  const _RecItemTile({required this.item});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: const AppColors.surfaceMedium,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(
              color: item.isCore
                  ? const AppColors.primaryGold
                  : const AppColors.blueBorder,
              width: 1.5,
            ),
          ),
          child: Center(
            child: Text(
              '${item.id % 1000}',
              style: const TextStyle(
                  color: AppColors.primaryGold,
                  fontSize: 9,
                  fontWeight: FontWeight.bold),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Flexible(
                  child: Text(
                    item.name,
                    style: const TextStyle(
                      color: AppColors.textLightGrey,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Badge(
                  item.isCore ? 'CORE' : 'SITUATIONAL',
                  bg: item.isCore
                      ? const AppColors.goldDark
                      : const AppColors.blackDeep,
                  fg: item.isCore
                      ? const AppColors.primaryGold
                      : const AppColors.blueGrey,
                ),
              ]),
              Text(item.reason,
                  style: const TextStyle(
                      color: AppColors.textMuted, fontSize: 11)),
            ],
          ),
        ),
      ]),
    );
  }
}
