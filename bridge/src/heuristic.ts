import type { Player, CompProfile, ItemRecommendation, RecommendedItem, Strategy, ParsedGameState } from "./types.js";
import { getGamePhase } from "./stateMinifier.js";
import championsData from "./data/champions.json";
import itemsData from "./data/items.json";

const AP_CHAMPIONS = new Set<string>(championsData.ap);
const CC_CHAMPIONS = new Set<string>(championsData.cc);
const HEALER_CHAMPIONS = new Set<string>(championsData.healers);
const ITEM_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(itemsData).map(([k, v]) => [Number(k), v]),
);

const {
  healScoreForGW,
  apRatioForBanshee,
  ccScoreForQSS,
  adRatioForRanduin,
} = championsData.thresholds;

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

export function buildHeuristicStrategy(
  state: ParsedGameState,
  profile: CompProfile,
  myChampion: string,
): Strategy {
  const phase = getGamePhase(state.gameTime);
  const me = state.localPlayer.scores;
  const myKdaScore = me.kills + me.assists - me.deaths;
  const isAhead = myKdaScore > 0 && state.activePlayer.currentGold > 1500;
  const isApChamp = AP_CHAMPIONS.has(myChampion);
  const enemyHeavyCC = profile.ccScore >= 3;

  const winCondition: Strategy["winCondition"] = isAhead ? "early" : isApChamp ? "late" : "mid";

  let summary: string;
  let immediateAction: string;
  let lateGamePlan: string;

  if (isAhead) {
    summary = "You are ahead — close out the game before enemies can scale.";
    immediateAction = "Push towers, take Dragons, and force fights you can win.";
    lateGamePlan = "Group as 5 for Baron and end the game through mid lane.";
  } else if (phase === "early") {
    summary = "Focus on farming safely — your power spike comes later.";
    immediateAction = "Farm under tower if needed and avoid risky all-ins.";
    lateGamePlan = "Once your core items are complete, you win most fights.";
  } else if (enemyHeavyCC) {
    summary = "Avoid extended teamfights — the enemy CC can shut you down.";
    immediateAction = "Pick off isolated targets and avoid clumping with your team.";
    lateGamePlan = "Use your completed build to split-push or flank in teamfights.";
  } else {
    summary = `Scale into your ${winCondition}-game power spike and then take over.`;
    immediateAction = "Secure Drake and farm efficiently between skirmishes.";
    lateGamePlan = "With your full build you outscale — force Baron fights to finish.";
  }

  return { winCondition, summary, immediateAction, lateGamePlan };
}

export function getHeuristicRecommendations(
  profile: CompProfile,
  myChampion: string,
  state: ParsedGameState,
): ItemRecommendation {
  const recommended: RecommendedItem[] = [];

  if (profile.healScore >= healScoreForGW) {
    const id = myChampion && AP_CHAMPIONS.has(myChampion) ? 3165 : 3033;
    recommended.push({
      id,
      name: ITEM_NAMES[id] ?? "Grievous Wounds Item",
      reason: `${profile.healScore} healers on the enemy team`,
      priority: "core",
    });
  }

  if (profile.apRatio >= apRatioForBanshee) {
    recommended.push({
      id: 3102,
      name: "Banshee's Veil",
      reason: `${Math.round(profile.apRatio * 100)}% AP-heavy composition`,
      priority: "core",
    });
  }

  if (profile.ccScore >= ccScoreForQSS) {
    recommended.push({
      id: 3140,
      name: "Quicksilver Sash",
      reason: `High CC score (${profile.ccScore} CC champions)`,
      priority: "situational",
    });
  }

  if (profile.adRatio >= adRatioForRanduin) {
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
    strategy: buildHeuristicStrategy(state, profile, myChampion),
  };
}

function formatReasoning(profile: CompProfile): string {
  const parts: string[] = [];

  if (profile.apRatio >= apRatioForBanshee) parts.push(`AP-heavy (${Math.round(profile.apRatio * 100)}%)`);
  else if (profile.adRatio >= 0.6) parts.push(`AD-heavy (${Math.round(profile.adRatio * 100)}%)`);
  else parts.push("Mixed damage");

  if (profile.ccScore >= 2) parts.push(`${profile.ccScore}x CC`);
  if (profile.healScore >= 1) parts.push(`${profile.healScore}x healing`);

  return `Enemy comp: ${parts.join(", ")}`;
}
