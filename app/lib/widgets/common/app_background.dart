import 'package:flutter/material.dart';
import 'package:lol_coach/theme/app_colors.dart';

/// The full-page gradient canvas the glass surfaces float over.
///
/// Translucent panels ([AppColors.surfaceDark]) only read correctly against
/// this layered background: a violet glow at the top, a faint champagne glow
/// bottom-right, over a near-black vertical gradient. Wrap a `Scaffold` body
/// (or use as the scaffold background) so blur/translucency has something to
/// sample.
class AppBackground extends StatelessWidget {
  const AppBackground({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [colors.bgDark, colors.bgGradientEnd],
        ),
      ),
      child: DecoratedBox(
        // Violet glow anchored above the top edge.
        decoration: BoxDecoration(
          gradient: RadialGradient(
            center: const Alignment(0, -1.2),
            radius: 1.1,
            colors: [colors.bgGlow, colors.bgGlow.withValues(alpha: 0)],
            stops: const [0, 0.55],
          ),
        ),
        child: child,
      ),
    );
  }
}
