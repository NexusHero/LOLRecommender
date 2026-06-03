// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart';
import 'package:lol_coach/theme/app_colors.dart';

class ConnectionForm extends StatefulWidget {
  const ConnectionForm({
    required this.onConnect,
    super.key,
    this.error,
    this.isConnecting = false,
  });
  final void Function(String host, int port) onConnect;
  final String? error;
  final bool isConnecting;

  @override
  State<ConnectionForm> createState() => _ConnectionFormState();
}

const _defaultPort = 8765;

class _ConnectionFormState extends State<ConnectionForm> {
  final _hostCtrl = TextEditingController(text: '192.168.1.100');
  final _portCtrl = TextEditingController(text: '$_defaultPort');
  String? _ipError;

  @override
  void dispose() {
    _hostCtrl.dispose();
    _portCtrl.dispose();
    super.dispose();
  }

  void _connect() {
    if (widget.isConnecting) return;

    final host = _hostCtrl.text.trim();
    if (host.isEmpty) return;

    final ipRegExp = RegExp(r'^(\d{1,3}\.){3}\d{1,3}$');
    if (!ipRegExp.hasMatch(host) && host != 'localhost') {
      setState(() => _ipError = 'Invalid IP format (e.g. 192.168.1.100)');
      return;
    } else {
      setState(() => _ipError = null);
    }

    final port = int.tryParse(_portCtrl.text.trim()) ?? _defaultPort;
    widget.onConnect(host, port);
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Icon(
            Icons.shield_outlined,
            size: 52,
            color: AppColors.primaryGold,
          ),
          const SizedBox(height: 12),
          const Text(
            'LoL Coach',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.primaryGold,
              fontSize: 26,
              fontWeight: FontWeight.bold,
              letterSpacing: 2.5,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Connect to bridge server',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textMuted, fontSize: 12),
          ),
          const SizedBox(height: 36),
          TextField(
            controller: _hostCtrl,
            enabled: !widget.isConnecting,
            decoration: InputDecoration(
              labelText: 'Server IP',
              hintText: 'e.g. 192.168.1.100',
              prefixIcon: const Icon(
                Icons.computer_outlined,
                color: AppColors.textMuted,
              ),
              errorText: _ipError,
            ),
            keyboardType: TextInputType.url,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _portCtrl,
            enabled: !widget.isConnecting,
            decoration: const InputDecoration(
              labelText: 'Port',
              prefixIcon:
                  Icon(Icons.settings_ethernet, color: AppColors.textMuted),
            ),
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _connect(),
          ),
          if (widget.error != null && !widget.isConnecting) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.redDeep,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: AppColors.errorRed),
              ),
              child: Text(
                widget.error!,
                style: const TextStyle(
                  color: AppColors.errorRedLight,
                  fontSize: 12,
                ),
              ),
            ),
          ],
          if (widget.isConnecting) ...[
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
                  'Connecting to bridge...',
                  style: TextStyle(color: AppColors.primaryGold, fontSize: 13),
                ),
              ],
            ),
          ],
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: widget.isConnecting ? null : _connect,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: Text(
              widget.isConnecting ? 'CONNECTING...' : 'CONNECT',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                letterSpacing: 2,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'The bridge server (Node.js) must be running\non port 8765 in the same network.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textDark, fontSize: 11),
          ),
        ],
      ),
    );
  }
}
