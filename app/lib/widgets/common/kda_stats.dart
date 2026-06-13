import 'package:flutter/material.dart';
import 'package:lol_coach/theme/app_text_styles.dart';

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

class KdaSep extends StatelessWidget {
  const KdaSep({super.key});

  @override
  Widget build(BuildContext context) => const Padding(
        padding: EdgeInsets.symmetric(horizontal: 3),
        child: Text('/', style: AppTextStyles.caption),
      );
}

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
