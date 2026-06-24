import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:lol_coach/theme/app_colors.dart';

/// The frosted-glass panel primitive every card flows through.
///
/// A translucent fill over a backdrop blur, a 1px hairline (or [accent])
/// border, rounded corners, and a soft drop shadow. Pass [glow] to add the
/// violet AI halo (the recommendation hero). Requires a non-flat background
/// behind it (see `AppBackground`) for the blur and translucency to read.
class GameCard extends StatelessWidget {
  const GameCard({
    required this.child,
    super.key,
    this.accent,
    this.glow = false,
    this.padding = const EdgeInsets.all(18),
    this.radius = 18,
  });

  final Widget child;

  /// Border tint. Defaults to `context.colors.border` (hairline) when null.
  final Color? accent;

  /// Adds the violet glow halo — reserve for the AI recommendation hero.
  final bool glow;

  final EdgeInsetsGeometry padding;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final br = BorderRadius.circular(radius);
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: br,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.40),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
          if (glow)
            BoxShadow(
              color: colors.magic.withValues(alpha: 0.35),
              blurRadius: 50,
              spreadRadius: -16,
            ),
        ],
      ),
      child: ClipRRect(
        borderRadius: br,
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: 18, sigmaY: 18),
          child: Container(
            width: double.infinity,
            padding: padding,
            decoration: BoxDecoration(
              color: colors.surfaceDark,
              borderRadius: br,
              border: Border.all(color: accent ?? colors.border),
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}
