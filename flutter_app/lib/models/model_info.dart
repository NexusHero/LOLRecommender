class ModelInfo {
  const ModelInfo({required this.id, required this.displayName});

  factory ModelInfo.fromJson(Map<String, dynamic> json) => ModelInfo(
        id: json['id'] as String,
        displayName: json['displayName'] as String? ?? json['id'] as String,
      );

  final String id;
  final String displayName;

  @override
  bool operator ==(Object other) =>
      other is ModelInfo && other.id == id && other.displayName == displayName;

  @override
  int get hashCode => Object.hash(id, displayName);
}
