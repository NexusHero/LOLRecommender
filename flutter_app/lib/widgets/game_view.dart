import 'package:flutter/material.dart';
import '../models/game_state.dart';
import '../models/recommendation.dart';
import 'local_player_card.dart';
import 'recommendation_panel.dart';
import 'scoreboard.dart';

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
          GameTopBar(gameState: gameState),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Column(
              children: [
                LocalPlayerCard(
                  player: gameState.localPlayer,
                  activePlayer: gameState.activePlayer,
                ),
                if (recommendation != null) ...[
                  const SizedBox(height: 10),
                  RecommendationPanel(recommendation: recommendation!),
                ],
                const SizedBox(height: 10),
                ScoreboardSection(
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

class GameTopBar extends StatelessWidget {
  final ParsedGameState gameState;
  const GameTopBar({super.key, required this.gameState});

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
