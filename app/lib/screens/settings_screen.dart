import 'package:flutter/material.dart';
import 'package:lol_coach/controllers/settings_controller.dart';
import 'package:lol_coach/services/coach_service.dart';
import 'package:lol_coach/services/storage_service.dart';
import 'package:lol_coach/widgets/connection_form.dart';
import 'package:provider/provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({required this.onConnected, super.key});
  final VoidCallback onConnected;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late SettingsController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = SettingsController(
      storage: context.read<StorageService>(),
      coach: context.read<CoachService>(),
      onConnected: widget.onConnected,
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _ctrl,
      builder: (context, _) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Settings'),
            backgroundColor: Colors.transparent,
            elevation: 0,
            actions: [
              if (_ctrl.isConnected)
                IconButton(
                  icon: const Icon(Icons.link_off),
                  tooltip: 'Disconnect',
                  onPressed: _ctrl.disconnect,
                ),
            ],
          ),
          body: ConnectionForm(ctrl: _ctrl),
        );
      },
    );
  }
}
