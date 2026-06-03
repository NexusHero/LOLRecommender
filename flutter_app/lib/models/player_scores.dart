class PlayerScores {
  const PlayerScores({
    required this.assists,
    required this.creepScore,
    required this.deaths,
    required this.kills,
    required this.wardScore,
  });

  factory PlayerScores.fromJson(Map<String, dynamic> json) => PlayerScores(
        assists: (json['assists'] as num).toInt(),
        creepScore: (json['creepScore'] as num).toInt(),
        deaths: (json['deaths'] as num).toInt(),
        kills: (json['kills'] as num).toInt(),
        wardScore: (json['wardScore'] as num?)?.toDouble() ?? 0.0,
      );
  final int assists;
  final int creepScore;
  final int deaths;
  final int kills;
  final double wardScore;
}
