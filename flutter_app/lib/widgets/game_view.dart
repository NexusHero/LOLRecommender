import 'package:flutter/material.dart';
import '../models/game_state.dart';
import '../models/recommendation.dart';

class GameView extends StatelessWidget {
  final ParsedGameState gameState;
  final ItemRecommendation? recommendation;
  final String lastEvent;

  const GameView({
    super.key,
    required this.gameState,
    this.recommendation,
    required this.lastEvent,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _GameTopBar(gameState: gameState),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Column(
              children: [
                _LocalPlayerCard(
                  player: gameState.localPlayer,
                  activePlayer: gameState.activePlayer,
                ),
                if (recommendation != null) ...[
                  const SizedBox(height: 10),
                  _RecommendationPanel(recommendation: recommendation!),
                ],
                const SizedBox(height: 10),
                _ScoreboardSection(
                  allies: gameState.allies,
                  enemies: gameState.enemies,
                  localPlayer: gameState.localPlayer,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Game Top Bar ──────────────────────────────────────────────────────────────

class _GameTopBar extends StatelessWidget {
  final ParsedGameState gameState;
  const _GameTopBar({required this.gameState});

  String _fmt(double sec) {
    final m = (sec / 60).floor();
    final s = (sec % 60).floor();
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF091428),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            gameState.gameMode.toUpperCase(),
            style: const TextStyle(
              color: Color(0xFFC89B3C),
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.5,
            ),
          ),
          Row(children: [
            const Icon(Icons.timer_outlined, size: 14, color: Color(0xFF7A7A7A)),
            const SizedBox(width: 4),
            Text(
              _fmt(gameState.gameTime),
              style: const TextStyle(
                color: Color(0xFFCDC8C2),
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
          ]),
          Row(children: [
            const Icon(Icons.monetization_on_outlined,
                size: 14, color: Color(0xFFC89B3C)),
            const SizedBox(width: 4),
            Text(
              '${gameState.activePlayer.currentGold.toInt()}g',
              style: const TextStyle(
                color: Color(0xFFC89B3C),
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
          ]),
        ],
      ),
    );
  }
}

// ─── Local Player Card ─────────────────────────────────────────────────────────

class _LocalPlayerCard extends StatelessWidget {
  final Player player;
  final ActivePlayer activePlayer;
  const _LocalPlayerCard(
      {required this.player, required this.activePlayer});

  @override
  Widget build(BuildContext context) {
    final scores = player.scores;
    final stats = activePlayer.championStats;

    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            _ChampAvatar(name: player.championName, isDead: player.isDead),
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
                    _Badge('Lv ${player.level}',
                        bg: const Color(0xFF1E3A5F),
                        fg: const Color(0xFF0BC4E3)),
                    if (player.position.isNotEmpty) ...[
                      const SizedBox(width: 6),
                      _Badge(player.position.toUpperCase(),
                          bg: const Color(0xFF1A2A0A),
                          fg: const Color(0xFF7EC850)),
                    ],
                  ]),
                  const SizedBox(height: 5),
                  Row(children: [
                    _KdaNum('${scores.kills}', const Color(0xFF0BC4E3)),
                    const _Sep(),
                    _KdaNum('${scores.deaths}', const Color(0xFFC3291F)),
                    const _Sep(),
                    _KdaNum('${scores.assists}', const Color(0xFFCDC8C2)),
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
              _Stat('HP', '${stats.healthMax.toInt()}', const Color(0xFF2ECC71)),
              _Stat('AD', '${stats.attackDamage.toInt()}', const Color(0xFFC3291F)),
              _Stat('AP', '${stats.abilityPower.toInt()}', const Color(0xFF9B59B6)),
              _Stat('MR', '${stats.magicResist.toInt()}', const Color(0xFF0BC4E3)),
              _Stat('ARM', '${stats.armor.toInt()}', const Color(0xFFC89B3C)),
              _Stat('CRIT',
                  '${(stats.critChance * 100).toInt()}%', const Color(0xFFFF9800)),
            ],
          ),
          if (player.items.isNotEmpty) ...[
            const SizedBox(height: 12),
            _ItemRow(items: player.items),
          ],
        ],
      ),
    );
  }
}

// ─── Recommendation Panel ──────────────────────────────────────────────────────

class _RecommendationPanel extends StatelessWidget {
  final ItemRecommendation recommendation;
  const _RecommendationPanel({required this.recommendation});

  @override
  Widget build(BuildContext context) {
    return _Card(
      borderColor:
          recommendation.isLlm ? const Color(0xFF7B68EE) : const Color(0xFF1E3A5F),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.lightbulb_outline,
                size: 15, color: Color(0xFFC89B3C)),
            const SizedBox(width: 6),
            const Text(
              'EMPFEHLUNGEN',
              style: TextStyle(
                color: Color(0xFFC89B3C),
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.5,
              ),
            ),
            const Spacer(),
            _Badge(
              recommendation.isLlm ? 'AI' : 'AUTO',
              bg: recommendation.isLlm
                  ? const Color(0xFF2A1A3A)
                  : const Color(0xFF0D2040),
              fg: recommendation.isLlm
                  ? const Color(0xFF9B59B6)
                  : const Color(0xFF0BC4E3),
            ),
          ]),
          const SizedBox(height: 10),
          if (recommendation.items.isEmpty)
            const Text(
              'Keine spezifischen Counter-Items nötig.',
              style: TextStyle(color: Color(0xFF7A7A7A), fontSize: 13),
            )
          else
            ...recommendation.items.map((item) => _RecItemTile(item: item)),
          const Divider(color: Color(0xFF1E3A5F), height: 16),
          Text(
            recommendation.reasoning,
            style: const TextStyle(color: Color(0xFF7A7A7A), fontSize: 12),
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
            color: const Color(0xFF091428),
            borderRadius: BorderRadius.circular(4),
            border: Border.all(
              color: item.isCore
                  ? const Color(0xFFC89B3C)
                  : const Color(0xFF2A4A6A),
              width: 1.5,
            ),
          ),
          child: Center(
            child: Text(
              '${item.id % 1000}',
              style: const TextStyle(
                  color: Color(0xFFC89B3C),
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
                      color: Color(0xFFCDC8C2),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                _Badge(
                  item.isCore ? 'CORE' : 'SITUATIV',
                  bg: item.isCore
                      ? const Color(0xFF1A1200)
                      : const Color(0xFF0A1020),
                  fg: item.isCore
                      ? const Color(0xFFC89B3C)
                      : const Color(0xFF5A7A9A),
                ),
              ]),
              Text(item.reason,
                  style: const TextStyle(
                      color: Color(0xFF7A7A7A), fontSize: 11)),
            ],
          ),
        ),
      ]),
    );
  }
}

// ─── Scoreboard ────────────────────────────────────────────────────────────────

class _ScoreboardSection extends StatefulWidget {
  final List<Player> allies;
  final List<Player> enemies;
  final Player localPlayer;

  const _ScoreboardSection({
    required this.allies,
    required this.enemies,
    required this.localPlayer,
  });

  @override
  State<_ScoreboardSection> createState() => _ScoreboardSectionState();
}

class _ScoreboardSectionState extends State<_ScoreboardSection> {
  bool _expanded = true;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0D1B2E),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFF1E3A5F)),
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
                  size: 16, color: Color(0xFFC89B3C)),
              const SizedBox(width: 6),
              const Text(
                'SCOREBOARD',
                style: TextStyle(
                  color: Color(0xFFC89B3C),
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5,
                ),
              ),
              const Spacer(),
              Icon(
                _expanded ? Icons.expand_less : Icons.expand_more,
                color: const Color(0xFF7A7A7A),
                size: 20,
              ),
            ]),
          ),
        ),
        if (_expanded) ...[
          const Divider(color: Color(0xFF1E3A5F), height: 1),
          _TeamBlock(
            label: 'VERBÜNDETE',
            players: [widget.localPlayer, ...widget.allies],
            accentColor: const Color(0xFF005A82),
            highlightName: widget.localPlayer.summonerName,
          ),
          const Divider(color: Color(0xFF1E3A5F), height: 1),
          _TeamBlock(
            label: 'GEGNER',
            players: widget.enemies,
            accentColor: const Color(0xFF6B1B1B),
            highlightName: null,
          ),
          const SizedBox(height: 4),
        ],
      ]),
    );
  }
}

class _TeamBlock extends StatelessWidget {
  final String label;
  final List<Player> players;
  final Color accentColor;
  final String? highlightName;

  const _TeamBlock({
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
      ...players.map((p) => _PlayerRow(
            player: p,
            isHighlighted: p.summonerName == highlightName,
          )),
    ]);
  }
}

class _PlayerRow extends StatelessWidget {
  final Player player;
  final bool isHighlighted;
  const _PlayerRow({required this.player, required this.isHighlighted});

  @override
  Widget build(BuildContext context) {
    final s = player.scores;
    return Container(
      color: isHighlighted
          ? const Color(0xFF0A2040).withAlpha(100)
          : Colors.transparent,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      child: Row(children: [
        _ChampAvatar(name: player.championName, isDead: player.isDead, size: 26),
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
                      ? const Color(0xFF0BC4E3)
                      : const Color(0xFFCDC8C2),
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
                    color: Color(0xFF4A4A4A), fontSize: 10),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        Text('Lv${player.level}',
            style:
                const TextStyle(color: Color(0xFF7A7A7A), fontSize: 11)),
        const SizedBox(width: 8),
        SizedBox(
          width: 64,
          child: Text(
            '${s.kills}/${s.deaths}/${s.assists}',
            style: const TextStyle(
                color: Color(0xFFCDC8C2), fontSize: 11),
            textAlign: TextAlign.center,
          ),
        ),
        SizedBox(
          width: 38,
          child: Text(
            '${s.creepScore}cs',
            style: const TextStyle(
                color: Color(0xFF7A7A7A), fontSize: 10),
            textAlign: TextAlign.right,
          ),
        ),
      ]),
    );
  }
}

// ─── Shared small widgets ──────────────────────────────────────────────────────

class _Card extends StatelessWidget {
  final Widget child;
  final Color borderColor;

  const _Card({
    required this.child,
    this.borderColor = const Color(0xFF1E3A5F),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF0D1B2E),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: borderColor),
      ),
      child: child,
    );
  }
}

class _ChampAvatar extends StatelessWidget {
  final String name;
  final bool isDead;
  final double size;

  const _ChampAvatar(
      {required this.name, required this.isDead, this.size = 48});

  Color _color(String n) {
    final h = n.codeUnits.fold(0, (a, b) => a + b);
    return HSLColor.fromAHSL(1, ((h * 37) % 360).toDouble(), 0.55, 0.28)
        .toColor();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: isDead ? const Color(0xFF2A2A2A) : _color(name),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
          color:
              isDead ? const Color(0xFF444444) : const Color(0xFFC89B3C),
          width: 1,
        ),
      ),
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: TextStyle(
            color: isDead
                ? const Color(0xFF666666)
                : const Color(0xFFCDC8C2),
            fontSize: size * 0.42,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}

class _ItemRow extends StatelessWidget {
  final List<Item> items;
  const _ItemRow({required this.items});

  @override
  Widget build(BuildContext context) {
    final sorted = [...items]..sort((a, b) => a.slot.compareTo(b.slot));
    return Wrap(
      spacing: 4,
      runSpacing: 4,
      children: sorted
          .map((item) => Tooltip(
                message: item.displayName,
                child: Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: const Color(0xFF091428),
                    borderRadius: BorderRadius.circular(3),
                    border: Border.all(
                        color: const Color(0xFF2A4A6A), width: 1),
                  ),
                  child: Center(
                    child: Text(
                      item.displayName.isNotEmpty
                          ? item.displayName[0]
                          : '?',
                      style: const TextStyle(
                          color: Color(0xFFC89B3C),
                          fontSize: 11,
                          fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ))
          .toList(),
    );
  }
}

class _Badge extends StatelessWidget {
  final String text;
  final Color bg;
  final Color fg;
  const _Badge(this.text, {required this.bg, required this.fg});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      decoration:
          BoxDecoration(color: bg, borderRadius: BorderRadius.circular(3)),
      child: Text(text,
          style: TextStyle(
              color: fg,
              fontSize: 9,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5)),
    );
  }
}

class _KdaNum extends StatelessWidget {
  final String text;
  final Color color;
  const _KdaNum(this.text, this.color);

  @override
  Widget build(BuildContext context) => Text(text,
      style: TextStyle(
          color: color, fontSize: 14, fontWeight: FontWeight.w600));
}

class _Sep extends StatelessWidget {
  const _Sep();

  @override
  Widget build(BuildContext context) => const Padding(
        padding: EdgeInsets.symmetric(horizontal: 3),
        child: Text('/',
            style: TextStyle(color: Color(0xFF444444), fontSize: 14)),
      );
}

class _Stat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _Stat(this.label, this.value, this.color);

  @override
  Widget build(BuildContext context) => Column(children: [
        Text(label,
            style: const TextStyle(
                color: Color(0xFF7A7A7A),
                fontSize: 9,
                letterSpacing: 0.5)),
        const SizedBox(height: 2),
        Text(value,
            style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w600)),
      ]);
}
