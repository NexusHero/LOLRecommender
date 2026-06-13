class Item {
  const Item({
    required this.canUse,
    required this.consumable,
    required this.count,
    required this.displayName,
    required this.itemID,
    required this.price,
    required this.slot,
  });

  factory Item.fromJson(Map<String, dynamic> json) => Item(
        canUse: json['canUse'] as bool,
        consumable: json['consumable'] as bool,
        count: (json['count'] as num).toInt(),
        displayName: json['displayName'] as String,
        itemID: (json['itemID'] as num).toInt(),
        price: (json['price'] as num).toInt(),
        slot: (json['slot'] as num).toInt(),
      );
  final bool canUse;
  final bool consumable;
  final int count;
  final String displayName;
  final int itemID;
  final int price;
  final int slot;
}
