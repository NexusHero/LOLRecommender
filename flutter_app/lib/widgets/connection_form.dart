// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/theme/app_text_styles.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ConnectionForm extends StatefulWidget {
  const ConnectionForm({
    required this.onConnect,
    super.key,
    this.error,
    this.isConnecting = false,
  });
  final void Function(
    String host,
    int port,
    String summonerName,
    String providerType,
    String apiKey,
  ) onConnect;
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
  bool _showAdvanced = false;

  @override
  void initState() {
    super.initState();
    _loadPrefs();
  }

  Future<void> _loadPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final apiKey = await _secureStorage.read(key: 'apiKey') ?? '';
    final host = prefs.getString('host') ?? '127.0.0.1';
    setState(() {
      _hostCtrl.text = host;
      _portCtrl.text = prefs.getString('port') ?? '$_defaultPort';
      _summonerCtrl.text = prefs.getString('summonerName') ?? '';
      _providerType = prefs.getString('providerType') ?? 'none';
      _apiKeyCtrl.text = apiKey;
      // Show advanced fields if user changed them from defaults
      _showAdvanced = host != '127.0.0.1' && host != 'localhost';
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
    // API key stored in OS keychain, not plain SharedPreferences
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
          // ── Value Proposition ───────────────────────────────────
          const Icon(Icons.shield_outlined, size: 48, color: AppColors.gold),
          const SizedBox(height: 12),
          const Text('LoL Coach', textAlign: TextAlign.center, style: AppTextStyles.display),
          const SizedBox(height: 8),
          const Text(
            'Real-time item advice during your match.\nAlways know what to build — powered by AI.',
            textAlign: TextAlign.center,
            style: AppTextStyles.caption,
          ),
          const SizedBox(height: 32),

          // ── Summoner Name (most relevant field first) ───────────
          TextField(
            controller: _summonerCtrl,
            enabled: !widget.isConnecting,
            decoration: const InputDecoration(
              labelText: 'Summoner Name (Optional)',
              hintText: 'Your in-game name',
              prefixIcon: Icon(Icons.person_outline, color: AppColors.textSecondary),
            ),
            keyboardType: TextInputType.text,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),

          // ── AI Provider ─────────────────────────────────────────
          const Text('AI Provider', style: AppTextStyles.captionBold),
          const SizedBox(height: 4),
          const Text(
            'AI gives smarter, context-aware advice. Basic uses fast built-in rules.',
            style: AppTextStyles.caption,
          ),
          const SizedBox(height: 10),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'none', label: Text('Basic')),
              ButtonSegment(value: 'claude', label: Text('Claude')),
              ButtonSegment(value: 'openai', label: Text('OpenAI')),
              ButtonSegment(value: 'gemini', label: Text('Gemini')),
            ],
            selected: {_providerType},
            onSelectionChanged: widget.isConnecting
                ? null
                : (val) => setState(() => _providerType = val.first),
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
                        prefixIcon: const Icon(Icons.vpn_key_outlined, color: AppColors.textSecondary),
                      ),
                      keyboardType: TextInputType.text,
                      textInputAction: TextInputAction.done,
                      onSubmitted: (_) => _connect(),
                    ),
                  )
                : const SizedBox.shrink(),
          ),
          const SizedBox(height: 24),

          // ── Advanced (collapsed by default) ────────────────────
          InkWell(
            onTap: () => setState(() => _showAdvanced = !_showAdvanced),
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  Icon(
                    _showAdvanced ? Icons.expand_less : Icons.expand_more,
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
            child: _showAdvanced
                ? Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Column(
                      children: [
                        TextField(
                          controller: _hostCtrl,
                          enabled: !widget.isConnecting,
                          decoration: InputDecoration(
                            labelText: 'Server IP',
                            hintText: 'e.g. 192.168.1.100',
                            prefixIcon: const Icon(Icons.computer_outlined, color: AppColors.textSecondary),
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
                            prefixIcon: Icon(Icons.settings_ethernet, color: AppColors.textSecondary),
                          ),
                          keyboardType: TextInputType.number,
                          textInputAction: TextInputAction.next,
                        ),
                      ],
                    ),
                  )
                : const SizedBox.shrink(),
          ),

          // ── Error / Connecting state ────────────────────────────
          if (widget.error != null && !widget.isConnecting) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.errorSubtle,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.error),
              ),
              child: Text(
                widget.error!,
                style: AppTextStyles.caption.copyWith(color: AppColors.errorLight),
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
                const Text('Connecting to bridge...', style: AppTextStyles.caption),
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
            'The bridge server must be running on the same machine.\nDefault: localhost:8765',
            textAlign: TextAlign.center,
            style: AppTextStyles.caption,
          ),
        ],
      ),
    );
  }
}
