import 'package:flutter/material.dart';
import 'package:lol_coach/theme/app_colors.dart';

/// Segmented control for the coaching playstyle.
/// Always one of 'safe' | 'normal' | 'risky' — never multiple at once.
class RiskControl extends StatelessWidget {
  const RiskControl({
    required this.value,
    required this.onChanged,
    super.key,
  });

  final String value;
  final ValueChanged<String> onChanged;

  static const _levels = [
    ('safe', 'SAFE'),
    ('normal', 'NORMAL'),
    ('risky', 'RISKY'),
  ];

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        color: colors.surfaceDark,
        borderRadius: BorderRadius.circular(7),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (final (level, label) in _levels) _segment(context, level, label),
        ],
      ),
    );
  }

  Widget _segment(BuildContext context, String level, String label) {
    final colors = context.colors;
    final selected = value == level;
    final color = switch (level) {
      'safe' => colors.cyan,
      'risky' => colors.warning,
      _ => colors.textPrimary,
    };

    return GestureDetector(
      onTap: () => onChanged(level),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
        decoration: BoxDecoration(
          color: selected ? color.withValues(alpha: 0.15) : null,
          borderRadius: BorderRadius.circular(5),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
            color: selected ? color : colors.textSecondary,
          ),
        ),
      ),
    );
  }
}
