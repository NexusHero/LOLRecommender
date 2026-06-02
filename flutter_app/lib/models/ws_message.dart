import 'game_state.dart';
import 'recommendation.dart';

class WsMessage {
  final String event;
  final int timestamp;
  final ParsedGameState? gameState;
  final ItemRecommendation? recommendation;
  final String? error;

  const WsMessage({
    required this.event,
    required this.timestamp,
    this.gameState,
    this.recommendation,
    this.error,
  });

  factory WsMessage.fromJson(Map<String, dynamic> json) => WsMessage(
        event: json['event'] as String,
        timestamp: (json['timestamp'] as num).toInt(),
        gameState: json['gameState'] != null
            ? ParsedGameState.fromJson(
                json['gameState'] as Map<String, dynamic>)
            : null,
        recommendation: json['recommendation'] != null
            ? ItemRecommendation.fromJson(
                json['recommendation'] as Map<String, dynamic>)
            : null,
        error: json['error'] as String?,
      );
}
