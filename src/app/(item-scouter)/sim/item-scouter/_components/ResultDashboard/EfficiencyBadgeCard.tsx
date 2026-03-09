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
  sfCostStats: CostStats | null;
  sfLuck: number;
  potCostStats: CostStats | null;
  potLuck: number;
  scrollCostStats: CostStats | null;
  scrollLuck: number;
}

export const EfficiencyBadgeCard = ({
  sfCostStats,
  sfLuck,
  potCostStats,
  potLuck,
  scrollCostStats,
  scrollLuck,
}: EfficiencyBadgeCardProps) => {
  const sfCost = sfCostStats ? getCostByLuck(sfCostStats, sfLuck) : 0;
  const potCost = potCostStats ? getCostByLuck(potCostStats, potLuck) : 0;
  const scrollCost = scrollCostStats ? getCostByLuck(scrollCostStats, scrollLuck) : 0;
  
  const totalCost = sfCost + potCost + scrollCost;
  
  // Use sfCostStats for efficiency grade if available, otherwise just use a default
  const efficiencyGrade = sfCostStats ? getEfficiencyGrade(sfCostStats.p10, sfCostStats.p90) : "A";

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
