import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lol_coach/widgets/connection_form.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('ConnectionForm', () {
    testWidgets(
      'ConnectionForm_LlmProviderSelected_ShowsApiKeyField',
      (WidgetTester tester) async {
        String? capturedProvider;
        String? capturedApiKey;

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: ConnectionForm(
                onConnect: (host, port, summonerName, providerType, apiKey) {
                  capturedProvider = providerType;
                  capturedApiKey = apiKey;
                },
              ),
            ),
          ),
        );
        await tester.pumpAndSettle();

        expect(find.text('None (Heuristic only)'), findsOneWidget);
        expect(find.text('Claude'), findsOneWidget);
        expect(find.text('OpenAI'), findsOneWidget);
        expect(find.text('Gemini'), findsOneWidget);
        expect(find.byType(TextField), findsNWidgets(3)); // Host, Port, Summoner
        expect(find.text('none API Key'), findsNothing);

        await tester.tap(find.text('Claude'));
        await tester.pumpAndSettle();

        expect(find.byType(TextField), findsNWidgets(4));
        expect(find.text('claude API Key'), findsOneWidget);

        await tester.enterText(
          find.widgetWithText(TextField, 'claude API Key'),
          'test-claude-key',
        );
        await tester.ensureVisible(find.text('CONNECT'));
        await tester.tap(find.text('CONNECT'));
        await tester.pumpAndSettle();

        expect(capturedProvider, 'claude');
        expect(capturedApiKey, 'test-claude-key');
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
                onConnect: (host, port, summonerName, providerType, apiKey) {
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
