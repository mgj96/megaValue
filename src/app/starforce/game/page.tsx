import type { Metadata } from "next";

import type { GameData } from "~/game";
import { loadStarforceRules } from "~/rules";
import { compareRecovery, evaluateAttempt, getCosts } from "~/starforce";

import { GameScreen } from "./GameScreen";

export const metadata: Metadata = { title: "스타포스 키우기 | 메이플 장비 진단" };

const LEVEL = 200;
/** 게임용 가정값(시세 아님). */
const SPARE_COST = 5e8;

export default function GamePage() {
  const rules = loadStarforceRules();
  const maxStar = rules.maxStarOf(LEVEL) ?? 0;
  const common = { equipLevel: LEVEL, table: rules.table, spareCost: SPARE_COST, restoreOf: rules.restoreOf };

  const evaluations = Array.from({ length: maxStar }, (_, star) => evaluateAttempt({ ...common, star }));
  const data: GameData = {
    level: LEVEL,
    spareCost: SPARE_COST,
    maxStar,
    table: rules.table,
    costs: getCosts(LEVEL),
    values: [...evaluations.map((e) => e.value), evaluations[maxStar - 1].nextValue],
    recovery: Object.fromEntries(
      Array.from({ length: maxStar }, (_, star) => [star, compareRecovery({ ...common, star })]),
    ),
    restore: Object.fromEntries(
      Array.from({ length: 8 }, (_, i) => [15 + i, rules.restoreOf(LEVEL, 15 + i)]),
    ),
  };

  return <GameScreen data={data} />;
}
