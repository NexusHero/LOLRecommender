import 'package:flutter_test/flutter_test.dart';
import 'package:lol_coach/models/item_recommendation.dart';
import 'package:lol_coach/models/recommendation_source.dart';

void main() {
  group('ItemRecommendation', () {
    test('fromJson parses heuristic source', () {
      final json = {
        'items': [],
        'reasoning': 'Mixed Damage',
        'source': 'heuristic',
      };

      final rec = ItemRecommendation.fromJson(json);

      expect(rec.source, RecommendationSource.heuristic);
      expect(rec.isLlm, isFalse);
      expect(rec.items, isEmpty);
    });

    test('fromJson parses llm source', () {
      final json = {
        'items': [],
        'reasoning': 'AI reasoning',
        'source': 'llm',
      };

      final rec = ItemRecommendation.fromJson(json);

      expect(rec.source, RecommendationSource.llm);
      expect(rec.isLlm, isTrue);
    });

    test('fromJson parses nested items list', () {
      final json = {
        'items': [
          {
            'id': 3033,
            'name': 'Mortal Reminder',
            'reason': 'vs healers',
            'priority': 'core',
          },
          {
            'id': 3140,
            'name': 'Quicksilver Sash',
            'reason': 'vs CC',
            'priority': 'situational',
          },
        ],
        'reasoning': 'test reasoning',
        'source': 'heuristic',
      };

      final rec = ItemRecommendation.fromJson(json);

      expect(rec.items, hasLength(2));
      expect(rec.items[0].id, 3033);
      expect(rec.items[1].id, 3140);
    });

    test('reasoning is preserved', () {
      final json = {
        'items': [],
        'reasoning': 'AP-lastig (80%), 3x CC',
        'source': 'heuristic',
      };

      final rec = ItemRecommendation.fromJson(json);

      expect(rec.reasoning, 'AP-lastig (80%), 3x CC');
    });
  });
}
