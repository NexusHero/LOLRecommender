// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart';
import 'package:lol_coach/models/game_state.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/theme/app_text_styles.dart';
import 'package:lol_coach/widgets/common/champ_avatar.dart';
import 'package:lol_coach/widgets/common/game_card.dart';

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

  int _teamKills(Iterable<Player> players) =>
      players.fold(0, (sum, p) => sum + p.scores.kills);

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final allyKills = _teamKills([widget.localPlayer, ...widget.allies]);
    final enemyKills = _teamKills(widget.enemies);
    return GameCard(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              child: Row(
                children: [
                  Text(
                    'Scoreboard',
                    style: AppTextStyles.captionBold.copyWith(
                      color: colors.textSecondary,
                    ),
                  ),
                  const Spacer(),
                  // Team-kill summary so the collapsed bar still answers
                  // "who's ahead?" without duplicating the in-game Tab screen.
                  Text(
                    '$allyKills',
                    style: AppTextStyles.captionBold.copyWith(
                      color: colors.allyBlue,
                    ),
                  ),
                  Text(
                    ' – ',
                    style: AppTextStyles.caption.copyWith(
                      color: colors.textDisabled,
                    ),
                  ),
                  Text(
                    '$enemyKills',
                    style: AppTextStyles.captionBold.copyWith(
                      color: colors.enemyRed,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Icon(
                    _expanded ? Icons.expand_less : Icons.expand_more,
                    color: colors.textDisabled,
                    size: 20,
                  ),
                ],
              ),
            ),
          ),
          if (_expanded) ...[
            Divider(color: colors.hairlineSoft, height: 1),
            TeamBlock(
              label: 'ALLIES',
              players: [widget.localPlayer, ...widget.allies],
              accentColor: colors.allyBlue,
              highlightName: widget.localPlayer.summonerName,
            ),
            TeamBlock(
              label: 'ENEMIES',
              players: widget.enemies,
              accentColor: colors.enemyRed,
              highlightName: null,
            ),
            const SizedBox(height: 8),
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(18, 12, 18, 4),
          child: Text(
            label,
            style: AppTextStyles.eyebrow.copyWith(
              color: accentColor,
              letterSpacing: 1.2,
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
      color:
          isHighlighted ? colors.magicSubtle : Colors.transparent,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
      child: Row(
        children: [
          ChampAvatar(
            name: player.championName,
            isDead: player.isDead,
            size: 24,
          ),
          const SizedBox(width: 10),
          Expanded(
            flex: 3,
            child: Text(
              player.championName,
              style: AppTextStyles.captionBold.copyWith(
                color: isHighlighted ? colors.magic : colors.textPrimary,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Text(
            '${s.kills}/${s.deaths}/${s.assists}',
            style: AppTextStyles.micro.copyWith(color: colors.textDisabled),
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 42,
            child: Text(
              '${s.creepScore} cs',
              style: AppTextStyles.micro.copyWith(color: colors.textDisabled),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }
}
