// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart';
import 'package:lol_coach/models/game_state.dart';
import 'package:lol_coach/models/recommendation.dart';
import 'package:lol_coach/models/token_usage.dart';
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
    this.triggerEvent,
    this.isAnalyzing = false,
    this.recommendationTime,
    this.tokenUsage,
    this.tokenBudget = 0,
    this.isBudgetExceeded = false,
    this.riskLevel,
    this.onRiskLevelChanged,
  });
  final ParsedGameState gameState;
  final ItemRecommendation? recommendation;
  final String lastEvent;
  final String? triggerEvent;
  final bool isAnalyzing;
  final DateTime? recommendationTime;
  final TokenUsage? tokenUsage;
  final int tokenBudget;
  final bool isBudgetExceeded;
  final String? riskLevel;
  final ValueChanged<String>? onRiskLevelChanged;

  @override
  Widget build(BuildContext context) {
    // Hierarchy by what matters most while glancing mid-match:
    //   1. TopBar — time / gold / risk (always pinned context)
    //   2. RECOMMENDATION — the app's only unique value, rendered as hero
    //   3. My champion — supporting context, compact
    //   4. Scoreboard — tertiary, duplicates the in-game Tab screen, collapsed
    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          GameTopBar(
            gameState: gameState,
            riskLevel: riskLevel,
            onRiskLevelChanged: onRiskLevelChanged,
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Column(
              children: [
                if (recommendation != null)
                  RecommendationPanel(
                    recommendation: recommendation!,
                    triggerEvent: triggerEvent,
                    isAnalyzing: isAnalyzing,
                    recommendationTime: recommendationTime,
                    tokenUsage: tokenUsage,
                    tokenBudget: tokenBudget,
                    isBudgetExceeded: isBudgetExceeded,
                  )
                else
                  const _AwaitingAdvice(),
                const SizedBox(height: 10),
                LocalPlayerCard(
                  player: gameState.localPlayer,
                  activePlayer: gameState.activePlayer,
                ),
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

/// Placeholder hero shown before the first recommendation lands, so the most
/// important slot never sits empty.
class _AwaitingAdvice extends StatelessWidget {
  const _AwaitingAdvice();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: theme.dividerColor),
      ),
      child: Row(
        children: [
          const SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              'Reading the match — first advice lands shortly.',
              style: theme.textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}
