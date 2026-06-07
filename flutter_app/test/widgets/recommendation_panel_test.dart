import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lol_coach/models/recommendation.dart';
import 'package:lol_coach/widgets/recommendation_panel.dart';

void main() {
  group('RecommendationPanel', () {
    testWidgets(
      'RecommendationPanel_LlmSource_ShowsAiBadgeAndItemDetails',
      (WidgetTester tester) async {
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

        await tester.pumpWidget(
          const MaterialApp(
            home: Scaffold(
              body: RecommendationPanel(recommendation: recommendation),
            ),
          ),
        );

        expect(find.text('RECOMMENDATIONS'), findsOneWidget);
        expect(find.text('AI'), findsOneWidget);
        expect(find.text("Banshee's Veil"), findsOneWidget);
        expect(find.text('CORE'), findsOneWidget);
        expect(find.text('Blocks initial burst combo'), findsOneWidget);
        expect(
          find.text('Claude says this is a good item against high AP burst.'),
          findsOneWidget,
        );
      },
    );

    testWidgets(
      'RecommendationPanel_EmptyHeuristicSource_ShowsAutoBadgeAndReasoning',
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
        expect(
          find.text('Enemy comp is balanced. No specific counter items needed.'),
          findsOneWidget,
        );
      },
    );
  });
}
