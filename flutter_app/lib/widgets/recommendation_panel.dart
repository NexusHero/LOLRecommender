import 'package:flutter/material.dart';
import '../models/recommendation.dart';
import 'shared_widgets.dart';

class RecommendationPanel extends StatelessWidget {
  final ItemRecommendation recommendation;
  const RecommendationPanel({super.key, required this.recommendation});

  @override
  Widget build(BuildContext context) {
    return GameCard(
      borderColor:
          recommendation.isLlm ? const Color(0xFF7B68EE) : const Color(0xFF1E3A5F),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.lightbulb_outline,
                size: 15, color: Color(0xFFC89B3C)),
            const SizedBox(width: 6),
            const Text(
              'RECOMMENDATIONS',
              style: TextStyle(
                color: Color(0xFFC89B3C),
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.5,
              ),
            ),
            const Spacer(),
            Badge(
              recommendation.isLlm ? 'AI' : 'AUTO',
              bg: recommendation.isLlm
                  ? const Color(0xFF2A1A3A)
                  : const Color(0xFF0D2040),
              fg: recommendation.isLlm
                  ? const Color(0xFF9B59B6)
                  : const Color(0xFF0BC4E3),
            ),
          ]),
          const SizedBox(height: 10),
          if (recommendation.items.isEmpty)
            const Text(
              'No specific counter items needed.',
              style: TextStyle(color: Color(0xFF7A7A7A), fontSize: 13),
            )
          else
            ...recommendation.items.map((item) => _RecItemTile(item: item)),
          const Divider(color: Color(0xFF1E3A5F), height: 16),
          Text(
            recommendation.reasoning,
            style: const TextStyle(color: Color(0xFF7A7A7A), fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _RecItemTile extends StatelessWidget {
  final RecommendedItem item;
  const _RecItemTile({required this.item});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: const Color(0xFF091428),
            borderRadius: BorderRadius.circular(4),
            border: Border.all(
              color: item.isCore
                  ? const Color(0xFFC89B3C)
                  : const Color(0xFF2A4A6A),
              width: 1.5,
            ),
          ),
          child: Center(
            child: Text(
              '${item.id % 1000}',
              style: const TextStyle(
                  color: Color(0xFFC89B3C),
                  fontSize: 9,
                  fontWeight: FontWeight.bold),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Flexible(
                  child: Text(
                    item.name,
                    style: const TextStyle(
                      color: Color(0xFFCDC8C2),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Badge(
                  item.isCore ? 'CORE' : 'SITUATIONAL',
                  bg: item.isCore
                      ? const Color(0xFF1A1200)
                      : const Color(0xFF0A1020),
                  fg: item.isCore
                      ? const Color(0xFFC89B3C)
                      : const Color(0xFF5A7A9A),
                ),
              ]),
              Text(item.reason,
                  style: const TextStyle(
                      color: Color(0xFF7A7A7A), fontSize: 11)),
            ],
          ),
        ),
      ]),
    );
  }
}
