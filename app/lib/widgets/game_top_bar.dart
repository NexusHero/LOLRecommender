// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart';
import 'package:lol_coach/models/game_state.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/theme/app_text_styles.dart';

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
    final colors = context.colors;
    return Container(
      color: colors.surfaceMedium,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            gameState.gameMode.toUpperCase(),
            style: AppTextStyles.label.copyWith(color: colors.textSecondary),
          ),
          Row(
            children: [
              Icon(
                Icons.timer_outlined,
                size: 14,
                color: colors.textSecondary,
              ),
              const SizedBox(width: 4),
              Text(_fmt(gameState.gameTime), style: AppTextStyles.bodyBold),
            ],
          ),
          Row(
            children: [
              Icon(
                Icons.monetization_on_outlined,
                size: 14,
                color: colors.gold,
              ),
              const SizedBox(width: 4),
              Text(
                '${gameState.activePlayer.currentGold.toInt()}g',
                style: AppTextStyles.bodyBold.copyWith(color: colors.gold),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
