import type { Player, CompProfile, ItemRecommendation, RecommendedItem } from "./types.js";

// Champions die typischerweise AP spielen (vereinfachte Liste)
const AP_CHAMPIONS = new Set([
  "Ahri", "Annie", "Azir", "Brand", "Cassiopeia", "Ekko", "Elise", "Evelynn",
  "Fiddlesticks", "Fizz", "Heimerdinger", "Karthus", "Kassadin", "Katarina",
  "Kennen", "LeBlanc", "Lissandra", "Lux", "Malzahar", "Morgana", "Nami",
  "Nidalee", "Orianna", "Rumble", "Ryze", "Seraphine", "Singed", "Swain",
  "Syndra", "Taliyah", "Twisted Fate", "Veigar", "Vel'Koz", "Viktor",
  "Vladimir", "Xerath", "Zoe", "Zyra", "Soraka", "Zilean",
]);

const CC_CHAMPIONS = new Set([
  "Amumu", "Blitzcrank", "Galio", "Leona", "Lissandra", "Malphite",
  "Nautilus", "Sejuani", "Skarner", "Thresh", "Zac",
]);

const HEALER_CHAMPIONS = new Set([
  "Aatrox", "Dr. Mundo", "Fiora", "Nasus", "Olaf", "Soraka", "Swain",
  "Vladimir", "Warwick", "Yuumi", "Sylas",
]);

const ITEM_NAMES: Record<number, string> = {
  3123: "Executioner's Calling",
  3033: "Mortal Reminder",
  3076: "Bramble Vest",
  3165: "Morellonomicon",
  3156: "Maw of Malmortius",
  3111: "Mercury's Treads",
  3140: "Quicksilver Sash",
  3102: "Banshee's Veil",
  3036: "Lord Dominik's Regards",
  3143: "Randuin's Omen",
  3110: "Frozen Heart",
  3082: "Warden's Mail",
};

export function buildCompProfile(enemies: Player[]): CompProfile {
  let apCount = 0;
  let ccCount = 0;
  let healCount = 0;

  for (const enemy of enemies) {
    if (AP_CHAMPIONS.has(enemy.championName)) apCount++;
    if (CC_CHAMPIONS.has(enemy.championName)) ccCount++;
    if (HEALER_CHAMPIONS.has(enemy.championName)) healCount++;
  }

  const total = enemies.length || 1;

  return {
    apRatio: apCount / total,
    adRatio: 1 - apCount / total,
    ccScore: ccCount,
    healScore: healCount,
  };
}

export function getHeuristicRecommendations(
  profile: CompProfile,
  myChampion: string
): ItemRecommendation {
  const recommended: RecommendedItem[] = [];

  if (profile.healScore >= 2) {
    const id = myChampion && AP_CHAMPIONS.has(myChampion) ? 3165 : 3033;
    recommended.push({
      id,
      name: ITEM_NAMES[id] ?? "Grievous Wounds Item",
      reason: `${profile.healScore} healers on the enemy team`,
      priority: "core",
    });
  }

  if (profile.apRatio >= 0.6) {
    recommended.push({
      id: 3102,
      name: "Banshee's Veil",
      reason: `${Math.round(profile.apRatio * 100)}% AP-heavy composition`,
      priority: "core",
    });
  }

  if (profile.ccScore >= 3) {
    recommended.push({
      id: 3140,
      name: "Quicksilver Sash",
      reason: `High CC score (${profile.ccScore} CC champions)`,
      priority: "situational",
    });
  }

  if (profile.adRatio >= 0.7) {
    recommended.push({
      id: 3143,
      name: "Randuin's Omen",
      reason: "Enemies are primarily AD",
      priority: "situational",
    });
  }

  return {
    items: recommended,
    reasoning: formatReasoning(profile),
    source: "heuristic",
  };
}

function formatReasoning(profile: CompProfile): string {
  const parts: string[] = [];

  if (profile.apRatio >= 0.6) parts.push(`AP-heavy (${Math.round(profile.apRatio * 100)}%)`);
  else if (profile.adRatio >= 0.6) parts.push(`AD-heavy (${Math.round(profile.adRatio * 100)}%)`);
  else parts.push("Mixed damage");

  if (profile.ccScore >= 2) parts.push(`${profile.ccScore}x CC`);
  if (profile.healScore >= 1) parts.push(`${profile.healScore}x healing`);

  return `Enemy comp: ${parts.join(", ")}`;
}
