import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:lol_coach/models/game_state.dart';
import 'package:lol_coach/models/recommendation.dart';
import 'package:lol_coach/models/ws_message.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

typedef WebSocketChannelFactory = WebSocketChannel Function(Uri uri);

WebSocketChannel _defaultChannelFactory(Uri uri) =>
    WebSocketChannel.connect(uri);

enum ConnectionStatus { disconnected, connecting, connected, error }

class WsService extends ChangeNotifier {
  WsService({WebSocketChannelFactory? channelFactory})
      : _channelFactory = channelFactory ?? _defaultChannelFactory;

  final WebSocketChannelFactory _channelFactory;

  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _subscription;
  Timer? _reconnectTimer;

  ConnectionStatus _status = ConnectionStatus.disconnected;
  String? _lastError;
  String? _lastLlmError;
  ParsedGameState? _gameState;
  ItemRecommendation? _recommendation;
  String _lastEvent = '';
  bool _gameActive = false;
  bool _isAnalyzing = false;
  DateTime? _recommendationTime;

  // Reconnect state
  bool _intentionalDisconnect = false;
  Duration _reconnectDelay = const Duration(seconds: 1);
  static const Duration _maxReconnectDelay = Duration(seconds: 30);

  // Last known connection params for auto-reconnect
  String? _lastHost;
  int _lastPort = 8765;
  String? _lastSummonerName;
  String? _lastProviderType;
  String? _lastApiKey;

  ConnectionStatus get status => _status;
  String? get lastError => _lastError;
  String? get lastLlmError => _lastLlmError;
  String get activeProviderType => _lastProviderType ?? 'none';
  ParsedGameState? get gameState => _gameState;
  ItemRecommendation? get recommendation => _recommendation;
  String get lastEvent => _lastEvent;
  bool get gameActive => _gameActive;
  bool get isConnected => _status == ConnectionStatus.connected;
  bool get isAnalyzing => _isAnalyzing;
  DateTime? get recommendationTime => _recommendationTime;

  void connect(
    String host, {
    int port = 8765,
    String? summonerName,
    String? providerType,
    String? apiKey,
  }) {
    if (_status == ConnectionStatus.connected ||
        _status == ConnectionStatus.connecting) {
      return;
    }

    // Persist params and reset reconnect state for a fresh manual connect
    _lastHost = host;
    _lastPort = port;
    _lastSummonerName = summonerName;
    _lastProviderType = providerType;
    _lastApiKey = apiKey;
    _intentionalDisconnect = false;
    _reconnectDelay = const Duration(seconds: 1);

    _doConnect(
      host,
      port: port,
      summonerName: summonerName,
      providerType: providerType,
      apiKey: apiKey,
    );
  }

  void disconnect() {
    _intentionalDisconnect = true;
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _reconnectDelay = const Duration(seconds: 1);

    _subscription?.cancel();
    _channel?.sink.close();
    _channel = null;
    _subscription = null;
    _status = ConnectionStatus.disconnected;
    _gameState = null;
    _recommendation = null;
    _gameActive = false;
    _lastEvent = '';
    _lastError = null;
    _lastLlmError = null;
    _isAnalyzing = false;
    _recommendationTime = null;
    notifyListeners();
  }

  void _doConnect(
    String host, {
    int port = 8765,
    String? summonerName,
    String? providerType,
    String? apiKey,
  }) {
    _status = ConnectionStatus.connecting;
    _lastError = null;
    notifyListeners();

    final uri = Uri.parse('ws://$host:$port');
    try {
      _channel = _channelFactory(uri);

      if (summonerName != null && summonerName.isNotEmpty) {
        _channel!.sink.add(
          jsonEncode({
            'event': 'SET_SUMMONER',
            'summonerName': summonerName,
          }),
        );
      }

      if (providerType != null && apiKey != null && apiKey.isNotEmpty) {
        _channel!.sink.add(
          jsonEncode({
            'event': 'SET_LLM_PROVIDER',
            'provider': providerType,
            'apiKey': apiKey,
          }),
        );
      } else if (providerType == 'none') {
        _channel!.sink.add(
          jsonEncode({
            'event': 'SET_LLM_PROVIDER',
          }),
        );
      }

      _subscription = _channel!.stream.listen(
        _onData,
        onError: _onError,
        onDone: _onDone,
        cancelOnError: false,
      );
    } catch (e) {
      _status = ConnectionStatus.error;
      _lastError = e.toString();
      notifyListeners();
      _scheduleReconnect();
    }
  }

  void triggerAnalysis() {
    if (_channel == null || _status != ConnectionStatus.connected) return;
    _isAnalyzing = true;
    _lastLlmError = null;
    notifyListeners();
    _channel!.sink.add(jsonEncode({'event': 'TRIGGER_ANALYSIS'}));
  }

  void clearLlmError() {
    if (_lastLlmError == null) return;
    _lastLlmError = null;
    notifyListeners();
  }

  void _onData(dynamic raw) {
    try {
      final json = jsonDecode(raw as String) as Map<String, dynamic>;
      final msg = WsMessage.fromJson(json);
      _lastEvent = msg.event;

      if (_status != ConnectionStatus.connected) {
        _status = ConnectionStatus.connected;
        // reset backoff on success
        _reconnectDelay = const Duration(seconds: 1);
      }

      switch (msg.event) {
        case 'GAME_INACTIVE':
          _gameActive = false;
          _gameState = null;
          _recommendation = null;
          _isAnalyzing = false;
        case 'RECOMMENDATION':
          _recommendation = msg.recommendation;
          if (msg.gameState != null) _gameState = msg.gameState;
          _gameActive = true;
          _isAnalyzing = false;
          _recommendationTime = DateTime.now();
        case 'LLM_ERROR':
          _lastLlmError = msg.error;
          _isAnalyzing = false;
        default:
          if (msg.gameState != null) {
            _gameState = msg.gameState;
            _gameActive = true;
          }
          _isAnalyzing = false;
      }
    } catch (e) {
      debugPrint('[WsService] Parse error: $e');
    }
    notifyListeners();
  }

  void _onError(Object error) {
    _status = ConnectionStatus.error;
    _lastError = error.toString();
    notifyListeners();
    _scheduleReconnect();
  }

  void _onDone() {
    if (_intentionalDisconnect) {
      if (_status != ConnectionStatus.disconnected) {
        _status = ConnectionStatus.disconnected;
        notifyListeners();
      }
      return;
    }
    if (_status != ConnectionStatus.disconnected) {
      _status = ConnectionStatus.disconnected;
      notifyListeners();
    }
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    if (_intentionalDisconnect || _lastHost == null) return;
    _reconnectTimer?.cancel();

    debugPrint('[WsService] Reconnecting in ${_reconnectDelay.inSeconds}s...');
    _reconnectTimer = Timer(_reconnectDelay, () {
      if (_intentionalDisconnect) return;

      // Exponential backoff, capped at _maxReconnectDelay
      _reconnectDelay = Duration(
        seconds: (_reconnectDelay.inSeconds * 2)
            .clamp(1, _maxReconnectDelay.inSeconds),
      );

      _doConnect(
        _lastHost!,
        port: _lastPort,
        summonerName: _lastSummonerName,
        providerType: _lastProviderType,
        apiKey: _lastApiKey,
      );
    });
  }

  @override
  void dispose() {
    disconnect();
    super.dispose();
  }
}
