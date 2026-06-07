// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart' hide Badge;
import 'package:lol_coach/models/game_state.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/theme/app_text_styles.dart';
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
                        Text(player.championName, style: AppTextStyles.heading),
                        const SizedBox(width: 8),
                        Badge(
                          'Lv ${player.level}',
                          bg: AppColors.border,
                          fg: AppColors.cyan,
                        ),
                        if (player.position.isNotEmpty) ...[
                          const SizedBox(width: 6),
                          Badge(
                            player.position.toUpperCase(),
                            bg: AppColors.successSubtle,
                            fg: AppColors.success,
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 5),
                    Row(
                      children: [
                        KdaNum('${scores.kills}', AppColors.cyan),
                        const KdaSep(),
                        KdaNum('${scores.deaths}', AppColors.errorLight),
                        const KdaSep(),
                        KdaNum('${scores.assists}', AppColors.textPrimary),
                        const SizedBox(width: 14),
                        Text(
                          'CS ${scores.creepScore}',
                          style: AppTextStyles.caption,
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
              StatChip('HP', '${stats.healthMax.toInt()}', AppColors.success),
              StatChip(
                'AD',
                '${stats.attackDamage.toInt()}',
                AppColors.errorLight,
              ),
              StatChip('AP', '${stats.abilityPower.toInt()}', AppColors.magic),
              StatChip('MR', '${stats.magicResist.toInt()}', AppColors.cyan),
              StatChip('ARM', '${stats.armor.toInt()}', AppColors.gold),
              StatChip(
                'CRIT',
                '${(stats.critChance * 100).toInt()}%',
                AppColors.warning,
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
