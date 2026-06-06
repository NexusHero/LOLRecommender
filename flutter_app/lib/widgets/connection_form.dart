// ignore_for_file: lines_longer_than_80_chars, deprecated_member_use
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ConnectionForm extends StatefulWidget {
  const ConnectionForm({
    required this.onConnect,
    super.key,
    this.error,
    this.isConnecting = false,
  });
  final void Function(String host, int port, String summonerName, String providerType, String apiKey) onConnect;
  final String? error;
  final bool isConnecting;

  @override
  State<ConnectionForm> createState() => _ConnectionFormState();
}

const _defaultPort = 8765;
const _secureStorage = FlutterSecureStorage();

class _ConnectionFormState extends State<ConnectionForm> {
  final _hostCtrl = TextEditingController(text: '127.0.0.1');
  final _portCtrl = TextEditingController(text: '$_defaultPort');
  final _summonerCtrl = TextEditingController();
  final _apiKeyCtrl = TextEditingController();
  String? _ipError;
  String _providerType = 'none';

  @override
  void initState() {
    super.initState();
    _loadPrefs();
  }

  Future<void> _loadPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final apiKey = await _secureStorage.read(key: 'apiKey') ?? '';
    setState(() {
      _hostCtrl.text = prefs.getString('host') ?? '127.0.0.1';
      _portCtrl.text = prefs.getString('port') ?? '$_defaultPort';
      _summonerCtrl.text = prefs.getString('summonerName') ?? '';
      _providerType = prefs.getString('providerType') ?? 'none';
      _apiKeyCtrl.text = apiKey;
    });
  }

  @override
  void dispose() {
    _hostCtrl.dispose();
    _portCtrl.dispose();
    _summonerCtrl.dispose();
    _apiKeyCtrl.dispose();
    super.dispose();
  }

  Future<void> _connect() async {
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

    final portString = _portCtrl.text.trim();
    final port = int.tryParse(portString) ?? _defaultPort;
    final summonerName = _summonerCtrl.text.trim();
    final apiKey = _apiKeyCtrl.text.trim();
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('host', host);
    await prefs.setString('port', portString);
    await prefs.setString('summonerName', summonerName);
    await prefs.setString('providerType', _providerType);
    // API key is stored in the OS keychain/secure enclave, not plain SharedPreferences
    await _secureStorage.write(key: 'apiKey', value: apiKey);

    widget.onConnect(host, port, summonerName, _providerType, apiKey);
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
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _summonerCtrl,
            enabled: !widget.isConnecting,
            decoration: const InputDecoration(
              labelText: 'Summoner Name (Optional)',
              hintText: 'Your in-game name',
              prefixIcon:
                  Icon(Icons.person_outline, color: AppColors.textMuted),
            ),
            keyboardType: TextInputType.text,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 24),
          const Text(
            'LLM Provider (Optional)',
            style: TextStyle(color: AppColors.primaryGold, fontSize: 14, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Theme(
            data: Theme.of(context).copyWith(
              unselectedWidgetColor: AppColors.textMuted,
            ),
            child: Column(
              children: [
                RadioListTile<String>(
                  title: const Text('None (Heuristic only)', style: TextStyle(color: AppColors.textLightGrey, fontSize: 13)),
                  value: 'none',
                  groupValue: _providerType,
                  onChanged: widget.isConnecting ? null : (val) => setState(() => _providerType = val!),
                  activeColor: AppColors.primaryGold,
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                ),
                RadioListTile<String>(
                  title: const Text('Claude', style: TextStyle(color: AppColors.textLightGrey, fontSize: 13)),
                  value: 'claude',
                  groupValue: _providerType,
                  onChanged: widget.isConnecting ? null : (val) => setState(() => _providerType = val!),
                  activeColor: AppColors.primaryGold,
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                ),
                RadioListTile<String>(
                  title: const Text('OpenAI', style: TextStyle(color: AppColors.textLightGrey, fontSize: 13)),
                  value: 'openai',
                  groupValue: _providerType,
                  onChanged: widget.isConnecting ? null : (val) => setState(() => _providerType = val!),
                  activeColor: AppColors.primaryGold,
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                ),
                RadioListTile<String>(
                  title: const Text('Gemini', style: TextStyle(color: AppColors.textLightGrey, fontSize: 13)),
                  value: 'gemini',
                  groupValue: _providerType,
                  onChanged: widget.isConnecting ? null : (val) => setState(() => _providerType = val!),
                  activeColor: AppColors.primaryGold,
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                ),
              ],
            ),
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
            child: _providerType != 'none'
                ? Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: TextField(
                      controller: _apiKeyCtrl,
                      enabled: !widget.isConnecting,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: '$_providerType API Key',
                        hintText: 'Enter your API key',
                        prefixIcon: const Icon(
                          Icons.vpn_key_outlined,
                          color: AppColors.textMuted,
                        ),
                      ),
                      keyboardType: TextInputType.text,
                      textInputAction: TextInputAction.done,
                      onSubmitted: (_) => _connect(),
                    ),
                  )
                : const SizedBox.shrink(),
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
