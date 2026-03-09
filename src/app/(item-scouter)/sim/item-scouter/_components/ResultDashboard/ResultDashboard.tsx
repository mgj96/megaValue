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
    potCostStatsAtom,
    potIsCalculatingAtom,
    potTotalCostAtom,
    scrollIsCalculatingAtom,
    scrollCostStatsAtom,
    sfEnabledAtom,
    potEnabledAtom,
    scrollEnabledAtom,
  } = useMolecule(ItemScouterMolecule);

  const sfEnabled = useAtomValue(sfEnabledAtom);
  const potEnabled = useAtomValue(potEnabledAtom);
  const scrollEnabled = useAtomValue(scrollEnabledAtom);
  
  const sfResultExists = useAtomValue(sfResultExistsAtom);
  
  const sfIsCalculating = useAtomValue(sfIsCalculatingAtom);
  const potIsCalculating = useAtomValue(potIsCalculatingAtom);
  const scrollIsCalculating = useAtomValue(scrollIsCalculatingAtom);
  
  const potResult = useAtomValue(potResultAtom);
  
  const sfCostStats = useAtomValue(sfCostStatsAtom);
  const potCostStats = useAtomValue(potCostStatsAtom);
  const scrollCostStats = useAtomValue(scrollCostStatsAtom);
  
  const potTotalCost = useAtomValue(potTotalCostAtom);

  const [sfLuck, setSfLuck] = useState(50);
  const [potLuck, setPotLuck] = useState(50);
  const [scrollLuck, setScrollLuck] = useState(50);

  const hasResult =
    (sfEnabled && sfResultExists) ||
    (potEnabled && potResult !== null) ||
    (scrollEnabled && scrollCostStats !== null);

  if (!hasResult) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <p className="text-sm text-default-400">
          모든 설정을 마치고 계산하기 버튼을 눌러 시뮬레이션을 시작하세요.
        </p>
        {(sfIsCalculating || potIsCalculating || scrollIsCalculating) && (
          <div className="mt-2 flex animate-pulse items-center gap-2 text-sm font-bold text-primary-500">
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
      {hasResult && (
        <EfficiencyBadgeCard
          sfCostStats={sfEnabled && sfResultExists ? sfCostStats : null}
          sfLuck={sfLuck}
          potCostStats={potEnabled && potResult ? potCostStats : null}
          potLuck={potLuck}
          scrollCostStats={scrollEnabled && scrollCostStats ? scrollCostStats : null}
          scrollLuck={scrollLuck}
        />
      )}

      {/* ② 운 슬라이더 카드 (스타포스, 잠재능력, 주흔작) */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        {scrollEnabled && scrollCostStats && (
          <LuckSliderCard
            label="주문의 흔적작"
            accentColorClass="text-emerald-500"
            borderColorClass="border-emerald-500/30"
            stats={scrollCostStats}
            luck={scrollLuck}
            onLuckChange={setScrollLuck}
          />
        )}

        {potEnabled && potCostStats && (
          <LuckSliderCard
            label="잠재능력 등급업"
            accentColorClass="text-violet-500"
            borderColorClass="border-violet-500/30"
            stats={potCostStats}
            luck={potLuck}
            onLuckChange={setPotLuck}
          />
        )}

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
      </div>

      {/* ③ 스타포스 분포 차트 */}
      {sfEnabled && <StarforceCostCharts />}

      {/* ④ 잠재능력 결과 */}
      {potEnabled && <PotentialCostBreakdown />}
    </div>
  );
};
