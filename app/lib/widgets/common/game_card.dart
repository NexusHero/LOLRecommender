import 'package:flutter/material.dart';
import 'package:lol_coach/theme/app_colors.dart';

class GameCard extends StatelessWidget {
  const GameCard({
    required this.child,
    super.key,
    this.borderColor = AppColors.border,
  });
  final Widget child;
  final Color borderColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceDark,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: borderColor),
      ),
      child: child,
    );
  }
}
