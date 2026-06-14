import 'package:flutter/material.dart';
import 'package:lol_coach/theme/app_colors.dart';

class GameCard extends StatelessWidget {
  const GameCard({
    required this.child,
    super.key,
    this.borderColor,
  });
  final Widget child;

  /// Defaults to `context.colors.border` when null (resolved in [build] —
  /// theme colours cannot be const default parameter values).
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surfaceDark,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: borderColor ?? colors.border),
      ),
      child: child,
    );
  }
}
