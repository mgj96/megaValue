export type CostStats = {
  p10: number;
  p50: number;
  p90: number;
  mean: number;
};

/** HANDOFF §7: 3-구간 선형 보간 */
export function getCostByLuck(stats: CostStats, luck: number): number {
  const { p10, p50, p90 } = stats;
  if (luck <= 10) return p10;
  if (luck <= 50) return Math.round(p10 + ((luck - 10) / 40) * (p50 - p10));
  if (luck <= 90) return Math.round(p50 + ((luck - 50) / 40) * (p90 - p50));
  return p90;
}

/** HANDOFF §8: 효율 등급 */
export function getEfficiencyGrade(
  p10: number,
  p90: number,
): "S" | "A" | "B" | "C" {
  if (p90 <= 0) return "C";
  const ratio = p10 / p90;
  if (ratio > 0.5) return "S";
  if (ratio > 0.35) return "A";
  if (ratio > 0.2) return "B";
  return "C";
}

/** HANDOFF §7: 행운도 라벨 */
export function luckLabel(pct: number): string {
  if (pct <= 15) return "극행운 🍀";
  if (pct <= 40) return "행운 ✨";
  if (pct <= 60) return "보통 😐";
  if (pct <= 80) return "불운 😢";
  return "극불운 🔥";
}

export const gradeColorClass: Record<string, string> = {
  S: "text-amber-500",
  A: "text-emerald-500",
  B: "text-sky-500",
  C: "text-default-400",
};
