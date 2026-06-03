// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart';
import 'package:lol_coach/models/game_state.dart';
import 'package:lol_coach/models/recommendation.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/widgets/local_player_card.dart';
import 'package:lol_coach/widgets/recommendation_panel.dart';
import 'package:lol_coach/widgets/scoreboard.dart';

class GameView extends StatelessWidget {
  const GameView({
    required this.gameState,
    required this.lastEvent,
    super.key,
    this.recommendation,
  });
  final ParsedGameState gameState;
  final ItemRecommendation? recommendation;
  final String lastEvent;

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
  const GameTopBar({required this.gameState, super.key});
  final ParsedGameState gameState;

  String _fmt(double sec) {
    final m = (sec / 60).floor();
    final s = (sec % 60).floor();
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surfaceMedium,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            gameState.gameMode.toUpperCase(),
            style: const TextStyle(
              color: AppColors.primaryGold,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.5,
            ),
          ),
          Row(
            children: [
              const Icon(
                Icons.timer_outlined,
                size: 14,
                color: AppColors.textMuted,
              ),
              const SizedBox(width: 4),
              Text(
                _fmt(gameState.gameTime),
                style: const TextStyle(
                  color: AppColors.textLightGrey,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          Row(
            children: [
              const Icon(
                Icons.monetization_on_outlined,
                size: 14,
                color: AppColors.primaryGold,
              ),
              const SizedBox(width: 4),
              Text(
                '${gameState.activePlayer.currentGold.toInt()}g',
                style: const TextStyle(
                  color: AppColors.primaryGold,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
