import 'package:lol_coach/theme/app_colors.dart';
import 'package:flutter/material.dart';
import '../models/game_state.dart';
import 'shared_widgets.dart';

class ScoreboardSection extends StatefulWidget {
  final List<Player> allies;
  final List<Player> enemies;
  final Player localPlayer;

  const ScoreboardSection({
    super.key,
    required this.allies,
    required this.enemies,
    required this.localPlayer,
  });

  @override
  State<ScoreboardSection> createState() => _ScoreboardSectionState();
}

class _ScoreboardSectionState extends State<ScoreboardSection> {
  bool _expanded = true;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const AppColors.surfaceDark,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const AppColors.borderDark),
      ),
      child: Column(children: [
        InkWell(
          onTap: () => setState(() => _expanded = !_expanded),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
          child: Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(children: [
              const Icon(Icons.people_outline,
                  size: 16, color: AppColors.primaryGold),
              const SizedBox(width: 6),
              const Text(
                'SCOREBOARD',
                style: TextStyle(
                  color: AppColors.primaryGold,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5,
                ),
              ),
              const Spacer(),
              Icon(
                _expanded ? Icons.expand_less : Icons.expand_more,
                color: const AppColors.textMuted,
                size: 20,
              ),
            ]),
          ),
        ),
        if (_expanded) ...[
          const Divider(color: AppColors.borderDark, height: 1),
          TeamBlock(
            label: 'ALLIES',
            players: [widget.localPlayer, ...widget.allies],
            accentColor: const AppColors.blueDark,
            highlightName: widget.localPlayer.summonerName,
          ),
          const Divider(color: AppColors.borderDark, height: 1),
          TeamBlock(
            label: 'ENEMIES',
            players: widget.enemies,
            accentColor: const AppColors.redDark,
            highlightName: null,
          ),
          const SizedBox(height: 4),
        ],
      ]),
    );
  }
}

class TeamBlock extends StatelessWidget {
  final String label;
  final List<Player> players;
  final Color accentColor;
  final String? highlightName;

  const TeamBlock({
    super.key,
    required this.label,
    required this.players,
    required this.accentColor,
    required this.highlightName,
  });

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        width: double.infinity,
        padding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
        color: accentColor.withAlpha(60),
        child: Text(
          label,
          style: TextStyle(
            color: Color.lerp(accentColor, Colors.white, 0.6)!,
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 1,
          ),
        ),
      ),
      ...players.map((p) => PlayerRow(
            player: p,
            isHighlighted: p.summonerName == highlightName,
          )),
    ]);
  }
}

class PlayerRow extends StatelessWidget {
  final Player player;
  final bool isHighlighted;
  const PlayerRow({super.key, required this.player, required this.isHighlighted});

  @override
  Widget build(BuildContext context) {
    final s = player.scores;
    return Container(
      color: isHighlighted
          ? const AppColors.blueDeep.withAlpha(100)
          : Colors.transparent,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      child: Row(children: [
        ChampAvatar(name: player.championName, isDead: player.isDead, size: 26),
        const SizedBox(width: 8),
        Expanded(
          flex: 3,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                player.championName,
                style: TextStyle(
                  color: isHighlighted
                      ? const AppColors.secondaryCyan
                      : const AppColors.textLightGrey,
                  fontSize: 12,
                  fontWeight: isHighlighted
                      ? FontWeight.bold
                      : FontWeight.normal,
                ),
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                player.summonerName,
                style: const TextStyle(
                    color: AppColors.textDark, fontSize: 10),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        Text('Lv${player.level}',
            style:
                const TextStyle(color: AppColors.textMuted, fontSize: 11)),
        const SizedBox(width: 8),
        SizedBox(
          width: 64,
          child: Text(
            '${s.kills}/${s.deaths}/${s.assists}',
            style: const TextStyle(
                color: AppColors.textLightGrey, fontSize: 11),
            textAlign: TextAlign.center,
          ),
        ),
        SizedBox(
          width: 38,
          child: Text(
            '${s.creepScore}cs',
            style: const TextStyle(
                color: AppColors.textMuted, fontSize: 10),
            textAlign: TextAlign.right,
          ),
        ),
      ]),
    );
  }
}
