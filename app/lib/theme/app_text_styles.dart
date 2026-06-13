import 'package:flutter/material.dart';
import 'package:lol_coach/theme/app_colors.dart';

class AppTextStyles {
  // 4-step scale: 11 / 13 / 16 / 24
  static const display = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: AppColors.gold,
    letterSpacing: 2.5,
  );

  static const heading = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: AppColors.textPrimary,
  );

  static const body = TextStyle(
    fontSize: 13,
    color: AppColors.textPrimary,
  );

  static const bodyBold = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
  );

  static const caption = TextStyle(
    fontSize: 11,
    color: AppColors.textSecondary,
  );

  static const captionBold = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w600,
    color: AppColors.textSecondary,
  );

  // For uppercase section labels (SCOREBOARD, ALLIES, etc.)
  static const label = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w700,
    color: AppColors.textSecondary,
    letterSpacing: 1.5,
  );
}
