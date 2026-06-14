import 'package:flutter/material.dart';

/// Semantic colour palette exposed as a [ThemeExtension] so the same field
/// names resolve to different values per theme (dark / light).
///
/// Access from widgets via `context.colors.<field>` (see the [AppColorsX]
/// extension at the bottom of this file). The getter falls back to
/// [AppColors.dark] when no extension is registered, so widgets render safely
/// inside bare `MaterialApp`s (e.g. in widget tests).
///
/// Semantics are preserved across both palettes:
/// - [gold]  = brand / win-condition accent (use sparingly, 10% rule)
/// - [magic] = exclusive AI highlight (sweeping border, AI glow)
/// - [success]/[error]/[warning] = status
/// - [allyBlue]/[enemyRed] = team affiliation in the scoreboard
@immutable
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
    required this.bgDark,
    required this.surfaceDark,
    required this.surfaceMedium,
    required this.border,
    required this.borderAccent,
    required this.textPrimary,
    required this.textSecondary,
    required this.textDisabled,
    required this.gold,
    required this.goldSubtle,
    required this.cyan,
    required this.cyanSubtle,
    required this.success,
    required this.successSubtle,
    required this.error,
    required this.errorLight,
    required this.errorSubtle,
    required this.warning,
    required this.magic,
    required this.magicSubtle,
    required this.allyBlue,
    required this.allySubtle,
    required this.enemyRed,
  });

  // Backgrounds (60%)
  final Color bgDark;
  final Color surfaceDark;
  final Color surfaceMedium;

  // Borders
  final Color border;
  final Color borderAccent;

  // Text
  final Color textPrimary;
  final Color textSecondary;
  final Color textDisabled;

  // Brand accent — use sparingly (10% rule)
  final Color gold;
  final Color goldSubtle;

  // Functional accent
  final Color cyan;
  final Color cyanSubtle;

  // Status
  final Color success;
  final Color successSubtle;
  final Color error;
  final Color errorLight;
  final Color errorSubtle;
  final Color warning;

  // AI accent
  final Color magic;
  final Color magicSubtle;

  // Team colours
  final Color allyBlue;
  final Color allySubtle;
  final Color enemyRed;

  /// Dark palette — WCAG-AA text contrast on dark backgrounds.
  static const AppColors dark = AppColors(
    bgDark: Color(0xFF0A1628),
    surfaceDark: Color(0xFF0D1B2E),
    surfaceMedium: Color(0xFF091428),
    border: Color(0xFF1E3A5F),
    borderAccent: Color(0xFF2A4A6A),
    textPrimary: Color(0xFFCDC8C2), // ~12:1 on surfaceDark
    textSecondary: Color(0xFF8A8FA0), // ~5.4:1 on surfaceDark
    textDisabled: Color(0xFF50566A), // decorative/hint only
    gold: Color(0xFFC89B3C),
    goldSubtle: Color(0xFF1C1400),
    cyan: Color(0xFF0BC4E3),
    cyanSubtle: Color(0xFF04141C),
    success: Color(0xFF2ECC71),
    successSubtle: Color(0xFF081808),
    error: Color(0xFFC3291F),
    errorLight: Color(0xFFFF6B6B),
    errorSubtle: Color(0xFF1A0808),
    warning: Color(0xFFFF9800),
    magic: Color(0xFF9B59B6),
    magicSubtle: Color(0xFF1A0E28),
    allyBlue: Color(0xFF005A82),
    allySubtle: Color(0xFF081624),
    enemyRed: Color(0xFF6B1B1B),
  );

  /// Light palette — warm off-white base; brand/status hues darkened for
  /// WCAG-AA contrast on light surfaces. Same semantics as [dark].
  static const AppColors light = AppColors(
    bgDark: Color(0xFFF4F1EC), // warm off-white (not pure white)
    surfaceDark: Color(0xFFFFFFFF),
    surfaceMedium: Color(0xFFEAE6DF),
    border: Color(0xFFD6D0C6),
    borderAccent: Color(0xFFBFB8AC),
    textPrimary: Color(0xFF1C2230), // ~13:1 on surfaceDark(light)
    textSecondary: Color(0xFF5A6072), // ~5.2:1 on surfaceDark(light)
    textDisabled: Color(0xFFA0A4B0),
    gold: Color(0xFF8A6516), // darker/saturated for contrast on light
    goldSubtle: Color(0xFFF3E7C6),
    cyan: Color(0xFF0E7F94),
    cyanSubtle: Color(0xFFDCF1F5),
    success: Color(0xFF1E8E4E),
    successSubtle: Color(0xFFDDF3E4),
    error: Color(0xFFC3291F),
    errorLight: Color(0xFFC0392B),
    errorSubtle: Color(0xFFF7DCDA),
    warning: Color(0xFFB36B00),
    magic: Color(0xFF7E3F99),
    magicSubtle: Color(0xFFEDE2F5),
    allyBlue: Color(0xFF1565A0),
    allySubtle: Color(0xFFDCEAF5),
    enemyRed: Color(0xFFB23A3A),
  );

  @override
  AppColors copyWith({
    Color? bgDark,
    Color? surfaceDark,
    Color? surfaceMedium,
    Color? border,
    Color? borderAccent,
    Color? textPrimary,
    Color? textSecondary,
    Color? textDisabled,
    Color? gold,
    Color? goldSubtle,
    Color? cyan,
    Color? cyanSubtle,
    Color? success,
    Color? successSubtle,
    Color? error,
    Color? errorLight,
    Color? errorSubtle,
    Color? warning,
    Color? magic,
    Color? magicSubtle,
    Color? allyBlue,
    Color? allySubtle,
    Color? enemyRed,
  }) {
    return AppColors(
      bgDark: bgDark ?? this.bgDark,
      surfaceDark: surfaceDark ?? this.surfaceDark,
      surfaceMedium: surfaceMedium ?? this.surfaceMedium,
      border: border ?? this.border,
      borderAccent: borderAccent ?? this.borderAccent,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textDisabled: textDisabled ?? this.textDisabled,
      gold: gold ?? this.gold,
      goldSubtle: goldSubtle ?? this.goldSubtle,
      cyan: cyan ?? this.cyan,
      cyanSubtle: cyanSubtle ?? this.cyanSubtle,
      success: success ?? this.success,
      successSubtle: successSubtle ?? this.successSubtle,
      error: error ?? this.error,
      errorLight: errorLight ?? this.errorLight,
      errorSubtle: errorSubtle ?? this.errorSubtle,
      warning: warning ?? this.warning,
      magic: magic ?? this.magic,
      magicSubtle: magicSubtle ?? this.magicSubtle,
      allyBlue: allyBlue ?? this.allyBlue,
      allySubtle: allySubtle ?? this.allySubtle,
      enemyRed: enemyRed ?? this.enemyRed,
    );
  }

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) {
    if (other is! AppColors) return this;
    return AppColors(
      bgDark: Color.lerp(bgDark, other.bgDark, t)!,
      surfaceDark: Color.lerp(surfaceDark, other.surfaceDark, t)!,
      surfaceMedium: Color.lerp(surfaceMedium, other.surfaceMedium, t)!,
      border: Color.lerp(border, other.border, t)!,
      borderAccent: Color.lerp(borderAccent, other.borderAccent, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      textDisabled: Color.lerp(textDisabled, other.textDisabled, t)!,
      gold: Color.lerp(gold, other.gold, t)!,
      goldSubtle: Color.lerp(goldSubtle, other.goldSubtle, t)!,
      cyan: Color.lerp(cyan, other.cyan, t)!,
      cyanSubtle: Color.lerp(cyanSubtle, other.cyanSubtle, t)!,
      success: Color.lerp(success, other.success, t)!,
      successSubtle: Color.lerp(successSubtle, other.successSubtle, t)!,
      error: Color.lerp(error, other.error, t)!,
      errorLight: Color.lerp(errorLight, other.errorLight, t)!,
      errorSubtle: Color.lerp(errorSubtle, other.errorSubtle, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      magic: Color.lerp(magic, other.magic, t)!,
      magicSubtle: Color.lerp(magicSubtle, other.magicSubtle, t)!,
      allyBlue: Color.lerp(allyBlue, other.allyBlue, t)!,
      allySubtle: Color.lerp(allySubtle, other.allySubtle, t)!,
      enemyRed: Color.lerp(enemyRed, other.enemyRed, t)!,
    );
  }
}

/// Ergonomic access to the active [AppColors] palette.
///
/// Falls back to [AppColors.dark] when the extension is not registered, so
/// widgets stay render-safe in any `MaterialApp` (incl. bare test harnesses).
extension AppColorsX on BuildContext {
  AppColors get colors =>
      Theme.of(this).extension<AppColors>() ?? AppColors.dark;
}
