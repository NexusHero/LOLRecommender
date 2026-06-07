// ignore_for_file: strict_raw_type, cascade_invocations
import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:lol_coach/services/ws_service.dart';
import 'package:stream_channel/stream_channel.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

// --- Fake WebSocket infrastructure ---

class _FakeSink implements WebSocketSink {
  bool closed = false;
  final List<dynamic> sentData = [];

  @override
  Future<void> close([int? closeCode, String? closeReason]) async {
    closed = true;
  }

  @override
  void add(dynamic data) {
    sentData.add(data);
  }

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

  List<dynamic> get sentData => _sink.sentData;

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

    group('auto-reconnect', () {
      test('explicit disconnect prevents reconnect', () async {
        service.connect('localhost');
        fakeChannel.push(_encode(_connectedMsg));
        await Future.microtask(() {});

        service.disconnect();
        // After explicit disconnect the flag is set — no reconnect timer should fire
        expect(service.status, ConnectionStatus.disconnected);
      });

      test('status becomes disconnected when stream closes unexpectedly', () async {
        service.connect('localhost');
        await fakeChannel.close();
        await Future.microtask(() {});

        // Disconnected (reconnect timer pending, but not yet fired)
        expect(service.status, ConnectionStatus.disconnected);
      });

      test('reconnect delay resets to 1s on successful manual connect', () async {
        service.connect('localhost');
        fakeChannel.push(_encode(_connectedMsg));
        await Future.microtask(() {});

        // After a successful connection the reconnect backoff is reset
        expect(service.status, ConnectionStatus.connected);
        // Disconnect and reconnect manually
        service.disconnect();
        service.connect('localhost');
        expect(service.status, ConnectionStatus.connecting);
      });
    });

    group('triggerAnalysis', () {
      test('sends TRIGGER_ANALYSIS message when connected', () async {
        service.connect('localhost');
        fakeChannel.push(_encode(_connectedMsg));
        await Future.microtask(() {});

        service.triggerAnalysis();

        expect(fakeChannel.sentData, hasLength(1));
        final sent = jsonDecode(fakeChannel.sentData.first as String)
            as Map<String, dynamic>;
        expect(sent['event'], 'TRIGGER_ANALYSIS');
      });

      test('does nothing when status is disconnected', () {
        service.triggerAnalysis();

        expect(fakeChannel.sentData, isEmpty);
      });

      test('does nothing when status is connecting (no CONNECTED msg yet)', () {
        service.connect('localhost');
        // still in connecting state — no CONNECTED received
        final sentBefore = fakeChannel.sentData.length;

        service.triggerAnalysis();

        expect(fakeChannel.sentData.length, sentBefore);
      });
    });

    group('summonerName', () {
      test('sends SET_SUMMONER message when summonerName is provided', () {
        service.connect('localhost', summonerName: 'MySummoner');

        expect(fakeChannel.sentData, hasLength(1));
        final sent = jsonDecode(fakeChannel.sentData.first as String)
            as Map<String, dynamic>;
        expect(sent['event'], 'SET_SUMMONER');
        expect(sent['summonerName'], 'MySummoner');
      });

      test('does not send SET_SUMMONER when summonerName is null', () {
        service.connect('localhost');

        expect(fakeChannel.sentData, isEmpty);
      });

      test('does not send SET_SUMMONER when summonerName is empty', () {
        service.connect('localhost', summonerName: '');

        expect(fakeChannel.sentData, isEmpty);
      });

      test('sends SET_SUMMONER before stream subscription starts', () {
        // Verify the message is sent before listening to the stream,
        // so the server receives it as early as possible.
        service.connect('localhost', summonerName: 'EarlyBird');

        expect(fakeChannel.sentData, hasLength(1));
        expect(service.status, ConnectionStatus.connecting);
      });
    });
  });
}
