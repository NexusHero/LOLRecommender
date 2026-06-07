enum WinCondition { early, mid, late }

class Strategy {
  const Strategy({
    required this.winCondition,
    required this.summary,
    required this.immediateAction,
    required this.lateGamePlan,
  });

  factory Strategy.fromJson(Map<String, dynamic> json) => Strategy(
        winCondition: WinCondition.values.byName(json['winCondition'] as String),
        summary: json['summary'] as String,
        immediateAction: json['immediateAction'] as String,
        lateGamePlan: json['lateGamePlan'] as String,
      );

  final WinCondition winCondition;
  final String summary;
  final String immediateAction;
  final String lateGamePlan;
}
