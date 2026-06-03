import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lol_coach/models/recommendation.dart';
import 'package:lol_coach/widgets/recommendation_panel.dart';

void main() {
  testWidgets('RecommendationPanel renders correctly for LLM source',
      (WidgetTester tester) async {
    // 1. Arrange: Test-Daten vorbereiten
    const recommendation = ItemRecommendation(
      source: RecommendationSource.llm,
      reasoning: 'Claude says this is a good item against high AP burst.',
      items: [
        RecommendedItem(
          id: 3102,
          name: "Banshee's Veil",
          reason: 'Blocks initial burst combo',
          priority: ItemPriority.core,
        ),
      ],
    );

    // 2. Act: Widget rendern (muss in einen MaterialApp gewrappt werden wegen Theme/Directionality)
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: RecommendationPanel(recommendation: recommendation),
        ),
      ),
    );

    // 3. Assert: Überprüfen ob die UI-Elemente da sind
    // Check title and AI badge
    expect(find.text('RECOMMENDATIONS'), findsOneWidget);
    expect(find.text('AI'), findsOneWidget);
    
    // Check item details
    expect(find.text("Banshee's Veil"), findsOneWidget);
    expect(find.text('CORE'), findsOneWidget);
    expect(find.text('Blocks initial burst combo'), findsOneWidget);
    
    // Check reasoning
    expect(find.text('Claude says this is a good item against high AP burst.'),
        findsOneWidget);
  });

  testWidgets('RecommendationPanel renders correctly for empty heuristic source',
      (WidgetTester tester) async {
    const recommendation = ItemRecommendation(
      source: RecommendationSource.heuristic,
      reasoning: 'Enemy comp is balanced. No specific counter items needed.',
      items: [],
    );

    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: RecommendationPanel(recommendation: recommendation),
        ),
      ),
    );

    expect(find.text('AUTO'), findsOneWidget);
    expect(find.text('No specific counter items needed.'), findsOneWidget);
    expect(find.text('Enemy comp is balanced. No specific counter items needed.'), findsOneWidget);
  });
}
