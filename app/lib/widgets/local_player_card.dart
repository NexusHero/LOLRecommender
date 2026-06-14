// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart';
import 'package:lol_coach/models/game_state.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/theme/app_text_styles.dart';
import 'package:lol_coach/widgets/common/badge.dart';
import 'package:lol_coach/widgets/common/champ_avatar.dart';
import 'package:lol_coach/widgets/common/game_card.dart';
import 'package:lol_coach/widgets/common/item_row.dart';
import 'package:lol_coach/widgets/common/kda_stats.dart';

class LocalPlayerCard extends StatefulWidget {
  const LocalPlayerCard({
    required this.player,
    required this.activePlayer,
    super.key,
  });
  final Player player;
  final ActivePlayer activePlayer;

  @override
  State<LocalPlayerCard> createState() => _LocalPlayerCardState();
}

class _LocalPlayerCardState extends State<LocalPlayerCard> {
  bool _showAllStats = false;

  @override
  Widget build(BuildContext context) {
    final player = widget.player;
    final activePlayer = widget.activePlayer;
    final scores = player.scores;
    final stats = activePlayer.championStats;
    // Show only the offensive/defensive stats relevant to this champion by
    // default; the rest are tucked behind "Show more" to reduce clutter.
    final isApChamp = stats.abilityPower >= stats.attackDamage;
    final colors = context.colors;

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
                        AppBadge(
                          'Lv ${player.level}',
                          bg: colors.border,
                          fg: colors.textSecondary,
                        ),
                        if (player.position.isNotEmpty) ...[
                          const SizedBox(width: 6),
                          AppBadge(
                            player.position.toUpperCase(),
                            bg: colors.surfaceDark,
                            fg: colors.textSecondary,
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 5),
                    Row(
                      children: [
                        KdaNum('${scores.kills}', colors.success),
                        const KdaSep(),
                        KdaNum('${scores.deaths}', colors.errorLight),
                        const KdaSep(),
                        KdaNum('${scores.assists}', colors.textPrimary),
                        const SizedBox(width: 14),
                        Text(
                          'CS ${scores.creepScore}',
                          style: AppTextStyles.caption.copyWith(
                            color: colors.textSecondary,
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
                'HP',
                '${stats.healthMax.toInt()}',
                colors.textPrimary,
              ),
              if (isApChamp)
                StatChip(
                  'AP',
                  '${stats.abilityPower.toInt()}',
                  colors.textPrimary,
                )
              else
                StatChip(
                  'AD',
                  '${stats.attackDamage.toInt()}',
                  colors.textPrimary,
                ),
              StatChip(
                'ARM',
                '${stats.armor.toInt()}',
                colors.textPrimary,
              ),
              StatChip(
                'MR',
                '${stats.magicResist.toInt()}',
                colors.textPrimary,
              ),
              if (_showAllStats) ...[
                if (isApChamp)
                  StatChip(
                    'AD',
                    '${stats.attackDamage.toInt()}',
                    colors.textPrimary,
                  )
                else
                  StatChip(
                    'AP',
                    '${stats.abilityPower.toInt()}',
                    colors.textPrimary,
                  ),
                StatChip(
                  'CRIT',
                  '${(stats.critChance * 100).toInt()}%',
                  colors.textPrimary,
                ),
              ],
            ],
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              onPressed: () => setState(() => _showAllStats = !_showAllStats),
              child: Text(
                _showAllStats ? 'Less' : 'More stats',
                style: AppTextStyles.caption.copyWith(color: colors.gold),
              ),
            ),
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
