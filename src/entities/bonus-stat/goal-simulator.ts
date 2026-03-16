/**
 * 보너스 스탯(추옵) 목표 달성 시뮬레이터.
 * 현재는 공통 타입/매퍼만 정의. 실제 몬테카를로 로직은 추옵 규칙·비용 연동 후 구현 예정.
 */

import type {
  GoalSimulationDistribution,
  GoalSimulationSummary,
} from "~/entities/game/goal-simulation";

export interface SimulateBonusStatGoalParams {
  /** 목표 스탯 또는 추옵 티어 등 (시스템별 정의) */
  budget: number;
  iterations: number;
}

export interface SimulateBonusStatGoalResult {
  totalRuns: number;
  successCount: number;
  failureCount: number;
  successProbability: number;
  costs: number[];
  averageCost: number | null;
  p50Cost: number | null;
  p75Cost: number | null;
}

function difficultyFromProbability(
  p: number,
): GoalSimulationSummary["difficultyIndicator"] {
  if (p >= 0.5) return "low";
  if (p >= 0.2) return "medium";
  if (p > 0) return "high";
  return null;
}

export function mapBonusStatGoalResultToCommonShape(
  result: SimulateBonusStatGoalResult,
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
    distribution: { costs: result.costs },
  };
}

/**
 * 보너스 스탯 목표 달성 Monte Carlo.
 * TODO: 추옵 규칙·비용 연동 후 구현.
 */
export function simulateBonusStatGoal(
  _params: SimulateBonusStatGoalParams,
): SimulateBonusStatGoalResult {
  const { iterations } = _params;
  return {
    totalRuns: iterations,
    successCount: 0,
    failureCount: iterations,
    successProbability: 0,
    costs: [],
    averageCost: null,
    p50Cost: null,
    p75Cost: null,
  };
}
