// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart';
import 'package:lol_coach/models/game_state.dart';
import 'package:lol_coach/theme/app_colors.dart';
import 'package:lol_coach/theme/app_text_styles.dart';
import 'package:lol_coach/utils/ddragon.dart';

// ─── Card container ────────────────────────────────────────────────────────────

class GameCard extends StatelessWidget {
  const GameCard({
    required this.child,
    super.key,
    this.borderColor = AppColors.border,
  });
  final Widget child;
  final Color borderColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceDark,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: borderColor),
      ),
      child: child,
    );
  }
}

// ─── Champion avatar ───────────────────────────────────────────────────────────

class ChampAvatar extends StatelessWidget {
  const ChampAvatar({
    required this.name,
    required this.isDead,
    super.key,
    this.size = 48,
  });
  final String name;
  final bool isDead;
  final double size;

  Color _placeholderColor(String n) {
    final h = n.codeUnits.fold(0, (a, b) => a + b);
    return HSLColor.fromAHSL(1, ((h * 37) % 360).toDouble(), 0.5, 0.25)
        .toColor();
  }

  Widget _placeholder() {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: isDead ? const Color(0xFF2A2A2A) : _placeholderColor(name),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isDead ? const Color(0xFF444444) : AppColors.gold,
        ),
      ),
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: TextStyle(
            color: isDead ? AppColors.textSecondary : AppColors.textPrimary,
            fontSize: size * 0.42,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (name.isEmpty) return _placeholder();

    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: ColorFiltered(
        colorFilter: isDead
            ? const ColorFilter.matrix([
                0.21, 0.72, 0.07, 0, 0,
                0.21, 0.72, 0.07, 0, 0,
                0.21, 0.72, 0.07, 0, 0,
                0,    0,    0,    1, 0,
              ])
            : const ColorFilter.mode(Colors.transparent, BlendMode.dst),
        child: Image.network(
          champImageUrl(name),
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _placeholder(),
          loadingBuilder: (_, child, loading) =>
              loading == null ? child : _placeholder(),
        ),
      ),
    );
  }
}

// ─── Item slot ─────────────────────────────────────────────────────────────────

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

// ─── Item row ──────────────────────────────────────────────────────────────────

class ItemRow extends StatelessWidget {
  const ItemRow({required this.items, super.key});
  final List<Item> items;

  @override
  Widget build(BuildContext context) {
    final sorted = [...items]..sort((a, b) => a.slot.compareTo(b.slot));
    return Wrap(
      spacing: 4,
      runSpacing: 4,
      children: sorted
          .map(
            (item) => ItemSlot(
              itemId: item.itemID,
              displayName: item.displayName,
              size: 30,
            ),
          )
          .toList(),
    );
  }
}

// ─── Badge ─────────────────────────────────────────────────────────────────────

class Badge extends StatelessWidget {
  const Badge(this.text, {required this.bg, required this.fg, super.key});
  final String text;
  final Color bg;
  final Color fg;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      decoration:
          BoxDecoration(color: bg, borderRadius: BorderRadius.circular(4)),
      child: Text(
        text,
        style: TextStyle(
          color: fg,
          fontSize: 9,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

// ─── KDA number ────────────────────────────────────────────────────────────────

class KdaNum extends StatelessWidget {
  const KdaNum(this.text, this.color, {super.key});
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) => Text(
        text,
        style: AppTextStyles.bodyBold.copyWith(color: color),
      );
}

// ─── KDA separator ─────────────────────────────────────────────────────────────

class KdaSep extends StatelessWidget {
  const KdaSep({super.key});

  @override
  Widget build(BuildContext context) => const Padding(
        padding: EdgeInsets.symmetric(horizontal: 3),
        child: Text('/', style: AppTextStyles.caption),
      );
}

// ─── Stat chip ─────────────────────────────────────────────────────────────────

class StatChip extends StatelessWidget {
  const StatChip(this.label, this.value, this.color, {super.key});
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) => Column(
        children: [
          Text(label, style: AppTextStyles.label),
          const SizedBox(height: 2),
          Text(
            value,
            style: AppTextStyles.captionBold.copyWith(color: color),
          ),
        ],
      );
}
