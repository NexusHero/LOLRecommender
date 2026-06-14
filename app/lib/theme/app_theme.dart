import 'package:flutter/material.dart';
import 'package:lol_coach/theme/app_colors.dart';

/// Builds the app's [ThemeData] for both light and dark from a single
/// [AppColors] palette, registering that palette as a [ThemeExtension] so
/// widgets can read it via `context.colors`.
class AppTheme {
  const AppTheme._();

  static final ThemeData dark = _build(AppColors.dark, Brightness.dark);
  static final ThemeData light = _build(AppColors.light, Brightness.light);

  static ThemeData _build(AppColors c, Brightness brightness) {
    final base =
        brightness == Brightness.dark ? ThemeData.dark() : ThemeData.light();

    final scheme = (brightness == Brightness.dark
            ? const ColorScheme.dark()
            : const ColorScheme.light())
        .copyWith(
      primary: c.gold,
      secondary: c.gold,
      surface: c.surfaceDark,
      error: c.error,
      onSurface: c.textPrimary,
      onSurfaceVariant: c.textSecondary,
      outline: c.border,
      // SegmentedButton selected state
      secondaryContainer: c.goldSubtle,
      onSecondaryContainer: c.gold,
    );

    return base.copyWith(
      scaffoldBackgroundColor: c.bgDark,
      colorScheme: scheme,
      extensions: [c],
      // Base text colour for colourless AppTextStyles.
      textTheme: base.textTheme.apply(
        bodyColor: c.textPrimary,
        displayColor: c.textPrimary,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: c.surfaceMedium,
        foregroundColor: c.textPrimary,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: c.textPrimary,
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: c.gold,
          foregroundColor: c.bgDark,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surfaceDark,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: c.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: c.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: c.gold),
        ),
        labelStyle: TextStyle(color: c.textSecondary),
        hintStyle: TextStyle(color: c.textDisabled),
      ),
      dividerTheme: DividerThemeData(color: c.border),
      navigationRailTheme: NavigationRailThemeData(
        backgroundColor: c.surfaceMedium,
        selectedIconTheme: IconThemeData(color: c.gold),
        unselectedIconTheme: IconThemeData(color: c.textSecondary),
        selectedLabelTextStyle: TextStyle(
          color: c.gold,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelTextStyle: TextStyle(
          color: c.textSecondary,
          fontSize: 11,
        ),
        useIndicator: true,
        indicatorColor: c.goldSubtle,
      ),
    );
  }
}
