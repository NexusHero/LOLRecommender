import 'item.dart';
import 'player_scores.dart';

class Player {
  final String championName;
  final bool isBot;
  final bool isDead;
  final List<Item> items;
  final int level;
  final String position;
  final PlayerScores scores;
  final String summonerName;
  final String team;

  const Player({
    required this.championName,
    required this.isBot,
    required this.isDead,
    required this.items,
    required this.level,
    required this.position,
    required this.scores,
    required this.summonerName,
    required this.team,
  });

  factory Player.fromJson(Map<String, dynamic> json) => Player(
        championName: json['championName'] as String,
        isBot: json['isBot'] as bool,
        isDead: json['isDead'] as bool,
        items: (json['items'] as List<dynamic>)
            .map((e) => Item.fromJson(e as Map<String, dynamic>))
            .toList(),
        level: (json['level'] as num).toInt(),
        position: json['position'] as String,
        scores: PlayerScores.fromJson(json['scores'] as Map<String, dynamic>),
        summonerName: json['summonerName'] as String,
        team: json['team'] as String,
      );
}
