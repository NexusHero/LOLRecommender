import 'package:flutter/material.dart';
import 'package:lol_coach/controllers/settings_controller.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/theme/app_text_styles.dart';
import 'package:lol_coach/widgets/settings/advanced_section.dart';
import 'package:lol_coach/widgets/settings/provider_section.dart';

class ConnectionForm extends StatelessWidget {
  const ConnectionForm({required this.ctrl, super.key});

  final SettingsController ctrl;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: ctrl,
      builder: (context, _) {
        return SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 40),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.shield_outlined, size: 48, color: AppColors.gold),
              const SizedBox(height: 12),
              const Text(
                'LoL Coach',
                textAlign: TextAlign.center,
                style: AppTextStyles.display,
              ),
              const SizedBox(height: 8),
              const Text(
                'Real-time item advice during your match.\n'
                'Always know what to build — powered by AI.',
                textAlign: TextAlign.center,
                style: AppTextStyles.caption,
              ),
              const SizedBox(height: 32),

              TextField(
                controller: ctrl.summonerCtrl,
                enabled: !ctrl.isConnecting,
                decoration: const InputDecoration(
                  labelText: 'Summoner Name (Optional)',
                  hintText: 'Your in-game name',
                  prefixIcon: Icon(
                    Icons.person_outline,
                    color: AppColors.textSecondary,
                  ),
                ),
                keyboardType: TextInputType.text,
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 16),

              ProviderSection(ctrl: ctrl),
              const SizedBox(height: 24),

              AdvancedSection(ctrl: ctrl),

              if (ctrl.connectionError != null && !ctrl.isConnecting) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.errorSubtle,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.error),
                  ),
                  child: Text(
                    ctrl.connectionError!,
                    style: AppTextStyles.caption.copyWith(color: AppColors.errorLight),
                  ),
                ),
              ],

              if (ctrl.isConnecting) ...[
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'Connecting to core...',
                      style: AppTextStyles.caption,
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: ctrl.isConnecting ? null : ctrl.connect,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: Text(
                  ctrl.isConnecting ? 'CONNECTING...' : 'CONNECT',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                    fontSize: 13,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'The core server must be running on the same machine.\n'
                'Default: localhost:8765',
                textAlign: TextAlign.center,
                style: AppTextStyles.caption,
              ),
            ],
          ),
        );
      },
    );
  }
}
