import 'package:lol_coach/theme/app_colors.dart';
import 'package:flutter/material.dart' hide Badge;
import '../models/game_state.dart';
import 'shared_widgets.dart';

class LocalPlayerCard extends StatelessWidget {
  final Player player;
  final ActivePlayer activePlayer;
  const LocalPlayerCard(
      {super.key, required this.player, required this.activePlayer});

  @override
  Widget build(BuildContext context) {
    final scores = player.scores;
    final stats = activePlayer.championStats;

    return GameCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            ChampAvatar(name: player.championName, isDead: player.isDead),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Text(
                      player.championName,
                      style: const TextStyle(
                        color: AppColors.textLightGrey,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Badge('Lv ${player.level}',
                        bg: const AppColors.borderDark,
                        fg: const AppColors.secondaryCyan),
                    if (player.position.isNotEmpty) ...[
                      const SizedBox(width: 6),
                      Badge(player.position.toUpperCase(),
                          bg: const AppColors.greenDark,
                          fg: const AppColors.greenLight),
                    ],
                  ]),
                  const SizedBox(height: 5),
                  Row(children: [
                    KdaNum('${scores.kills}', const AppColors.secondaryCyan),
                    const KdaSep(),
                    KdaNum('${scores.deaths}', const AppColors.errorRed),
                    const KdaSep(),
                    KdaNum('${scores.assists}', const AppColors.textLightGrey),
                    const SizedBox(width: 14),
                    Text('CS ${scores.creepScore}',
                        style: const TextStyle(
                            color: AppColors.textMuted, fontSize: 12)),
                  ]),
                ],
              ),
            ),
          ]),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              StatChip('HP', '${stats.healthMax.toInt()}', const AppColors.successGreen),
              StatChip('AD', '${stats.attackDamage.toInt()}', const AppColors.errorRed),
              StatChip('AP', '${stats.abilityPower.toInt()}', const AppColors.magicPurple),
              StatChip('MR', '${stats.magicResist.toInt()}', const AppColors.secondaryCyan),
              StatChip('ARM', '${stats.armor.toInt()}', const AppColors.primaryGold),
              StatChip('CRIT',
                  '${(stats.critChance * 100).toInt()}%', const AppColors.warningOrange),
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
