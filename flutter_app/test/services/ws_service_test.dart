import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:lol_coach/services/ws_service.dart';
import 'package:stream_channel/stream_channel.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

// --- Fake WebSocket infrastructure ---

class _FakeSink implements WebSocketSink {
  bool closed = false;

  @override
  Future<void> close([int? closeCode, String? closeReason]) async {
    closed = true;
  }

  @override
  void add(dynamic data) {}

  @override
  void addError(Object error, [StackTrace? stackTrace]) {}

  @override
  Future<void> addStream(Stream<dynamic> stream) async {}

  @override
  Future get done async {}
}

class FakeWebSocketChannel with StreamChannelMixin implements WebSocketChannel {
  final _controller = StreamController<dynamic>.broadcast();
  final _sink = _FakeSink();

  @override
  Stream<dynamic> get stream => _controller.stream;

  @override
  WebSocketSink get sink => _sink;

  @override
  String? get protocol => null;

  @override
  int? get closeCode => null;

  @override
  String? get closeReason => null;

  @override
  Future<void> get ready => Future.value();

  void push(String data) => _controller.add(data);
  void pushError(Object error) => _controller.addError(error);
  Future<void> close() => _controller.close();
}

// --- Helpers ---

String _encode(Map<String, dynamic> json) => jsonEncode(json);

const _connectedMsg = {'event': 'CONNECTED', 'timestamp': 0};

void main() {
  group('WsService', () {
    late FakeWebSocketChannel fakeChannel;
    late WsService service;

    setUp(() {
      fakeChannel = FakeWebSocketChannel();
      service = WsService(channelFactory: (_) => fakeChannel);
    });

    tearDown(() {
      service.dispose();
    });

    test('initial status is disconnected', () {
      expect(service.status, ConnectionStatus.disconnected);
      expect(service.gameActive, isFalse);
      expect(service.gameState, isNull);
    });

    test('status is connecting immediately after connect()', () {
      service.connect('localhost');

      expect(service.status, ConnectionStatus.connecting);
    });

    test('does not reconnect if already connecting', () {
      service.connect('localhost');
      service.connect('localhost');

      expect(service.status, ConnectionStatus.connecting);
    });

    test('status becomes connected after first message', () async {
      service.connect('localhost');
      fakeChannel.push(_encode(_connectedMsg));
      await Future.microtask(() {});

      expect(service.status, ConnectionStatus.connected);
    });

    test('lastEvent is updated on each message', () async {
      service.connect('localhost');
      fakeChannel.push(_encode(_connectedMsg));
      await Future.microtask(() {});

      expect(service.lastEvent, 'CONNECTED');
    });

    test('gameActive becomes false on GAME_INACTIVE', () async {
      service.connect('localhost');
      fakeChannel.push(_encode(_connectedMsg));
      await Future.microtask(() {});

      fakeChannel.push(_encode({'event': 'GAME_INACTIVE', 'timestamp': 1}));
      await Future.microtask(() {});

      expect(service.gameActive, isFalse);
      expect(service.gameState, isNull);
      expect(service.recommendation, isNull);
    });

    test('status becomes error on stream error', () async {
      service.connect('localhost');
      fakeChannel.pushError(Exception('network failure'));
      await Future.microtask(() {});

      expect(service.status, ConnectionStatus.error);
      expect(service.lastError, isNotNull);
    });

    test('status becomes disconnected when stream closes', () async {
      service.connect('localhost');
      await fakeChannel.close();
      await Future.microtask(() {});

      expect(service.status, ConnectionStatus.disconnected);
    });

    test('disconnect resets all state', () async {
      service.connect('localhost');
      fakeChannel.push(_encode(_connectedMsg));
      await Future.microtask(() {});

      service.disconnect();

      expect(service.status, ConnectionStatus.disconnected);
      expect(service.gameActive, isFalse);
      expect(service.gameState, isNull);
      expect(service.recommendation, isNull);
      expect(service.lastEvent, '');
    });

    test('notifyListeners is called on status change', () async {
      var notifyCount = 0;
      service.addListener(() => notifyCount++);

      service.connect('localhost');
      expect(notifyCount, 1); // connecting

      fakeChannel.push(_encode(_connectedMsg));
      await Future.microtask(() {});
      expect(notifyCount, 2); // connected
    });
  });
}
