import 'package:flutter/material.dart';

/// Typography scale — **size / weight / spacing only, no colour**.
///
/// Colour is theme-driven: the base text colour comes from
/// `ThemeData.textTheme` (set to `AppColors.textPrimary` per theme). Where a
/// non-primary tone is wanted (secondary grey, gold, …), set it explicitly at
/// the call site, e.g.
/// `AppTextStyles.caption.copyWith(color: context.colors.textSecondary)`.
class AppTextStyles {
  // 4-step scale: 11 / 13 / 16 / 24
  static const display = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    letterSpacing: 2.5,
  );

  static const heading = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.bold,
  );

  static const body = TextStyle(
    fontSize: 13,
  );

  static const bodyBold = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w600,
  );

  static const caption = TextStyle(
    fontSize: 11,
  );

  static const captionBold = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w600,
  );

  // For uppercase section labels (SCOREBOARD, ALLIES, etc.)
  static const label = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w700,
    letterSpacing: 1.5,
  );
}
