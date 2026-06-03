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
  StreamSubscription? _subscription;

  ConnectionStatus _status = ConnectionStatus.disconnected;
  String? _lastError;
  ParsedGameState? _gameState;
  ItemRecommendation? _recommendation;
  String _lastEvent = '';
  bool _gameActive = false;

  ConnectionStatus get status => _status;
  String? get lastError => _lastError;
  ParsedGameState? get gameState => _gameState;
  ItemRecommendation? get recommendation => _recommendation;
  String get lastEvent => _lastEvent;
  bool get gameActive => _gameActive;
  bool get isConnected => _status == ConnectionStatus.connected;

  void connect(String host, {int port = 8765}) {
    if (_status == ConnectionStatus.connected ||
        _status == ConnectionStatus.connecting) {
      return;
    }

    _status = ConnectionStatus.connecting;
    _lastError = null;
    notifyListeners();

    final uri = Uri.parse('ws://$host:$port');
    try {
      _channel = _channelFactory(uri);
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
    }
  }

  void disconnect() {
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
    notifyListeners();
  }

  void _onData(dynamic raw) {
    try {
      final json = jsonDecode(raw as String) as Map<String, dynamic>;
      final msg = WsMessage.fromJson(json);
      _lastEvent = msg.event;

      if (_status != ConnectionStatus.connected) {
        _status = ConnectionStatus.connected;
      }

      switch (msg.event) {
        case 'GAME_INACTIVE':
          _gameActive = false;
          _gameState = null;
          _recommendation = null;
        case 'RECOMMENDATION':
          _recommendation = msg.recommendation;
          if (msg.gameState != null) _gameState = msg.gameState;
          _gameActive = true;
        default:
          if (msg.gameState != null) {
            _gameState = msg.gameState;
            _gameActive = true;
          }
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
  }

  void _onDone() {
    if (_status != ConnectionStatus.disconnected) {
      _status = ConnectionStatus.disconnected;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    disconnect();
    super.dispose();
  }
}
