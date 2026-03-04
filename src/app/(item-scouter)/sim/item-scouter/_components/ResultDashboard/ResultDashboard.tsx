"use client";

import { useMolecule } from "bunshi/react";
import { useAtomValue } from "jotai";
import { useState } from "react";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";

import { EfficiencyBadgeCard } from "./EfficiencyBadgeCard";
import { LuckSliderCard } from "./LuckSliderCard";
import { PotentialCostBreakdown } from "./PotentialCostBreakdown";
import { StarforceCostCharts } from "./StarforceCostCharts";

export const ResultDashboard = () => {
  const {
    sfResultExistsAtom,
    sfIsCalculatingAtom,
    sfCostStatsAtom,
    potResultAtom,
    potIsCalculatingAtom,
    potTotalCostAtom,
    sfEnabledAtom,
    potEnabledAtom,
  } = useMolecule(ItemScouterMolecule);

  const sfEnabled = useAtomValue(sfEnabledAtom);
  const potEnabled = useAtomValue(potEnabledAtom);
  const sfResultExists = useAtomValue(sfResultExistsAtom);
  const sfIsCalculating = useAtomValue(sfIsCalculatingAtom);
  const potIsCalculating = useAtomValue(potIsCalculatingAtom);
  const potResult = useAtomValue(potResultAtom);
  const sfCostStats = useAtomValue(sfCostStatsAtom);
  const potTotalCost = useAtomValue(potTotalCostAtom);

  const [sfLuck, setSfLuck] = useState(50);

  const hasResult = sfResultExists || potResult != null;

  if (!hasResult) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-default-400">
          계산하기 버튼을 눌러 시뮬레이션을 시작하세요.
        </p>
        {(sfIsCalculating || potIsCalculating) && (
          <div className="flex animate-pulse items-center gap-2 text-sm font-bold text-primary-500">
            <span className="h-2 w-2 animate-ping rounded-full bg-primary-500" />
            계산 중...
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ① 효율 등급 배지 + 총 비용 */}
      {sfEnabled && sfCostStats && sfResultExists && (
        <EfficiencyBadgeCard
          sfCostStats={sfCostStats}
          sfLuck={sfLuck}
          potTotalCost={potTotalCost}
        />
      )}

      {/* ② 스타포스 luck 슬라이더 카드 */}
      {sfEnabled && sfCostStats && sfResultExists && (
        <LuckSliderCard
          label="스타포스"
          accentColorClass="text-amber-500"
          borderColorClass="border-amber-500/30"
          stats={sfCostStats}
          luck={sfLuck}
          onLuckChange={setSfLuck}
        />
      )}

      {/* ③ 스타포스 분포 차트 */}
      {sfEnabled && <StarforceCostCharts />}

      {/* ④ 잠재능력 결과 */}
      {potEnabled && <PotentialCostBreakdown />}
    </div>
  );
};
