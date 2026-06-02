import 'package:flutter_test/flutter_test.dart';
import 'package:lol_coach/models/recommended_item.dart';
import 'package:lol_coach/models/item_priority.dart';

void main() {
  group('RecommendedItem', () {
    test('fromJson parses core item correctly', () {
      final json = {
        'id': 3033,
        'name': 'Mortal Reminder',
        'reason': 'vs healers',
        'priority': 'core',
      };

      final item = RecommendedItem.fromJson(json);

      expect(item.id, 3033);
      expect(item.name, 'Mortal Reminder');
      expect(item.reason, 'vs healers');
      expect(item.priority, ItemPriority.core);
      expect(item.isCore, isTrue);
    });

    test('fromJson parses situational item correctly', () {
      final json = {
        'id': 3140,
        'name': 'Quicksilver Sash',
        'reason': 'vs CC',
        'priority': 'situational',
      };

      final item = RecommendedItem.fromJson(json);

      expect(item.priority, ItemPriority.situational);
      expect(item.isCore, isFalse);
    });

    test('fromJson throws on unknown priority', () {
      final json = {
        'id': 1,
        'name': 'Test',
        'reason': 'test',
        'priority': 'unknown',
      };

      expect(() => RecommendedItem.fromJson(json), throwsArgumentError);
    });
  });
}
