import 'package:flutter/material.dart';
import 'package:lol_coach/controllers/settings_controller.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/theme/app_text_styles.dart';

class AdvancedSection extends StatelessWidget {
  const AdvancedSection({required this.ctrl, super.key});
  final SettingsController ctrl;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: ctrl,
      builder: (context, _) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            InkWell(
              onTap: ctrl.toggleAdvanced,
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    Icon(
                      ctrl.showAdvanced ? Icons.expand_less : Icons.expand_more,
                      size: 18,
                      color: AppColors.textSecondary,
                    ),
                    const SizedBox(width: 6),
                    const Text('Advanced', style: AppTextStyles.captionBold),
                    const SizedBox(width: 8),
                    const Text(
                      '(Server IP & Port)',
                      style: AppTextStyles.caption,
                    ),
                  ],
                ),
              ),
            ),
            AnimatedSize(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeInOut,
              child: ctrl.showAdvanced
                  ? Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Column(
                        children: [
                          TextField(
                            controller: ctrl.hostCtrl,
                            enabled: !ctrl.isConnecting,
                            decoration: InputDecoration(
                              labelText: 'Server IP',
                              hintText: 'e.g. 192.168.1.100',
                              prefixIcon: const Icon(
                                Icons.computer_outlined,
                                color: AppColors.textSecondary,
                              ),
                              errorText: ctrl.ipError,
                            ),
                            keyboardType: TextInputType.url,
                            textInputAction: TextInputAction.next,
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: ctrl.portCtrl,
                            enabled: !ctrl.isConnecting,
                            decoration: const InputDecoration(
                              labelText: 'Port',
                              prefixIcon: Icon(
                                Icons.settings_ethernet,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            keyboardType: TextInputType.number,
                            textInputAction: TextInputAction.next,
                          ),
                        ],
                      ),
                    )
                  : const SizedBox.shrink(),
            ),
          ],
        );
      },
    );
  }
}
