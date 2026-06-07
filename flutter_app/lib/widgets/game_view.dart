// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart';
import 'package:lol_coach/models/game_state.dart';
import 'package:lol_coach/models/recommendation.dart';
import 'package:lol_coach/widgets/game_top_bar.dart';
import 'package:lol_coach/widgets/local_player_card.dart';
import 'package:lol_coach/widgets/recommendation_panel.dart';
import 'package:lol_coach/widgets/scoreboard.dart';

class GameView extends StatelessWidget {
  const GameView({
    required this.gameState,
    required this.lastEvent,
    super.key,
    this.recommendation,
    this.recommendationTime,
  });
  final ParsedGameState gameState;
  final ItemRecommendation? recommendation;
  final String lastEvent;
  final DateTime? recommendationTime;

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
                  RecommendationPanel(
                    recommendation: recommendation!,
                    recommendationTime: recommendationTime,
                  ),
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
