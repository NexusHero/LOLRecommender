class ActivePlayerStats {
  final double abilityPower;
  final double armor;
  final double attackDamage;
  final double critChance;
  final double healthMax;
  final double magicResist;

  const ActivePlayerStats({
    required this.abilityPower,
    required this.armor,
    required this.attackDamage,
    required this.critChance,
    required this.healthMax,
    required this.magicResist,
  });

  factory ActivePlayerStats.fromJson(Map<String, dynamic> json) =>
      ActivePlayerStats(
        abilityPower: (json['abilityPower'] as num).toDouble(),
        armor: (json['armor'] as num).toDouble(),
        attackDamage: (json['attackDamage'] as num).toDouble(),
        critChance: (json['critChance'] as num).toDouble(),
        healthMax: (json['healthMax'] as num).toDouble(),
        magicResist: (json['magicResist'] as num).toDouble(),
      );
}
