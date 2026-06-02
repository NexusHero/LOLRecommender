import 'package:flutter/material.dart';

class ConnectionForm extends StatefulWidget {
  final void Function(String host, int port) onConnect;
  final String? error;

  const ConnectionForm({
    super.key,
    required this.onConnect,
    this.error,
  });

  @override
  State<ConnectionForm> createState() => _ConnectionFormState();
}

const _defaultPort = 8765;

class _ConnectionFormState extends State<ConnectionForm> {
  final _hostCtrl = TextEditingController(text: '192.168.1.100');
  final _portCtrl = TextEditingController(text: '$_defaultPort');

  @override
  void dispose() {
    _hostCtrl.dispose();
    _portCtrl.dispose();
    super.dispose();
  }

  void _connect() {
    final host = _hostCtrl.text.trim();
    if (host.isEmpty) return;
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
          const Icon(Icons.shield_outlined, size: 52, color: Color(0xFFC89B3C)),
          const SizedBox(height: 12),
          const Text(
            'LoL Coach',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(0xFFC89B3C),
              fontSize: 26,
              fontWeight: FontWeight.bold,
              letterSpacing: 2.5,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Bridge-Server verbinden',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF7A7A7A), fontSize: 12),
          ),
          const SizedBox(height: 36),
          TextField(
            controller: _hostCtrl,
            decoration: const InputDecoration(
              labelText: 'Server-IP',
              hintText: 'z.B. 192.168.1.100',
              prefixIcon: Icon(Icons.computer_outlined, color: Color(0xFF7A7A7A)),
            ),
            keyboardType: TextInputType.url,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _portCtrl,
            decoration: const InputDecoration(
              labelText: 'Port',
              prefixIcon:
                  Icon(Icons.settings_ethernet, color: Color(0xFF7A7A7A)),
            ),
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _connect(),
          ),
          if (widget.error != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF1A0808),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: const Color(0xFFC3291F)),
              ),
              child: Text(
                widget.error!,
                style: const TextStyle(color: Color(0xFFFF6B6B), fontSize: 12),
              ),
            ),
          ],
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _connect,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: const Text(
              'VERBINDEN',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                letterSpacing: 2,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Bridge-Server (Node.js) muss im gleichen\nNetzwerk auf Port 8765 laufen.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF4A4A4A), fontSize: 11),
          ),
        ],
      ),
    );
  }
}
