// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lol_coach/models/model_info.dart';
import 'package:lol_coach/widgets/connection_form.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  Widget buildForm({
    List<ModelInfo>? availableModels,
    String? availableModelsForProvider,
    bool isLoadingModels = false,
    void Function(String provider, String apiKey)? onLoadModels,
    void Function(String, int, String, String, String, String)? onConnect,
  }) =>
      MaterialApp(
        home: Scaffold(
          body: ConnectionForm(
            onConnect: onConnect ??
                (_, __, ___, ____, _____, ______) {},
            availableModels: availableModels,
            availableModelsForProvider: availableModelsForProvider,
            isLoadingModels: isLoadingModels,
            onLoadModels: onLoadModels,
          ),
        ),
      );

  group('ConnectionForm — bridge model data in UI', () {
    testWidgets(
      'BridgeModels_AppearInDropdownInsteadOfHardcoded',
      (tester) async {
        final bridgeModels = [
          const ModelInfo(id: 'claude-sonnet-99', displayName: 'Sonnet 99 (New!)'),
          const ModelInfo(id: 'claude-opus-99', displayName: 'Opus 99 (New!)'),
        ];

        await tester.pumpWidget(buildForm(
          availableModels: bridgeModels,
          availableModelsForProvider: 'claude',
        ));
        await tester.pumpAndSettle();

        await tester.tap(find.text('Claude'));
        await tester.pumpAndSettle();

        // The default-selected bridge model is displayed in the closed dropdown
        expect(find.text('Sonnet 99 (New!)'), findsOneWidget);
        // Hardcoded fallback models are NOT shown
        expect(find.text('Haiku 4.5 (Fast)'), findsNothing);
        expect(find.text('Sonnet 4.6 (Balanced)'), findsNothing);

        // Open dropdown — all bridge models must appear
        await tester.tap(find.byType(DropdownButtonFormField<String>));
        await tester.pumpAndSettle();

        expect(find.text('Sonnet 99 (New!)'), findsWidgets); // selected + list
        expect(find.text('Opus 99 (New!)'), findsOneWidget);
        expect(find.text('Haiku 4.5 (Fast)'), findsNothing);
      },
    );

    testWidgets(
      'BridgeModelsForOtherProvider_FallsBackToHardcoded',
      (tester) async {
        final openaiModels = [
          const ModelInfo(id: 'gpt-5', displayName: 'GPT-5 (New!)'),
        ];

        await tester.pumpWidget(buildForm(
          availableModels: openaiModels,
          availableModelsForProvider: 'openai',
        ));
        await tester.pumpAndSettle();

        // Select Claude — bridge models are for OpenAI, not Claude
        await tester.tap(find.text('Claude'));
        await tester.pumpAndSettle();

        expect(find.text('Haiku 4.5 (Fast)'), findsOneWidget);
        expect(find.text('GPT-5 (New!)'), findsNothing);
      },
    );

    testWidgets(
      'BridgeModel_SelectedModelPassedToOnConnect',
      (tester) async {
        String? capturedModel;
        final bridgeModels = [
          const ModelInfo(id: 'claude-sonnet-99', displayName: 'Sonnet 99'),
          const ModelInfo(id: 'claude-opus-99', displayName: 'Opus 99'),
        ];

        await tester.pumpWidget(buildForm(
          availableModels: bridgeModels,
          availableModelsForProvider: 'claude',
          onConnect: (_, __, ___, ____, model, _____) => capturedModel = model,
        ));
        await tester.pumpAndSettle();

        await tester.tap(find.text('Claude'));
        await tester.pumpAndSettle();

        await tester.tap(find.byType(DropdownButtonFormField<String>));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Opus 99').last);
        await tester.pumpAndSettle();

        await tester.enterText(
          find.widgetWithText(TextField, 'claude API Key'),
          'key',
        );
        await tester.ensureVisible(find.text('CONNECT'));
        await tester.tap(find.text('CONNECT'));
        await tester.pumpAndSettle();

        expect(capturedModel, 'claude-opus-99');
      },
    );

    testWidgets(
      'LoadingState_ShowsSpinnerInRefreshButton',
      (tester) async {
        await tester.pumpWidget(buildForm(
          isLoadingModels: true,
          onLoadModels: (_, __) {},
        ));
        await tester.pumpAndSettle();

        await tester.tap(find.text('Claude'));
        // Use pump with duration instead of pumpAndSettle — CircularProgressIndicator
        // is an ongoing animation that prevents pumpAndSettle from settling.
        await tester.pump(const Duration(milliseconds: 350));

        expect(find.byType(CircularProgressIndicator), findsOneWidget);
      },
    );

    testWidgets(
      'RefreshButton_WhenConnectedWithKey_CallsOnLoadModels',
      (tester) async {
        String? capturedProvider;
        String? capturedKey;

        await tester.pumpWidget(buildForm(
          onLoadModels: (provider, apiKey) {
            capturedProvider = provider;
            capturedKey = apiKey;
          },
        ));
        await tester.pumpAndSettle();

        await tester.tap(find.text('Claude'));
        await tester.pumpAndSettle();

        await tester.enterText(
          find.widgetWithText(TextField, 'claude API Key'),
          'sk-ant-test',
        );
        await tester.pumpAndSettle(); // onChanged triggers setState → button re-enables

        await tester.tap(find.byTooltip('Load available models'));
        await tester.pumpAndSettle();

        expect(capturedProvider, 'claude');
        expect(capturedKey, 'sk-ant-test');
      },
    );

    testWidgets(
      'NoLoadButton_WhenOnLoadModelsIsNull',
      (tester) async {
        await tester.pumpWidget(buildForm(onLoadModels: null));
        await tester.pumpAndSettle();

        await tester.tap(find.text('Claude'));
        await tester.pumpAndSettle();

        expect(find.byTooltip('Load available models'), findsNothing);
      },
    );
  });
}
