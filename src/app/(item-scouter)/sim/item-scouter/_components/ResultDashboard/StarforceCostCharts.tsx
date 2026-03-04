"use client";

import { Skeleton, Spacer } from "@heroui/react";
import { useMolecule } from "bunshi/react";
import { useAtomValue } from "jotai";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { ResultChart } from "~/app/(starforce-simulator)/sim/starforce/_components/ResultSectionContent/ResultChart";
import { TopPercent } from "~/app/(starforce-simulator)/sim/starforce/_components/ResultSectionContent/TopPercent";
import { cx } from "~/shared/style";
import { SectionSubtitle } from "~/shared/ui/typographies";

export const StarforceCostCharts = () => {
  const {
    sfCostsAtom,
    sfDestroyedCountsAtom,
    sfResultExistsAtom,
    sfIsCalculatingAtom,
  } = useMolecule(ItemScouterMolecule);

  const sfResultExists = useAtomValue(sfResultExistsAtom);
  const sfIsCalculating = useAtomValue(sfIsCalculatingAtom);

  return (
    <>
      <div>
        <SectionSubtitle>스타포스 소모 비용 분포</SectionSubtitle>
        <div
          className={cx(
            "mt-2 h-[280px]",
            sfResultExists || "flex items-center justify-center",
          )}
        >
          {sfIsCalculating ? (
            <Skeleton className="m-2 h-full w-full rounded-2xl" />
          ) : sfResultExists ? (
            <ResultChart dataAtom={sfCostsAtom} type="cost" />
          ) : (
            <p className="text-sm text-default-400">
              계산하기 버튼을 눌러 시뮬레이션을 시작하세요.
            </p>
          )}
        </div>
        <Spacer y={2} />
        {sfResultExists && <TopPercent dataAtom={sfCostsAtom} type="cost" />}
      </div>

      <div>
        <SectionSubtitle>스타포스 파괴 횟수 분포</SectionSubtitle>
        <div
          className={cx(
            "mt-2 h-[280px]",
            sfResultExists || "flex items-center justify-center",
          )}
        >
          {sfIsCalculating ? (
            <Skeleton className="m-2 h-full w-full rounded-2xl" />
          ) : sfResultExists ? (
            <ResultChart
              dataAtom={sfDestroyedCountsAtom}
              type="destroyedCount"
            />
          ) : (
            <p className="text-sm text-default-400">
              계산하기 버튼을 눌러 시뮬레이션을 시작하세요.
            </p>
          )}
        </div>
        <Spacer y={2} />
        {sfResultExists && (
          <TopPercent dataAtom={sfDestroyedCountsAtom} type="destroyedCount" />
        )}
      </div>
    </>
  );
};
