import 'package:lol_coach/models/item_priority.dart';

class RecommendedItem {
  const RecommendedItem({
    required this.id,
    required this.name,
    required this.reason,
    required this.priority,
  });

  factory RecommendedItem.fromJson(Map<String, dynamic> json) =>
      RecommendedItem(
        id: (json['id'] as num).toInt(),
        name: json['name'] as String,
        reason: json['reason'] as String,
        priority: ItemPriority.values.byName(json['priority'] as String),
      );
  final int id;
  final String name;
  final String reason;
  final ItemPriority priority;

  bool get isCore => priority == ItemPriority.core;
}
