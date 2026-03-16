import { describe, expect, it } from "vitest";

import { simulateStarforceGoal } from "../goal-simulator";

describe("simulateStarforceGoal", () => {
  it("should return deterministic result when success is guaranteed and cost is fixed", () => {
    const result = simulateStarforceGoal({
      currentStar: 0,
      targetStar: 1,
      equipLevel: 200,
      budget: 1_000_000_000,
      iterations: 1000,
      // 테스트용: 모든 시도에서 100% 성공 / 파괴 없음 / 고정 비용 1,000
      getProbTable: () => [[1, 0, 0]],
      getCosts: () => [1000],
      spareCost: 0,
      safeguardRecord: { 0: false },
      starcatchRecord: { 0: false },
      event: null,
    });

    expect(result.totalRuns).toBe(1000);
    expect(result.successCount).toBe(1000);
    expect(result.failureCount).toBe(0);
    expect(result.successProbability).toBe(1);
    expect(result.costs.length).toBe(1000);
    expect(result.costs.every((c) => c === 1000)).toBe(true);
    expect(result.averageCost).toBe(1000);
  });
});

