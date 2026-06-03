import 'package:flutter/material.dart';
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
                        color: Color(0xFFCDC8C2),
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Badge('Lv ${player.level}',
                        bg: const Color(0xFF1E3A5F),
                        fg: const Color(0xFF0BC4E3)),
                    if (player.position.isNotEmpty) ...[
                      const SizedBox(width: 6),
                      Badge(player.position.toUpperCase(),
                          bg: const Color(0xFF1A2A0A),
                          fg: const Color(0xFF7EC850)),
                    ],
                  ]),
                  const SizedBox(height: 5),
                  Row(children: [
                    KdaNum('${scores.kills}', const Color(0xFF0BC4E3)),
                    const KdaSep(),
                    KdaNum('${scores.deaths}', const Color(0xFFC3291F)),
                    const KdaSep(),
                    KdaNum('${scores.assists}', const Color(0xFFCDC8C2)),
                    const SizedBox(width: 14),
                    Text('CS ${scores.creepScore}',
                        style: const TextStyle(
                            color: Color(0xFF7A7A7A), fontSize: 12)),
                  ]),
                ],
              ),
            ),
          ]),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              StatChip('HP', '${stats.healthMax.toInt()}', const Color(0xFF2ECC71)),
              StatChip('AD', '${stats.attackDamage.toInt()}', const Color(0xFFC3291F)),
              StatChip('AP', '${stats.abilityPower.toInt()}', const Color(0xFF9B59B6)),
              StatChip('MR', '${stats.magicResist.toInt()}', const Color(0xFF0BC4E3)),
              StatChip('ARM', '${stats.armor.toInt()}', const Color(0xFFC89B3C)),
              StatChip('CRIT',
                  '${(stats.critChance * 100).toInt()}%', const Color(0xFFFF9800)),
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
