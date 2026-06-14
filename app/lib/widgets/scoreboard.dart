// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart';
import 'package:lol_coach/models/game_state.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/theme/app_text_styles.dart';
import 'package:lol_coach/widgets/common/champ_avatar.dart';

class ScoreboardSection extends StatefulWidget {
  const ScoreboardSection({
    required this.allies,
    required this.enemies,
    required this.localPlayer,
    super.key,
  });
  final List<Player> allies;
  final List<Player> enemies;
  final Player localPlayer;

  @override
  State<ScoreboardSection> createState() => _ScoreboardSectionState();
}

class _ScoreboardSectionState extends State<ScoreboardSection> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      decoration: BoxDecoration(
        color: colors.surfaceDark,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: colors.border),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              child: Row(
                children: [
                  Icon(
                    Icons.people_outline,
                    size: 16,
                    color: colors.textSecondary,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'SCOREBOARD',
                    style: AppTextStyles.label.copyWith(
                      color: colors.textSecondary,
                    ),
                  ),
                  const Spacer(),
                  Icon(
                    _expanded ? Icons.expand_less : Icons.expand_more,
                    color: colors.textSecondary,
                    size: 20,
                  ),
                ],
              ),
            ),
          ),
          if (_expanded) ...[
            Divider(color: colors.border, height: 1),
            TeamBlock(
              label: 'ALLIES',
              players: [widget.localPlayer, ...widget.allies],
              accentColor: colors.allyBlue,
              highlightName: widget.localPlayer.summonerName,
            ),
            Divider(color: colors.border, height: 1),
            TeamBlock(
              label: 'ENEMIES',
              players: widget.enemies,
              accentColor: colors.enemyRed,
              highlightName: null,
            ),
            const SizedBox(height: 4),
          ],
        ],
      ),
    );
  }
}

class TeamBlock extends StatelessWidget {
  const TeamBlock({
    required this.label,
    required this.players,
    required this.accentColor,
    required this.highlightName,
    super.key,
  });
  final String label;
  final List<Player> players;
  final Color accentColor;
  final String? highlightName;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
          color: accentColor.withAlpha(50),
          child: Text(
            label,
            style: AppTextStyles.label.copyWith(
              color: Color.lerp(accentColor, colors.textPrimary, 0.5),
            ),
          ),
        ),
        ...players.map(
          (p) => PlayerRow(
            player: p,
            isHighlighted: p.summonerName == highlightName,
          ),
        ),
      ],
    );
  }
}

class PlayerRow extends StatelessWidget {
  const PlayerRow({
    required this.player,
    required this.isHighlighted,
    super.key,
  });
  final Player player;
  final bool isHighlighted;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final s = player.scores;
    return Container(
      color: isHighlighted
          ? colors.allySubtle.withAlpha(160)
          : Colors.transparent,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      child: Row(
        children: [
          ChampAvatar(
            name: player.championName,
            isDead: player.isDead,
            size: 26,
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  player.championName,
                  style: AppTextStyles.captionBold.copyWith(
                    color: isHighlighted ? colors.gold : colors.textPrimary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  player.summonerName,
                  style: AppTextStyles.caption.copyWith(
                    color: colors.textSecondary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Text(
            'Lv${player.level}',
            style: AppTextStyles.caption.copyWith(color: colors.textSecondary),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 64,
            child: Text(
              '${s.kills}/${s.deaths}/${s.assists}',
              style: AppTextStyles.captionBold.copyWith(
                color: colors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          SizedBox(
            width: 38,
            child: Text(
              '${s.creepScore}cs',
              style: AppTextStyles.caption.copyWith(
                color: colors.textSecondary,
              ),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }
}
