import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lol_coach/widgets/connection_form.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  group('ConnectionForm', () {
    testWidgets(
      'ConnectionForm_LlmProviderSelected_ShowsApiKeyFieldAndModelDropdown',
      (WidgetTester tester) async {
        String? capturedProvider;
        String? capturedModel;
        String? capturedApiKey;

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: ConnectionForm(
                onConnect:
                    (host, port, summonerName, providerType, model, apiKey) {
                  capturedProvider = providerType;
                  capturedModel = model;
                  capturedApiKey = apiKey;
                },
              ),
            ),
          ),
        );
        await tester.pumpAndSettle();

        // SegmentedButton shows all four provider options
        expect(find.text('Basic'), findsOneWidget);
        expect(find.text('Claude'), findsOneWidget);
        expect(find.text('OpenAI'), findsOneWidget);
        expect(find.text('Gemini'), findsOneWidget);
        // Only Summoner Name visible — IP/Port hidden behind Advanced toggle
        expect(find.byType(TextField), findsNWidgets(1));

        await tester.tap(find.text('Claude'));
        await tester.pumpAndSettle();

        // Summoner Name + API Key visible; model dropdown also shown
        expect(find.byType(TextField), findsNWidgets(2));
        expect(find.text('claude API Key'), findsOneWidget);
        expect(find.byType(DropdownButtonFormField<String>), findsOneWidget);
        // Default model shown
        expect(find.text('Haiku 4.5 (Fast)'), findsOneWidget);

        await tester.enterText(
          find.widgetWithText(TextField, 'claude API Key'),
          'test-claude-key',
        );
        await tester.ensureVisible(find.text('CONNECT'));
        await tester.tap(find.text('CONNECT'));
        await tester.pumpAndSettle();

        expect(capturedProvider, 'claude');
        expect(capturedModel, 'claude-haiku-4-5-20251001');
        expect(capturedApiKey, 'test-claude-key');
      },
    );

    testWidgets(
      'ConnectionForm_ModelSelected_PassesCorrectModelToCallback',
      (WidgetTester tester) async {
        String? capturedModel;

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: ConnectionForm(
                onConnect:
                    (host, port, summonerName, providerType, model, apiKey) {
                  capturedModel = model;
                },
              ),
            ),
          ),
        );
        await tester.pumpAndSettle();

        await tester.tap(find.text('Claude'));
        await tester.pumpAndSettle();

        await tester.tap(find.byType(DropdownButtonFormField<String>));
        await tester.pumpAndSettle();

        await tester.tap(find.text('Sonnet 4.6 (Balanced)').last);
        await tester.pumpAndSettle();

        await tester.enterText(
          find.widgetWithText(TextField, 'claude API Key'),
          'key',
        );
        await tester.ensureVisible(find.text('CONNECT'));
        await tester.tap(find.text('CONNECT'));
        await tester.pumpAndSettle();

        expect(capturedModel, 'claude-sonnet-4-6');
      },
    );

    testWidgets(
      'ConnectionForm_NoneProvider_ConnectsWithoutApiKey',
      (WidgetTester tester) async {
        String? capturedProvider;
        String? capturedApiKey;

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: ConnectionForm(
                onConnect:
                    (host, port, summonerName, providerType, model, apiKey) {
                  capturedProvider = providerType;
                  capturedApiKey = apiKey;
                },
              ),
            ),
          ),
        );
        await tester.pumpAndSettle();

        await tester.ensureVisible(find.text('CONNECT'));
        await tester.tap(find.text('CONNECT'));
        await tester.pumpAndSettle();

        expect(capturedProvider, 'none');
        expect(capturedApiKey, '');
      },
    );
  });
}
