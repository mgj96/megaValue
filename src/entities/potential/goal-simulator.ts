/**
 * 잠재능력 목표 달성 시뮬레이터 (등급업 목표까지의 Monte Carlo).
 * 현재는 공통 타입/매퍼만 정의. 실제 몬테카를로 로직은 DB(등급업 확률)·비용 연동 후 구현 예정.
 */

import type {
  GoalSimulationDistribution,
  GoalSimulationSummary,
} from "~/entities/game/goal-simulation";

import type { Grade, ResetMethod } from "./constants";

export interface SimulatePotentialGoalParams {
  currentGrade: Grade;
  targetGrade: Grade;
  /** 장비 레벨 */
  level: number;
  method: ResetMethod;
  /** 큐브 1회 비용 (메소) */
  cubeCost: number;
  budget: number;
  iterations: number;
}

export interface SimulatePotentialGoalResult {
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

/**
 * 잠재 목표 시뮬 결과를 공통 Summary/Distribution 형태로 변환.
 * 실제 시뮬 구현 시 simulatePotentialGoal 연동.
 */
export function mapPotentialGoalResultToCommonShape(result: SimulatePotentialGoalResult): {
  summary: GoalSimulationSummary;
  distribution: GoalSimulationDistribution;
} {
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
 * 잠재능력 목표 달성 Monte Carlo 시뮬레이션.
 * TODO: 등급업 확률(DB/API)·비용(getResetCost) 연동 후 구현.
 */
export function simulatePotentialGoal(
  _params: SimulatePotentialGoalParams,
): SimulatePotentialGoalResult {
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
