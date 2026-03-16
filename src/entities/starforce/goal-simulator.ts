import type {
  GoalSimulationDistribution,
  GoalSimulationSummary,
} from "~/entities/game/goal-simulation";

import type { Event } from "./constants";
import {
  getCosts as defaultGetCosts,
  getProbTable as defaultGetProbTable,
  PROB_TABLE_DESTROY_INDEX,
  PROB_TABLE_MAINTAIN_INDEX,
  PROB_TABLE_SUCCESS_INDEX,
} from "./utils";

type GetProbTable = typeof defaultGetProbTable;
type GetCosts = typeof defaultGetCosts;

export interface SimulateStarforceGoalParams {
  currentStar: number;
  targetStar: number;
  /** 장비 레벨 (비용 계산용) */
  equipLevel: number;
  budget: number;
  iterations: number;
  getProbTable?: GetProbTable;
  getCosts?: GetCosts;
  starcatchRecord: { [key: number]: boolean };
  safeguardRecord: { [key: number]: boolean };
  event: Event | null;
  spareCost: number;
}

export interface SimulateStarforceGoalResult {
  totalRuns: number;
  successCount: number;
  failureCount: number;
  successProbability: number;
  costs: number[];
  destroyedCounts: number[];
  averageCost: number | null;
  p50Cost: number | null;
  p75Cost: number | null;
}

export const simulateStarforceGoal = ({
  currentStar,
  targetStar,
  equipLevel,
  budget,
  iterations,
  getProbTable = defaultGetProbTable,
  getCosts = defaultGetCosts,
  starcatchRecord,
  safeguardRecord,
  event,
  spareCost,
}: SimulateStarforceGoalParams): SimulateStarforceGoalResult => {
  const probTable = getProbTable(starcatchRecord, safeguardRecord, event);
  const defaultCosts = getCosts(equipLevel);

  const costs: number[] = [];
  const destroyedCounts: number[] = [];

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < iterations; i++) {
    let star = currentStar;
    let spentCost = 0;
    let destroyedCount = 0;

    // 예산 내에서 목표 달성까지 반복
    while (spentCost <= budget && star < targetStar) {
      const probabilities = probTable[star];

      const isDecided = probabilities[PROB_TABLE_SUCCESS_INDEX] === 1;

      const baseCost = defaultCosts[star] ?? 0;
      const cost =
        baseCost +
        (!isDecided && safeguardRecord[`${star}`]
          ? baseCost * 2
          : 0);

      spentCost += cost;

      if (spentCost > budget) {
        break;
      }

      if (isDecided) {
        star += 1;
      } else {
        let resultIndex = probabilities.length - 1;
        let r = Math.random();
        for (let j = 0; j < probabilities.length; j++) {
          if (r < probabilities[j]) {
            resultIndex = j;
            break;
          }
          r -= probabilities[j];
        }

        if (resultIndex === PROB_TABLE_SUCCESS_INDEX) {
          star += 1;
        } else if (resultIndex === PROB_TABLE_MAINTAIN_INDEX) {
          // no-op
        } else if (resultIndex === PROB_TABLE_DESTROY_INDEX) {
          star = 12;
          spentCost += spareCost;
          destroyedCount += 1;
        }
      }
    }

    if (star >= targetStar && spentCost <= budget) {
      successCount += 1;
      costs.push(spentCost);
      destroyedCounts.push(destroyedCount);
    } else {
      failureCount += 1;
    }
  }

  const sortedCosts = [...costs].sort((a, b) => a - b);
  const averageCost =
    costs.length > 0
      ? costs.reduce((sum, c) => sum + c, 0) / costs.length
      : null;

  const percentile = (p: number): number | null => {
    if (sortedCosts.length === 0) return null;
    const idx = Math.min(
      sortedCosts.length - 1,
      Math.floor((p / 100) * sortedCosts.length),
    );
    return sortedCosts[idx] ?? null;
  };

  return {
    totalRuns: iterations,
    successCount,
    failureCount,
    successProbability: iterations === 0 ? 0 : successCount / iterations,
    costs,
    destroyedCounts,
    averageCost,
    p50Cost: percentile(50),
    p75Cost: percentile(75),
  };
};

function difficultyFromProbability(p: number): GoalSimulationSummary["difficultyIndicator"] {
  if (p >= 0.5) return "low";
  if (p >= 0.2) return "medium";
  if (p > 0) return "high";
  return null;
}

/** 스타포스 목표 시뮬 결과를 공통 Summary/Distribution 형태로 변환 */
export function mapStarforceGoalResultToCommonShape(
  result: SimulateStarforceGoalResult,
): { summary: GoalSimulationSummary; distribution: GoalSimulationDistribution } {
  return {
    summary: {
      totalRuns: result.totalRuns,
      successCount: result.successCount,
      failureCount: result.failureCount,
      successProbability: result.successProbability,
      averageCost: result.averageCost,
      p50Cost: result.p50Cost,
      p75Cost: result.p75Cost,
      difficultyIndicator: difficultyFromProbability(result.successProbability),
    },
    distribution: {
      costs: result.costs,
    },
  };
}

