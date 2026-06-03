import 'package:flutter/material.dart' hide Badge;
import 'package:lol_coach/models/game_state.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/widgets/shared_widgets.dart';

class LocalPlayerCard extends StatelessWidget {
  const LocalPlayerCard({
    required this.player,
    required this.activePlayer,
    super.key,
  });
  final Player player;
  final ActivePlayer activePlayer;

  @override
  Widget build(BuildContext context) {
    final scores = player.scores;
    final stats = activePlayer.championStats;

    return GameCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ChampAvatar(name: player.championName, isDead: player.isDead),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          player.championName,
                          style: const TextStyle(
                            color: AppColors.textLightGrey,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Badge(
                          'Lv ${player.level}',
                          bg: AppColors.borderDark,
                          fg: AppColors.secondaryCyan,
                        ),
                        if (player.position.isNotEmpty) ...[
                          const SizedBox(width: 6),
                          Badge(
                            player.position.toUpperCase(),
                            bg: AppColors.greenDark,
                            fg: AppColors.greenLight,
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 5),
                    Row(
                      children: [
                        KdaNum('${scores.kills}', AppColors.secondaryCyan),
                        const KdaSep(),
                        KdaNum('${scores.deaths}', AppColors.errorRed),
                        const KdaSep(),
                        KdaNum('${scores.assists}', AppColors.textLightGrey),
                        const SizedBox(width: 14),
                        Text(
                          'CS ${scores.creepScore}',
                          style: const TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              StatChip(
                  'HP', '${stats.healthMax.toInt()}', AppColors.successGreen),
              StatChip(
                  'AD', '${stats.attackDamage.toInt()}', AppColors.errorRed),
              StatChip(
                  'AP', '${stats.abilityPower.toInt()}', AppColors.magicPurple),
              StatChip('MR', '${stats.magicResist.toInt()}',
                  AppColors.secondaryCyan),
              StatChip('ARM', '${stats.armor.toInt()}', AppColors.primaryGold),
              StatChip(
                'CRIT',
                '${(stats.critChance * 100).toInt()}%',
                AppColors.warningOrange,
              ),
            ],
          ),
          if (player.items.isNotEmpty) ...[
            const SizedBox(height: 12),
            ItemRow(items: player.items),
          ],
        ],
      ),
    );
  }
}
