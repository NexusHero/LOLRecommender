import 'package:flutter/material.dart';

class AppColors {
  // Backgrounds (60%)
  static const Color bgDark = Color(0xFF0A1628);
  static const Color surfaceDark = Color(0xFF0D1B2E);
  static const Color surfaceMedium = Color(0xFF091428);

  // Borders
  static const Color border = Color(0xFF1E3A5F);
  static const Color borderAccent = Color(0xFF2A4A6A);

  // Text — WCAG AA on dark backgrounds
  static const Color textPrimary = Color(0xFFCDC8C2); // ~12:1 on surfaceDark
  static const Color textSecondary = Color(0xFF8A8FA0); // ~5.4:1 on surfaceDark
  static const Color textDisabled = Color(0xFF50566A); // decorative/hint only

  // Brand accent — use sparingly (10% rule)
  static const Color gold = Color(0xFFC89B3C);
  static const Color goldSubtle = Color(0xFF1C1400);

  // Functional accent
  static const Color cyan = Color(0xFF0BC4E3);
  static const Color cyanSubtle = Color(0xFF04141C);

  // Status
  static const Color success = Color(0xFF2ECC71);
  static const Color successSubtle = Color(0xFF081808);
  static const Color error = Color(0xFFC3291F);
  static const Color errorLight = Color(0xFFFF6B6B);
  static const Color errorSubtle = Color(0xFF1A0808);
  static const Color warning = Color(0xFFFF9800);
  static const Color magic = Color(0xFF9B59B6);
  static const Color magicSubtle = Color(0xFF1A0E28);

  // Team colors
  static const Color allyBlue = Color(0xFF005A82);
  static const Color allySubtle = Color(0xFF081624);
  static const Color enemyRed = Color(0xFF6B1B1B);
}
