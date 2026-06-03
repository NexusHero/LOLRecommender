import 'package:flutter/material.dart' hide Badge;
import 'package:lol_coach/models/game_state.dart';
import 'package:lol_coach/theme/app_colors.dart';

// ─── Card container ────────────────────────────────────────────────────────────

class GameCard extends StatelessWidget {
  const GameCard({
    required this.child,
    super.key,
    this.borderColor = AppColors.borderDark,
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
        borderRadius: BorderRadius.circular(6),
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

  Color _color(String n) {
    final h = n.codeUnits.fold(0, (a, b) => a + b);
    return HSLColor.fromAHSL(1, ((h * 37) % 360).toDouble(), 0.55, 0.28)
        .toColor();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: isDead ? AppColors.blackGrey : _color(name),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
          color: isDead ? AppColors.blackGreyDark : AppColors.primaryGold,
        ),
      ),
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: TextStyle(
            color: isDead ? AppColors.textGrey : AppColors.textLightGrey,
            fontSize: size * 0.42,
            fontWeight: FontWeight.bold,
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
            (item) => Tooltip(
              message: item.displayName,
              child: Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: AppColors.surfaceMedium,
                  borderRadius: BorderRadius.circular(3),
                  border: Border.all(
                    color: AppColors.blueBorder,
                  ),
                ),
                child: Center(
                  child: Text(
                    item.displayName.isNotEmpty ? item.displayName[0] : '?',
                    style: const TextStyle(
                      color: AppColors.primaryGold,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
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
          BoxDecoration(color: bg, borderRadius: BorderRadius.circular(3)),
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
        style: TextStyle(
          color: color,
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
      );
}

// ─── KDA separator ─────────────────────────────────────────────────────────────

class KdaSep extends StatelessWidget {
  const KdaSep({super.key});

  @override
  Widget build(BuildContext context) => const Padding(
        padding: EdgeInsets.symmetric(horizontal: 3),
        child: Text(
          '/',
          style: TextStyle(color: AppColors.blackGreyDark, fontSize: 14),
        ),
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
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 9,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      );
}
