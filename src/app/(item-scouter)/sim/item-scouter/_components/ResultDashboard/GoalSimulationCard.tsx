"use client";

import type { GoalSimulationSummary } from "~/entities/game/goal-simulation";
import { putUnit } from "~/shared/number";
import { cx } from "~/shared/style";

import {
  GoalSuccessCurveChart,
  type GoalSuccessCurvePoint,
} from "./GoalSuccessCurveChart";

interface GoalSimulationCardProps {
  title: string;
  summary: GoalSimulationSummary;
  budget: number;
  /** 예산 vs 성공 확률 곡선 (여러 점이 있으면 차트에 선으로 표시) */
  curveData?: GoalSuccessCurvePoint[];
}

const difficultyWarning: Record<
  NonNullable<GoalSimulationSummary["difficultyIndicator"]>,
  string
> = {
  low: "",
  medium: "목표 달성이 다소 어렵습니다. 예산을 늘리거나 목표를 조정해 보세요.",
  high: "성공 확률이 낮습니다. 예산을 크게 늘리거나 목표를 낮추는 것을 권장합니다.",
};

export const GoalSimulationCard = ({
  title,
  summary,
  budget,
  curveData,
}: GoalSimulationCardProps) => {
  const pct = Math.round(summary.successProbability * 100);
  const warning =
    summary.difficultyIndicator != null
      ? difficultyWarning[summary.difficultyIndicator]
      : "";

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-default-50 p-4">
      <p className="mb-2 text-xs font-black tracking-widest text-amber-500">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
        <div>
          <p className="text-default-500">목표 달성 확률</p>
          <p className="font-bold text-amber-600">{pct}%</p>
        </div>
        <div>
          <p className="text-default-500">평균 필요 비용</p>
          <p className="font-bold">
            {summary.averageCost != null
              ? `${putUnit(Math.round(summary.averageCost))} 메소`
              : "-"}
          </p>
        </div>
        {summary.p50Cost != null && (
          <div>
            <p className="text-default-500">중앙값 (P50)</p>
            <p className="font-bold">
              {putUnit(Math.round(summary.p50Cost))} 메소
            </p>
          </div>
        )}
        {summary.p75Cost != null && (
          <div>
            <p className="text-default-500">P75</p>
            <p className="font-bold">
              {putUnit(Math.round(summary.p75Cost))} 메소
            </p>
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-default-400">
        예산: {putUnit(budget)} 메소 · 시뮬 {summary.totalRuns.toLocaleString()}회
      </p>
      {warning && (
        <p
          className={cx(
            "mt-2 text-xs",
            summary.difficultyIndicator === "high"
              ? "font-bold text-danger-500"
              : "text-warning-600",
          )}
        >
          {warning}
        </p>
      )}
      {curveData != null && curveData.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-bold text-default-500">
            예산 vs 목표 달성 확률
          </p>
          <GoalSuccessCurveChart data={curveData} height={200} />
        </div>
      )}
    </div>
  );
};
