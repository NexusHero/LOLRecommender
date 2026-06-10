// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:lol_coach/models/model_info.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/theme/app_text_styles.dart';
import 'package:shared_preferences/shared_preferences.dart';

typedef _ModelOption = ({String id, String label});

const _claudeModels = <_ModelOption>[
  (id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5 (Fast)'),
  (id: 'claude-sonnet-4-6', label: 'Sonnet 4.6 (Balanced)'),
  (id: 'claude-opus-4-8', label: 'Opus 4.8 (Powerful)'),
];
const _openaiModels = <_ModelOption>[
  (id: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast)'),
  (id: 'gpt-4o', label: 'GPT-4o (Balanced)'),
];
const _geminiModels = <_ModelOption>[
  (id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Fast)'),
  (id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Powerful)'),
];

List<_ModelOption> _modelsFor(String provider) => switch (provider) {
      'claude' => _claudeModels,
      'openai' => _openaiModels,
      'gemini' => _geminiModels,
      _ => const [],
    };

class ConnectionForm extends StatefulWidget {
  const ConnectionForm({
    required this.onConnect,
    super.key,
    this.onLoadModels,
    this.availableModels,
    this.availableModelsForProvider,
    this.isLoadingModels = false,
    this.error,
    this.isConnecting = false,
  });
  final void Function(
    String host,
    int port,
    String summonerName,
    String providerType,
    String model,
    String apiKey,
  ) onConnect;
  final void Function(String provider, String apiKey)? onLoadModels;
  final List<ModelInfo>? availableModels;
  final String? availableModelsForProvider;
  final bool isLoadingModels;
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
  String _selectedModel = '';
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
      _selectedModel = prefs.getString('selectedModel') ?? '';
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

  List<_ModelOption> get _currentModels {
    if (widget.availableModels != null &&
        widget.availableModelsForProvider == _providerType &&
        widget.availableModels!.isNotEmpty) {
      return widget.availableModels!
          .map((m) => (id: m.id, label: m.displayName))
          .toList();
    }
    return _modelsFor(_providerType);
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
    await prefs.setString('selectedModel', _selectedModel);
    // API key stored in OS keychain, not plain SharedPreferences
    await _secureStorage.write(key: 'apiKey', value: apiKey);

    final models = _currentModels;
    final effectiveModel =
        _selectedModel.isNotEmpty && models.any((m) => m.id == _selectedModel)
            ? _selectedModel
            : models.isNotEmpty
                ? models.first.id
                : '';
    widget.onConnect(host, port, summonerName, _providerType, effectiveModel, apiKey);
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

          // ── Summoner Name (most relevant field first) ───────────
          TextField(
            controller: _summonerCtrl,
            enabled: !widget.isConnecting,
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

          // ── AI Provider ─────────────────────────────────────────
          const Text('AI Provider', style: AppTextStyles.captionBold),
          const SizedBox(height: 4),
          const Text(
            'AI gives smarter, context-aware advice. '
                'Basic uses fast built-in rules.',
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
                : (val) => setState(() {
                      _providerType = val.first;
                      _selectedModel = '';
                    }),
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeInOut,
            child: _providerType != 'none'
                ? Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: Row(
                      children: [
                        Expanded(
                          child: _ModelDropdown(
                            models: _currentModels,
                            selected: _selectedModel,
                            enabled: !widget.isConnecting &&
                                !widget.isLoadingModels,
                            onChanged: (val) =>
                                setState(() => _selectedModel = val ?? ''),
                          ),
                        ),
                        if (widget.onLoadModels != null) ...[
                          const SizedBox(width: 4),
                          _RefreshModelsButton(
                            isLoading: widget.isLoadingModels,
                            enabled: !widget.isConnecting &&
                                _apiKeyCtrl.text.isNotEmpty,
                            onPressed: () => widget.onLoadModels!(
                              _providerType,
                              _apiKeyCtrl.text.trim(),
                            ),
                          ),
                        ],
                      ],
                    ),
                  )
                : const SizedBox.shrink(),
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
                          color: AppColors.textSecondary,
                        ),
                      ),
                      keyboardType: TextInputType.text,
                      textInputAction: TextInputAction.done,
                      onChanged: (_) => setState(() {}),
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
                            prefixIcon: const Icon(
                              Icons.computer_outlined,
                              color: AppColors.textSecondary,
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
                style: AppTextStyles.caption
                    .copyWith(color: AppColors.errorLight),
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
                  style: AppTextStyles.caption,
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
            'The bridge server must be running on the same machine.\n'
                'Default: localhost:8765',
            textAlign: TextAlign.center,
            style: AppTextStyles.caption,
          ),
        ],
      ),
    );
  }
}

class _RefreshModelsButton extends StatelessWidget {
  const _RefreshModelsButton({
    required this.isLoading,
    required this.enabled,
    required this.onPressed,
  });

  final bool isLoading;
  final bool enabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: 'Load available models',
      icon: isLoading
          ? const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : const Icon(Icons.refresh, color: AppColors.textSecondary),
      onPressed: enabled && !isLoading ? onPressed : null,
    );
  }
}

class _ModelDropdown extends StatelessWidget {
  const _ModelDropdown({
    required this.models,
    required this.selected,
    required this.onChanged,
    this.enabled = true,
  });

  final List<_ModelOption> models;
  final String selected;
  final ValueChanged<String?> onChanged;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final effectiveValue =
        models.any((m) => m.id == selected) ? selected : models.first.id;
    return DropdownButtonFormField<String>(
      initialValue: effectiveValue,
      decoration: const InputDecoration(
        labelText: 'Model',
        prefixIcon: Icon(
          Icons.psychology_outlined,
          color: AppColors.textSecondary,
        ),
      ),
      items: models
          .map(
            (m) => DropdownMenuItem(value: m.id, child: Text(m.label)),
          )
          .toList(),
      onChanged: enabled ? onChanged : null,
    );
  }
}
