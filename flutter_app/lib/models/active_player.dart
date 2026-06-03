import 'package:lol_coach/models/active_player_stats.dart';

class ActivePlayer {
  const ActivePlayer({
    required this.championStats,
    required this.currentGold,
    required this.level,
    required this.summonerName,
  });

  factory ActivePlayer.fromJson(Map<String, dynamic> json) => ActivePlayer(
        championStats: ActivePlayerStats.fromJson(
          json['championStats'] as Map<String, dynamic>,
        ),
        currentGold: (json['currentGold'] as num).toDouble(),
        level: (json['level'] as num).toInt(),
        summonerName: json['summonerName'] as String,
      );
  final ActivePlayerStats championStats;
  final double currentGold;
  final int level;
  final String summonerName;
}
