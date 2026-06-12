class TokenUsage {
  const TokenUsage({
    required this.lastInput,
    required this.lastOutput,
    required this.sessionInput,
    required this.sessionOutput,
  });

  factory TokenUsage.fromJson(Map<String, dynamic> json) => TokenUsage(
        lastInput: (json['lastInput'] as num).toInt(),
        lastOutput: (json['lastOutput'] as num).toInt(),
        sessionInput: (json['sessionInput'] as num).toInt(),
        sessionOutput: (json['sessionOutput'] as num).toInt(),
      );

  final int lastInput;
  final int lastOutput;
  final int sessionInput;
  final int sessionOutput;
}
