import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lol_coach/widgets/connection_form.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets(
    'ConnectionForm shows API key field when LLM provider selected',
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

    // Verify radio buttons exist
    expect(find.text('None (Heuristic only)'), findsOneWidget);
    expect(find.text('Claude'), findsOneWidget);
    expect(find.text('OpenAI'), findsOneWidget);
    expect(find.text('Gemini'), findsOneWidget);

    // API key field should not be visible initially (because "none" is default)
    expect(find.byType(TextField), findsNWidgets(3)); // Host, Port, Summoner
    expect(find.text('none API Key'), findsNothing);

    // Select Claude
    await tester.tap(find.text('Claude'));
    await tester.pumpAndSettle();

    // Now 4 TextFields should be visible
    expect(find.byType(TextField), findsNWidgets(4));
    expect(find.text('claude API Key'), findsOneWidget);

    // Enter API key
    await tester.enterText(
      find.widgetWithText(TextField, 'claude API Key'),
      'test-claude-key',
    );
    
    // Tap connect
    await tester.ensureVisible(find.text('CONNECT'));
    await tester.tap(find.text('CONNECT'));
    await tester.pumpAndSettle();

    expect(capturedProvider, 'claude');
    expect(capturedApiKey, 'test-claude-key');
  });
  
  testWidgets(
    'ConnectionForm works with none provider',
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

    // Tap connect directly
    await tester.ensureVisible(find.text('CONNECT'));
    await tester.tap(find.text('CONNECT'));
    await tester.pumpAndSettle();

    expect(capturedProvider, 'none');
    expect(capturedApiKey, '');
  });
}
