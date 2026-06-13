import 'package:flutter/material.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/utils/ddragon.dart';

class ItemSlot extends StatelessWidget {
  const ItemSlot({
    required this.itemId,
    required this.displayName,
    super.key,
    this.size = 34,
    this.borderColor = AppColors.borderAccent,
  });
  final int itemId;
  final String displayName;
  final double size;
  final Color borderColor;

  Widget _placeholder() {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.surfaceMedium,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: borderColor, width: 1.5),
      ),
      child: Center(
        child: Text(
          displayName.isNotEmpty ? displayName[0] : '?',
          style: const TextStyle(
            color: AppColors.gold,
            fontSize: 9,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: displayName,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: Container(
          decoration: BoxDecoration(
            border: Border.all(color: borderColor, width: 1.5),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Image.network(
            itemImageUrl(itemId),
            width: size,
            height: size,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _placeholder(),
            loadingBuilder: (_, child, loading) =>
                loading == null ? child : _placeholder(),
          ),
        ),
      ),
    );
  }
}
