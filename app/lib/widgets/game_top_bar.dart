// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart';
import 'package:lol_coach/models/game_state.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/theme/app_text_styles.dart';
import 'package:lol_coach/widgets/common/champ_avatar.dart';
import 'package:lol_coach/widgets/common/risk_control.dart';

/// The pinned context strip: game time · gold to spend · your champion + KDA,
/// with the risk control beneath when an AI provider is shaping advice. Drawn
/// as text over the canvas (no solid bar) per the Elevated direction.
class GameTopBar extends StatelessWidget {
  const GameTopBar({
    required this.gameState,
    super.key,
    this.riskLevel,
    this.onRiskLevelChanged,
  });
  final ParsedGameState gameState;

  /// Both null when no AI provider is active — the risk control only makes
  /// sense when an LLM is actually shaping the recommendation.
  final String? riskLevel;
  final ValueChanged<String>? onRiskLevelChanged;

  String _fmt(double sec) {
    final m = (sec / 60).floor();
    final s = (sec % 60).floor();
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final local = gameState.localPlayer;
    final gold = gameState.activePlayer.currentGold.toInt();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text(
                _fmt(gameState.gameTime),
                style: AppTextStyles.caption.copyWith(
                  color: colors.textSecondary,
                ),
              ),
              _dot(colors),
              Text(
                '${gold}g to spend',
                style: AppTextStyles.caption.copyWith(color: colors.gold),
              ),
              const Spacer(),
              ChampAvatar(
                name: local.championName,
                isDead: local.isDead,
                size: 22,
              ),
              const SizedBox(width: 8),
              _Kda(scores: local.scores),
            ],
          ),
          if (riskLevel != null && onRiskLevelChanged != null) ...[
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerLeft,
              child: RiskControl(
                value: riskLevel!,
                onChanged: onRiskLevelChanged!,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _dot(AppColors colors) => Container(
        margin: const EdgeInsets.symmetric(horizontal: 12),
        width: 3,
        height: 3,
        decoration: BoxDecoration(
          color: colors.textDisabled,
          shape: BoxShape.circle,
        ),
      );
}

class _Kda extends StatelessWidget {
  const _Kda({required this.scores});
  final PlayerScores scores;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final sep = Text(
      '/',
      style: AppTextStyles.captionBold.copyWith(color: colors.textDisabled),
    );
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          '${scores.kills}',
          style: AppTextStyles.captionBold.copyWith(color: colors.success),
        ),
        sep,
        Text(
          '${scores.deaths}',
          style: AppTextStyles.captionBold.copyWith(color: colors.error),
        ),
        sep,
        Text(
          '${scores.assists}',
          style: AppTextStyles.captionBold.copyWith(color: colors.textPrimary),
        ),
      ],
    );
  }
}
