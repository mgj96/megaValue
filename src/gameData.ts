import type { GameData } from "./game";
import { loadStarforceRules } from "./rules";
import { compareRecovery, evaluateAttempt, getCosts } from "./starforce";

/** 게임용 가정값(시세 아님). 장비를 사는 가격이자 대체 장비 1개 가격. */
export const SPARE_COST = 5e8;

/** 착용 레벨 하나에 대한 게임 데이터. 최대 성 규칙 구간 밖이면 null. */
export const buildGameData = (level: number): GameData | null => {
  const rules = loadStarforceRules();
  const maxStar = rules.maxStarOf(level);
  if (maxStar === null) return null;

  const common = {
    equipLevel: level,
    table: rules.table,
    spareCost: SPARE_COST,
    restoreOf: rules.restoreOf,
  };
  const evaluations = Array.from({ length: maxStar }, (_, star) => evaluateAttempt({ ...common, star }));

  return {
    level,
    spareCost: SPARE_COST,
    maxStar,
    table: rules.table,
    costs: getCosts(level),
    values: [...evaluations.map((e) => e.value), evaluations[maxStar - 1].nextValue],
    recovery: Object.fromEntries(
      Array.from({ length: maxStar }, (_, star) => [star, compareRecovery({ ...common, star })]),
    ),
    restore: Object.fromEntries(
      Array.from({ length: 8 }, (_, i) => [15 + i, rules.restoreOf(level, 15 + i)]),
    ),
  };
};
