import 'package:lol_coach/theme/app_colors.dart';
import 'package:flutter/material.dart' hide Badge;
import '../models/game_state.dart';
import '../models/recommendation.dart';

// ─── Card container ────────────────────────────────────────────────────────────

class GameCard extends StatelessWidget {
  final Widget child;
  final Color borderColor;

  const GameCard({
    super.key,
    required this.child,
    this.borderColor = const AppColors.borderDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const AppColors.surfaceDark,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: borderColor),
      ),
      child: child,
    );
  }
}

// ─── Champion avatar ───────────────────────────────────────────────────────────

class ChampAvatar extends StatelessWidget {
  final String name;
  final bool isDead;
  final double size;

  const ChampAvatar(
      {super.key, required this.name, required this.isDead, this.size = 48});

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
        color: isDead ? const AppColors.blackGrey : _color(name),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
          color:
              isDead ? const AppColors.blackGreyDark : const AppColors.primaryGold,
          width: 1,
        ),
      ),
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: TextStyle(
            color: isDead
                ? const AppColors.textGrey
                : const AppColors.textLightGrey,
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
  final List<Item> items;
  const ItemRow({super.key, required this.items});

  @override
  Widget build(BuildContext context) {
    final sorted = [...items]..sort((a, b) => a.slot.compareTo(b.slot));
    return Wrap(
      spacing: 4,
      runSpacing: 4,
      children: sorted
          .map((item) => Tooltip(
                message: item.displayName,
                child: Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: const AppColors.surfaceMedium,
                    borderRadius: BorderRadius.circular(3),
                    border: Border.all(
                        color: const AppColors.blueBorder, width: 1),
                  ),
                  child: Center(
                    child: Text(
                      item.displayName.isNotEmpty
                          ? item.displayName[0]
                          : '?',
                      style: const TextStyle(
                          color: AppColors.primaryGold,
                          fontSize: 11,
                          fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ))
          .toList(),
    );
  }
}

// ─── Badge ─────────────────────────────────────────────────────────────────────

class Badge extends StatelessWidget {
  final String text;
  final Color bg;
  final Color fg;
  const Badge(this.text, {super.key, required this.bg, required this.fg});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      decoration:
          BoxDecoration(color: bg, borderRadius: BorderRadius.circular(3)),
      child: Text(text,
          style: TextStyle(
              color: fg,
              fontSize: 9,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5)),
    );
  }
}

// ─── KDA number ────────────────────────────────────────────────────────────────

class KdaNum extends StatelessWidget {
  final String text;
  final Color color;
  const KdaNum(this.text, this.color, {super.key});

  @override
  Widget build(BuildContext context) => Text(text,
      style: TextStyle(
          color: color, fontSize: 14, fontWeight: FontWeight.w600));
}

// ─── KDA separator ─────────────────────────────────────────────────────────────

class KdaSep extends StatelessWidget {
  const KdaSep({super.key});

  @override
  Widget build(BuildContext context) => const Padding(
        padding: EdgeInsets.symmetric(horizontal: 3),
        child: Text('/',
            style: TextStyle(color: AppColors.blackGreyDark, fontSize: 14)),
      );
}

// ─── Stat chip ─────────────────────────────────────────────────────────────────

class StatChip extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const StatChip(this.label, this.value, this.color, {super.key});

  @override
  Widget build(BuildContext context) => Column(children: [
        Text(label,
            style: const TextStyle(
                color: AppColors.textMuted,
                fontSize: 9,
                letterSpacing: 0.5)),
        const SizedBox(height: 2),
        Text(value,
            style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w600)),
      ]);
}
