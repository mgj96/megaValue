/**
 * 목표 달성 시뮬레이터 공통 타입 (스타포스/잠재/주흔/보너스 스탯 등에서 재사용)
 */

/** 시뮬레이션 입력 공통 형태 (시스템별로 확장) */
export interface GoalSimulationInput {
  budget: number;
  iterations: number;
}

/** 시뮬레이션 요약 결과 (카드/요약 UI용) */
export interface GoalSimulationSummary {
  totalRuns: number;
  successCount: number;
  failureCount: number;
  successProbability: number;
  averageCost: number | null;
  p50Cost: number | null;
  p75Cost: number | null;
  /** 성공 확률이 낮을 때 표시할 경고 수준 (예: 'low' | 'medium' | 'high' | null) */
  difficultyIndicator: "low" | "medium" | "high" | null;
}

/** 비용/시도 횟수 분포 (차트용) */
export interface GoalSimulationDistribution {
  /** 성공한 런들의 비용 배열 (정렬 여부는 구현에 따름) */
  costs: number[];
  /** 예산 구간별 성공 확률 (예: 예산 vs 성공 확률 곡선) */
  budgetSuccessCurve?: { budget: number; successProbability: number }[];
}
