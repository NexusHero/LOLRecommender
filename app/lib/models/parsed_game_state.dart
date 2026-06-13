import 'package:lol_coach/models/active_player.dart';
import 'package:lol_coach/models/player.dart';

class ParsedGameState {
  const ParsedGameState({
    required this.gameTime,
    required this.gameMode,
    required this.localPlayer,
    required this.allies,
    required this.enemies,
    required this.activePlayer,
  });

  factory ParsedGameState.fromJson(Map<String, dynamic> json) =>
      ParsedGameState(
        gameTime: (json['gameTime'] as num).toDouble(),
        gameMode: json['gameMode'] as String,
        localPlayer:
            Player.fromJson(json['localPlayer'] as Map<String, dynamic>),
        allies: (json['allies'] as List<dynamic>)
            .map((e) => Player.fromJson(e as Map<String, dynamic>))
            .toList(),
        enemies: (json['enemies'] as List<dynamic>)
            .map((e) => Player.fromJson(e as Map<String, dynamic>))
            .toList(),
        activePlayer:
            ActivePlayer.fromJson(json['activePlayer'] as Map<String, dynamic>),
      );
  final double gameTime;
  final String gameMode;
  final Player localPlayer;
  final List<Player> allies;
  final List<Player> enemies;
  final ActivePlayer activePlayer;
}
