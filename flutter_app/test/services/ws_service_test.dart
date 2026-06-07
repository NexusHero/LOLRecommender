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
  void add(dynamic data) => sentData.add(data);

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

    group('initial state', () {
      test('initialState_BeforeConnect_StatusIsDisconnected', () {
        expect(service.status, ConnectionStatus.disconnected);
        expect(service.gameActive, isFalse);
        expect(service.gameState, isNull);
      });
    });

    group('connect', () {
      test('connect_Called_StatusBecomesConnecting', () {
        service.connect('localhost');

        expect(service.status, ConnectionStatus.connecting);
      });

      test('connect_CalledWhileConnecting_DoesNotDuplicateConnection', () {
        service.connect('localhost');
        service.connect('localhost');

        expect(service.status, ConnectionStatus.connecting);
      });

      test(
        'connect_AfterFirstMessageReceived_StatusBecomesConnected',
        () async {
        service.connect('localhost');
        fakeChannel.push(_encode(_connectedMsg));
        await Future.microtask(() {});

        expect(service.status, ConnectionStatus.connected);
      });

      test('connect_AfterFirstMessage_LastEventIsUpdated', () async {
        service.connect('localhost');
        fakeChannel.push(_encode(_connectedMsg));
        await Future.microtask(() {});

        expect(service.lastEvent, 'CONNECTED');
      });
    });

    group('disconnect', () {
      test('disconnect_WhileConnected_ResetsAllState', () async {
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
    });

    group('game state events', () {
      test('onMessage_GameInactiveReceived_ClearsGameState', () async {
        service.connect('localhost');
        fakeChannel.push(_encode(_connectedMsg));
        await Future.microtask(() {});

        fakeChannel.push(_encode({'event': 'GAME_INACTIVE', 'timestamp': 1}));
        await Future.microtask(() {});

        expect(service.gameActive, isFalse);
        expect(service.gameState, isNull);
        expect(service.recommendation, isNull);
      });
    });

    group('error handling', () {
      test('onError_StreamEmitsError_StatusBecomesError', () async {
        service.connect('localhost');
        fakeChannel.pushError(Exception('network failure'));
        await Future.microtask(() {});

        expect(service.status, ConnectionStatus.error);
        expect(service.lastError, isNotNull);
      });

      test('onDone_StreamCloses_StatusBecomesDisconnected', () async {
        service.connect('localhost');
        await fakeChannel.close();
        await Future.microtask(() {});

        expect(service.status, ConnectionStatus.disconnected);
      });
    });

    group('notifyListeners', () {
      test('connect_StatusChanges_NotifiesListeners', () async {
        var notifyCount = 0;
        service.addListener(() => notifyCount++);

        service.connect('localhost');
        expect(notifyCount, 1);

        fakeChannel.push(_encode(_connectedMsg));
        await Future.microtask(() {});
        expect(notifyCount, 2);
      });
    });

    group('auto-reconnect', () {
      test('disconnect_ExplicitDisconnect_PreventsFurtherReconnect', () async {
        service.connect('localhost');
        fakeChannel.push(_encode(_connectedMsg));
        await Future.microtask(() {});

        service.disconnect();

        expect(service.status, ConnectionStatus.disconnected);
      });

      test('onDone_UnexpectedStreamClose_StatusBecomesDisconnected', () async {
        service.connect('localhost');
        await fakeChannel.close();
        await Future.microtask(() {});

        expect(service.status, ConnectionStatus.disconnected);
      });

      test('connect_AfterSuccessfulConnection_ReconnectDelayIsReset', () async {
        service.connect('localhost');
        fakeChannel.push(_encode(_connectedMsg));
        await Future.microtask(() {});

        expect(service.status, ConnectionStatus.connected);
        service.disconnect();
        service.connect('localhost');
        expect(service.status, ConnectionStatus.connecting);
      });
    });

    group('triggerAnalysis', () {
      test(
        'triggerAnalysis_StatusConnected_SendsTriggerAnalysisEvent',
        () async {
        service.connect('localhost');
        fakeChannel.push(_encode(_connectedMsg));
        await Future.microtask(() {});

        service.triggerAnalysis();

        expect(fakeChannel.sentData, hasLength(1));
        final sent = jsonDecode(fakeChannel.sentData.first as String)
            as Map<String, dynamic>;
        expect(sent['event'], 'TRIGGER_ANALYSIS');
      });

      test('triggerAnalysis_StatusDisconnected_SendsNothing', () {
        service.triggerAnalysis();

        expect(fakeChannel.sentData, isEmpty);
      });

      test('triggerAnalysis_StatusConnecting_SendsNothing', () {
        service.connect('localhost');
        final sentBefore = fakeChannel.sentData.length;

        service.triggerAnalysis();

        expect(fakeChannel.sentData.length, sentBefore);
      });
    });

    group('summonerName', () {
      test('connect_WithSummonerName_SendsSetSummonerMessage', () {
        service.connect('localhost', summonerName: 'MySummoner');

        expect(fakeChannel.sentData, hasLength(1));
        final sent = jsonDecode(fakeChannel.sentData.first as String)
            as Map<String, dynamic>;
        expect(sent['event'], 'SET_SUMMONER');
        expect(sent['summonerName'], 'MySummoner');
      });

      test('connect_WithoutSummonerName_DoesNotSendSetSummoner', () {
        service.connect('localhost');

        expect(fakeChannel.sentData, isEmpty);
      });

      test('connect_WithEmptySummonerName_DoesNotSendSetSummoner', () {
        service.connect('localhost', summonerName: '');

        expect(fakeChannel.sentData, isEmpty);
      });

      test('connect_WithSummonerName_SendsMessageBeforeStreamSubscription', () {
        service.connect('localhost', summonerName: 'EarlyBird');

        expect(fakeChannel.sentData, hasLength(1));
        expect(service.status, ConnectionStatus.connecting);
      });
    });
  });
}
