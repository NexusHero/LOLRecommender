import 'recommendation_source.dart';
import 'recommended_item.dart';

class ItemRecommendation {
  final List<RecommendedItem> items;
  final String reasoning;
  final RecommendationSource source;

  const ItemRecommendation({
    required this.items,
    required this.reasoning,
    required this.source,
  });

  factory ItemRecommendation.fromJson(Map<String, dynamic> json) =>
      ItemRecommendation(
        items: (json['items'] as List<dynamic>)
            .map((e) => RecommendedItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        reasoning: json['reasoning'] as String,
        source: RecommendationSource.values.byName(json['source'] as String),
      );

  bool get isLlm => source == RecommendationSource.llm;
}
