import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:lol_coach/models/game_state.dart';
import 'package:lol_coach/models/model_info.dart';
import 'package:lol_coach/models/recommendation.dart';
import 'package:lol_coach/models/token_usage.dart';
import 'package:lol_coach/models/ws_message.dart';
import 'package:lol_coach/services/ws_client.dart';

String? _loadCoreSecret() {
  final home =
      Platform.environment['HOME'] ?? Platform.environment['USERPROFILE'];
  if (home == null) return null;
  final file = File('$home/.lolcoach/.secret');
  if (!file.existsSync()) return null;
  return file.readAsStringSync().trim();
}

class CoachService extends ChangeNotifier {
  CoachService(this._client) {
    _client.addListener(_onClientStatusChanged);
    _subscription = _client.messages.listen(_onMessage);
  }

  final WsClient _client;
  late final StreamSubscription<String> _subscription;

  ParsedGameState? _gameState;
  ItemRecommendation? _recommendation;
  String _lastEvent = '';
  bool _gameActive = false;
  bool _isAnalyzing = false;
  bool _llmFailed = false;
  String? _lastLlmError;
  DateTime? _recommendationTime;

  List<ModelInfo>? _availableModels;
  String? _availableModelsProvider;
  bool _isLoadingModels = false;

  bool _isValidatingKey = false;
  bool? _keyValidationResult;
  String? _keyValidationError;

  TokenUsage? _lastTokenUsage;
  bool _isBudgetExceeded = false;

  String? _activeSummonerName;
  String? _activeProviderType;
  String? _activeModel;
  String? _activeApiKey;
  int _activeTokenBudget = 0;

  ConnectionStatus get status => _client.status;
  String? get lastError => _client.lastError;
  bool get isConnected => _client.isConnected;

  String? get lastLlmError => _lastLlmError;
  String get activeProviderType => _activeProviderType ?? 'none';
  String? get activeModel => _activeModel;
  List<ModelInfo>? get availableModels => _availableModels;
  String? get availableModelsProvider => _availableModelsProvider;
  bool get isLoadingModels => _isLoadingModels;
  bool get isValidatingKey => _isValidatingKey;
  bool? get keyValidationResult => _keyValidationResult;
  String? get keyValidationError => _keyValidationError;
  TokenUsage? get lastTokenUsage => _lastTokenUsage;
  bool get isBudgetExceeded => _isBudgetExceeded;
  ParsedGameState? get gameState => _gameState;
  ItemRecommendation? get recommendation => _recommendation;
  String get lastEvent => _lastEvent;
  bool get gameActive => _gameActive;
  bool get isAnalyzing => _isAnalyzing;
  bool get llmFailed => _llmFailed;
  DateTime? get recommendationTime => _recommendationTime;

  void connect(
    String host, {
    int port = 8765,
    String? summonerName,
    String? providerType,
    String? model,
    String? apiKey,
    int tokenBudget = 0,
  }) {
    _activeSummonerName = summonerName;
    _activeProviderType = providerType;
    _activeModel = model;
    _activeApiKey = apiKey;
    _activeTokenBudget = tokenBudget;

    _gameState = null;
    _recommendation = null;
    _gameActive = false;
    _lastEvent = '';
    _lastLlmError = null;
    _isAnalyzing = false;
    _llmFailed = false;
    _recommendationTime = null;
    _isBudgetExceeded = false;

    final secret = _loadCoreSecret();
    final headers = secret != null ? {'Authorization': 'Bearer $secret'} : null;
    final uri = Uri.parse('ws://$host:$port');

    _client.connect(uri, headers: headers);
  }

  void disconnect() {
    _client.disconnect();
  }

  void _onClientStatusChanged() {
    if (_client.status == ConnectionStatus.connected) {
      _sendInitialSetup();
    }
    notifyListeners();
  }

  void _sendInitialSetup() {
    if (_activeSummonerName != null && _activeSummonerName!.isNotEmpty) {
      _client.send(jsonEncode({
        'event': 'SET_SUMMONER',
        'summonerName': _activeSummonerName,
      }),);
    }

    if (_activeProviderType != null &&
        _activeProviderType != 'none' &&
        _activeApiKey != null &&
        _activeApiKey!.isNotEmpty) {
      _client.send(jsonEncode({
        'event': 'SET_LLM_PROVIDER',
        'provider': _activeProviderType,
        if (_activeModel != null) 'model': _activeModel,
        'apiKey': _activeApiKey,
        if (_activeTokenBudget > 0) 'tokenBudget': _activeTokenBudget,
      }),);
      _isLoadingModels = true;
      _availableModels = null;
      _availableModelsProvider = null;
      _client.send(jsonEncode({
        'event': 'GET_MODELS',
        'provider': _activeProviderType,
        'apiKey': _activeApiKey,
      }),);
    } else if (_activeProviderType == 'none') {
      _client.send(jsonEncode({
        'event': 'SET_LLM_PROVIDER',
      }),);
    }
  }

  void triggerAnalysis() {
    if (!isConnected) return;
    _isAnalyzing = true;
    _lastLlmError = null;
    notifyListeners();
    _client.send(jsonEncode({'event': 'TRIGGER_ANALYSIS'}));
  }

  void loadModels(String provider, String apiKey) {
    if (!isConnected) return;
    _isLoadingModels = true;
    _availableModels = null;
    _availableModelsProvider = null;
    notifyListeners();
    _client.send(jsonEncode({
      'event': 'GET_MODELS',
      'provider': provider,
      'apiKey': apiKey,
    }),);
  }

  void clearLlmError() {
    if (_lastLlmError == null) return;
    _lastLlmError = null;
    notifyListeners();
  }

  void validateKey(String provider, String apiKey) {
    if (!isConnected) return;
    _isValidatingKey = true;
    _keyValidationResult = null;
    _keyValidationError = null;
    notifyListeners();
    _client.send(jsonEncode({
      'event': 'VALIDATE_KEY',
      'provider': provider,
      'apiKey': apiKey,
    }),);
  }

  void clearKeyValidation() {
    if (_keyValidationResult == null && _keyValidationError == null) return;
    _keyValidationResult = null;
    _keyValidationError = null;
    notifyListeners();
  }

  void _onMessage(String raw) {
    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      final msg = WsMessage.fromJson(json);
      _lastEvent = msg.event;

      switch (msg.event) {
        case 'GAME_INACTIVE':
          _gameActive = false;
          _gameState = null;
          _recommendation = null;
          _isAnalyzing = false;
        case 'RECOMMENDATION_UPDATE':
          _recommendation = msg.recommendation ?? _recommendation;
          if (msg.gameState != null) _gameState = msg.gameState;
          if (msg.tokenUsage != null) _lastTokenUsage = msg.tokenUsage;
          _gameActive = true;
          _llmFailed = false;
          _isAnalyzing = false;
          _recommendationTime = DateTime.now();
        case 'LLM_ERROR':
          _lastLlmError = msg.error;
          _llmFailed = true;
          _isAnalyzing = false;
        case 'MODELS_AVAILABLE':
          final rawModels = json['models'] as List<dynamic>?;
          final provider = json['provider'] as String?;
          if (rawModels != null && provider != null) {
            _availableModels = rawModels
                .map((m) => ModelInfo.fromJson(m as Map<String, dynamic>))
                .toList();
            _availableModelsProvider = provider;
          }
          _isLoadingModels = false;
        case 'MODELS_ERROR':
          _availableModels = null;
          _availableModelsProvider = null;
          _isLoadingModels = false;
          debugPrint('[CoachService] Models error: ${json["error"]}');
        case 'KEY_VALID':
          _isValidatingKey = false;
          _keyValidationResult = true;
          _keyValidationError = null;
        case 'KEY_INVALID':
          _isValidatingKey = false;
          _keyValidationResult = false;
          _keyValidationError = json['error'] as String?;
        case 'LLM_BUDGET_EXCEEDED':
          _isBudgetExceeded = true;
        default:
          if (msg.gameState != null) {
            _gameState = msg.gameState;
            _gameActive = true;
          }
          _isAnalyzing = false;
      }
    } catch (e) {
      debugPrint('[CoachService] Parse error: $e');
    }
    notifyListeners();
  }

  @override
  void dispose() {
    _client.removeListener(_onClientStatusChanged);
    _subscription.cancel();
    super.dispose();
  }
}
