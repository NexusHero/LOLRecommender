import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lol_coach/providers.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/theme/app_text_styles.dart';

/// Light / Dark / System theme picker. Bound to the app-global
/// `ThemeController` (independent of the screen-scoped `SettingsController`).
class AppearanceSection extends ConsumerWidget {
  const AppearanceSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = context.colors;
    final themeController = ref.watch(themeControllerProvider);
    return ListenableBuilder(
      listenable: themeController,
      builder: (context, _) => Column(
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
            style:
                AppTextStyles.caption.copyWith(color: colors.textSecondary),
          ),
          const SizedBox(height: 10),
          SegmentedButton<ThemeMode>(
            segments: const [
              ButtonSegment(value: ThemeMode.system, label: Text('System')),
              ButtonSegment(value: ThemeMode.light, label: Text('Light')),
              ButtonSegment(value: ThemeMode.dark, label: Text('Dark')),
            ],
            selected: {themeController.mode},
            onSelectionChanged: (selection) =>
                themeController.setMode(selection.first),
          ),
        ],
      ),
    );
  }
}
