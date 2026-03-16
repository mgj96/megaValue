import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { GoalSimulationSummary } from "~/entities/game/goal-simulation";

import { GoalSimulationCard } from "../GoalSimulationCard";

const baseSummary: GoalSimulationSummary = {
  totalRuns: 10000,
  successCount: 3500,
  failureCount: 6500,
  successProbability: 0.35,
  averageCost: 1_200_000_000,
  p50Cost: 1_100_000_000,
  p75Cost: 1_500_000_000,
  difficultyIndicator: "medium",
};

describe("GoalSimulationCard", () => {
  it("renders success probability as percentage", () => {
    render(
      <GoalSimulationCard
        title="스타포스 목표 달성"
        summary={baseSummary}
        budget={2_000_000_000}
      />,
    );
    expect(screen.getByText(/35%/)).toBeDefined();
  });

  it("renders average cost formatted with unit", () => {
    render(
      <GoalSimulationCard
        title="스타포스 목표 달성"
        summary={baseSummary}
        budget={2_000_000_000}
      />,
    );
    expect(screen.getByText(/12억/)).toBeDefined();
  });

  it("renders difficulty warning when difficultyIndicator is high", () => {
    render(
      <GoalSimulationCard
        title="스타포스 목표 달성"
        summary={{ ...baseSummary, difficultyIndicator: "high" }}
        budget={2_000_000_000}
      />,
    );
    expect(
      screen.getByText(/성공 확률이 낮습니다/),
    ).toBeDefined();
  });
});
