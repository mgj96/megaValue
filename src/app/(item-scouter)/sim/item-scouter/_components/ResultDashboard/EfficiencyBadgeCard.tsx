"use client";

import { putUnit } from "~/shared/number";
import { cx } from "~/shared/style";

import {
  type CostStats,
  getCostByLuck,
  getEfficiencyGrade,
  gradeColorClass,
} from "./utils";

interface EfficiencyBadgeCardProps {
  sfCostStats: CostStats;
  sfLuck: number;
  potTotalCost: number | null;
}

export const EfficiencyBadgeCard = ({
  sfCostStats,
  sfLuck,
  potTotalCost,
}: EfficiencyBadgeCardProps) => {
  const efficiencyGrade = getEfficiencyGrade(sfCostStats.p10, sfCostStats.p90);
  const sfCost = getCostByLuck(sfCostStats, sfLuck);
  const potCost = potTotalCost ?? 0;
  const totalCost = sfCost + potCost;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-default-50 px-4 py-3">
      <span
        className={cx("text-3xl font-black", gradeColorClass[efficiencyGrade])}
      >
        {efficiencyGrade}
      </span>
      <div>
        <p className="text-[9px] font-bold tracking-widest text-default-400">
          예상 총 비용
        </p>
        <p className="text-base font-black text-primary-500">
          {putUnit(Math.round(totalCost))} 메소
        </p>
      </div>
    </div>
  );
};
