"use client";

import { putUnit } from "~/shared/number";
import { cx } from "~/shared/style";

import { type CostStats, getCostByLuck, luckLabel } from "./utils";

interface LuckSliderCardProps {
  label: string;
  accentColorClass: string;
  borderColorClass: string;
  stats: CostStats;
  luck: number;
  onLuckChange: (v: number) => void;
}

export const LuckSliderCard = ({
  label,
  accentColorClass,
  borderColorClass,
  stats,
  luck,
  onLuckChange,
}: LuckSliderCardProps) => {
  const cost = getCostByLuck(stats, luck);

  return (
    <div className={cx("rounded-2xl border p-4", borderColorClass)}>
      <div className="mb-1 flex items-center gap-1.5">
        <span
          className={cx("text-xs font-black tracking-widest", accentColorClass)}
        >
          {label}
        </span>
        <span className="ml-auto text-[10px] text-default-400">
          {luckLabel(luck)}
        </span>
        <span
          className="rounded border border-pink-500/30 bg-pink-500/10 px-1 py-0.5 text-[9px]
            font-bold text-pink-400"
        >
          {luck}%
        </span>
      </div>

      <div className={cx("mb-2 text-base font-black", accentColorClass)}>
        {luck < 10 && (
          <span className="mr-0.5 text-[10px] font-medium text-default-400">
            ≤
          </span>
        )}
        {putUnit(cost)} 메소
        {luck > 90 && (
          <span className="ml-0.5 text-[10px] font-medium text-default-400">
            ≥
          </span>
        )}
      </div>

      <input
        type="range"
        min={1}
        max={99}
        value={luck}
        onChange={(e) => onLuckChange(Number(e.target.value))}
        className="w-full accent-primary"
      />

      <div className="mt-1 flex justify-between px-0.5">
        {[10, 50, 90].map((v) => (
          <button
            key={v}
            onClick={() => onLuckChange(v)}
            className="text-[9px] font-bold text-default-400 transition-colors hover:text-default-700"
          >
            {v}%
          </button>
        ))}
      </div>
    </div>
  );
};
