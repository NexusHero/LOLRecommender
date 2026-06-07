import 'package:lol_coach/models/recommendation_source.dart';
import 'package:lol_coach/models/recommended_item.dart';
import 'package:lol_coach/models/strategy.dart';

class ItemRecommendation {
  const ItemRecommendation({
    required this.items,
    required this.reasoning,
    required this.source,
    required this.provider,
    this.strategy,
  });

  factory ItemRecommendation.fromJson(Map<String, dynamic> json) =>
      ItemRecommendation(
        items: (json['items'] as List<dynamic>)
            .map((e) => RecommendedItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        reasoning: json['reasoning'] as String,
        source: RecommendationSource.values.byName(json['source'] as String),
        provider: (json['provider'] as String?) ?? 'heuristic',
        strategy: json['strategy'] != null
            ? Strategy.fromJson(json['strategy'] as Map<String, dynamic>)
            : null,
      );

  final List<RecommendedItem> items;
  final String reasoning;
  final RecommendationSource source;
  final String provider;
  final Strategy? strategy;

  bool get isLlm => source == RecommendationSource.llm;
}
