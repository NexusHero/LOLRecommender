import 'package:flutter/material.dart';
import 'package:lol_coach/controllers/theme_controller.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/theme/app_text_styles.dart';
import 'package:provider/provider.dart';

/// Light / Dark / System theme picker. Bound to the app-global
/// [ThemeController] via Provider (independent of the screen-scoped
/// `SettingsController`).
class AppearanceSection extends StatelessWidget {
  const AppearanceSection({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final mode = context.watch<ThemeController>().mode;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Appearance',
          style: AppTextStyles.captionBold.copyWith(
            color: colors.textSecondary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Choose light, dark, or follow your system setting.',
          style: AppTextStyles.caption.copyWith(color: colors.textSecondary),
        ),
        const SizedBox(height: 10),
        SegmentedButton<ThemeMode>(
          segments: const [
            ButtonSegment(value: ThemeMode.system, label: Text('System')),
            ButtonSegment(value: ThemeMode.light, label: Text('Light')),
            ButtonSegment(value: ThemeMode.dark, label: Text('Dark')),
          ],
          selected: {mode},
          onSelectionChanged: (selection) =>
              context.read<ThemeController>().setMode(selection.first),
        ),
      ],
    );
  }
}
