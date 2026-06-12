import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lol_coach/models/game_state.dart';
import 'package:lol_coach/models/model_info.dart';
import 'package:lol_coach/models/recommendation.dart';
import 'package:lol_coach/models/token_usage.dart';
import 'package:lol_coach/screens/home_screen.dart';
import 'package:lol_coach/services/ws_service.dart';
import 'package:provider/provider.dart';

class FakeWsService extends ChangeNotifier implements WsService {
  ConnectionStatus _status = ConnectionStatus.disconnected;
  bool _gameActive = false;
  bool triggerAnalysisCalled = false;

  @override
  ConnectionStatus get status => _status;

  @override
  bool get gameActive => _gameActive;

  @override
  bool get isConnected => _status == ConnectionStatus.connected;

  @override
  ParsedGameState? get gameState => null;

  @override
  ItemRecommendation? get recommendation => null;

  @override
  String get lastEvent => '';

  @override
  String? get lastError => null;

  @override
  bool get isAnalyzing => false;

  @override
  bool get llmFailed => false;

  @override
  DateTime? get recommendationTime => null;

  @override
  String? get lastLlmError => null;

  @override
  String get activeProviderType => 'none';

  @override
  String? get activeModel => null;

  @override
  List<ModelInfo>? get availableModels => null;

  @override
  String? get availableModelsProvider => null;

  @override
  bool get isLoadingModels => false;

  @override
  void clearLlmError() {}

  @override
  void triggerAnalysis() => triggerAnalysisCalled = true;

  @override
  void loadModels(String provider, String apiKey) {}

  @override
  bool get isValidatingKey => false;

  @override
  bool? get keyValidationResult => null;

  @override
  String? get keyValidationError => null;

  @override
  TokenUsage? get lastTokenUsage => null;

  @override
  bool get isBudgetExceeded => false;

  @override
  void validateKey(String provider, String apiKey) {}

  @override
  void clearKeyValidation() {}

  @override
  void connect(
    String host, {
    int port = 8765,
    String? summonerName,
    String? providerType,
    String? model,
    String? apiKey,
    int tokenBudget = 0,
  }) {}

  @override
  void disconnect() {}

  void setStatus(ConnectionStatus s) {
    _status = s;
    notifyListeners();
  }

  void setGameActive({required bool value}) {
    _gameActive = value;
    notifyListeners();
  }
}

Widget _buildWithService(FakeWsService service) {
  return ChangeNotifierProvider<WsService>.value(
    value: service,
    child: const MaterialApp(home: HomeScreen()),
  );
}

void main() {
  group('HomeScreen', () {
    group('FAB visibility', () {
      testWidgets(
        'HomeScreen_GameActive_ShowsAnalyseFab',
        (WidgetTester tester) async {
          final service = FakeWsService()
            ..setStatus(ConnectionStatus.connected)
            ..setGameActive(value: true);

          await tester.pumpWidget(_buildWithService(service));
          await tester.pump();

          expect(find.text('Analyse (Basic)'), findsOneWidget);
          expect(find.byType(FloatingActionButton), findsOneWidget);
        },
      );

      testWidgets(
        'HomeScreen_GameNotActive_HidesAnalyseFab',
        (WidgetTester tester) async {
          final service = FakeWsService()
            ..setStatus(ConnectionStatus.connected)
            ..setGameActive(value: false);

          await tester.pumpWidget(_buildWithService(service));
          await tester.pump();

          expect(find.text('Analyse (Basic)'), findsNothing);
          expect(find.byType(FloatingActionButton), findsNothing);
        },
      );

      testWidgets(
        'HomeScreen_Disconnected_HidesAnalyseFab',
        (WidgetTester tester) async {
          final service = FakeWsService();

          await tester.pumpWidget(_buildWithService(service));
          await tester.pump();

          expect(find.byType(FloatingActionButton), findsNothing);
        },
      );
    });

    group('FAB interaction', () {
      testWidgets(
        'HomeScreen_FabTapped_CallsTriggerAnalysis',
        (WidgetTester tester) async {
          final service = FakeWsService()
            ..setStatus(ConnectionStatus.connected)
            ..setGameActive(value: true);

          await tester.pumpWidget(_buildWithService(service));
          await tester.pump();

          await tester.tap(find.byType(FloatingActionButton));
          await tester.pump();

          expect(service.triggerAnalysisCalled, isTrue);
        },
      );
    });

    group('FAB lifecycle', () {
      testWidgets(
        'HomeScreen_GameBecomesActive_FabAppearsWithoutRebuild',
        (WidgetTester tester) async {
          final service = FakeWsService()
            ..setStatus(ConnectionStatus.connected)
            ..setGameActive(value: false);

          await tester.pumpWidget(_buildWithService(service));
          await tester.pump();
          expect(find.byType(FloatingActionButton), findsNothing);

          service.setGameActive(value: true);
          await tester.pump();

          expect(find.byType(FloatingActionButton), findsOneWidget);
        },
      );
    });
  });
}
