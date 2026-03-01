"use client";

import { Skeleton, Spacer } from "@heroui/react";
import { useMolecule } from "bunshi/react";
import { useAtomValue } from "jotai";

import { ResultChart } from "~/app/(starforce-simulator)/sim/starforce/_components/ResultSectionContent/ResultChart";
import { TopPercent } from "~/app/(starforce-simulator)/sim/starforce/_components/ResultSectionContent/TopPercent";
import { Potential } from "~/entities/potential";
import { putUnit } from "~/shared/number";
import { cx } from "~/shared/style";
import { SectionSubtitle } from "~/shared/ui/typographies";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";

const gradeOrder: Potential.Grade[] = ["RARE", "EPIC", "UNIQUE", "LEGENDARY"];

export const ResultDashboard = () => {
  const {
    sfResultExistsAtom,
    sfIsCalculatingAtom,
    sfCostsAtom,
    sfDestroyedCountsAtom,
    potResultAtom,
    potIsCalculatingAtom,
    isHighchartsLoadedAtom,
    sfEnabledAtom,
    potEnabledAtom,
    potCurrentGradeAtom,
    potTargetGradeAtom,
    potResetMethodAtom,
  } = useMolecule(ItemScouterMolecule);

  const sfEnabled = useAtomValue(sfEnabledAtom);
  const potEnabled = useAtomValue(potEnabledAtom);
  const sfResultExists = useAtomValue(sfResultExistsAtom);
  const sfIsCalculating = useAtomValue(sfIsCalculatingAtom);
  const potIsCalculating = useAtomValue(potIsCalculatingAtom);
  const isHighchartsLoaded = useAtomValue(isHighchartsLoadedAtom);
  const potResult = useAtomValue(potResultAtom);
  const currentGrade = useAtomValue(potCurrentGradeAtom);
  const targetGrade = useAtomValue(potTargetGradeAtom);
  const resetMethod = useAtomValue(potResetMethodAtom);

  const currentIdx = gradeOrder.indexOf(currentGrade);
  const targetIdx = gradeOrder.indexOf(targetGrade);
  const gradeSteps = gradeOrder.slice(currentIdx, targetIdx);

  const totalPotCost =
    potResult?.reduce((acc, r) => acc + r.expectedCost, 0) ?? null;

  return (
    <div className="flex flex-col gap-6">
      {/* ─── 스타포스 결과 ─── */}
      {sfEnabled && (
        <>
          <div>
            <SectionSubtitle>스타포스 소모 비용 분포</SectionSubtitle>
            <div
              className={cx(
                "mt-2 h-[400px]",
                sfResultExists || "flex items-center justify-center",
              )}
            >
              {sfIsCalculating || !isHighchartsLoaded ? (
                <Skeleton className="m-2 h-full w-full rounded-2xl" />
              ) : sfResultExists ? (
                <ResultChart dataAtom={sfCostsAtom} type="cost" />
              ) : (
                <p className="text-default-400">
                  계산하기 버튼을 눌러 시뮬레이션을 시작하세요.
                </p>
              )}
            </div>
            <Spacer y={2} />
            {sfResultExists && (
              <TopPercent dataAtom={sfCostsAtom} type="cost" />
            )}
          </div>

          <div>
            <SectionSubtitle>스타포스 파괴 횟수 분포</SectionSubtitle>
            <div
              className={cx(
                "mt-2 h-[400px]",
                sfResultExists || "flex items-center justify-center",
              )}
            >
              {sfIsCalculating || !isHighchartsLoaded ? (
                <Skeleton className="m-2 h-full w-full rounded-2xl" />
              ) : sfResultExists ? (
                <ResultChart
                  dataAtom={sfDestroyedCountsAtom}
                  type="destroyedCount"
                />
              ) : (
                <p className="text-default-400">
                  계산하기 버튼을 눌러 시뮬레이션을 시작하세요.
                </p>
              )}
            </div>
            <Spacer y={2} />
            {sfResultExists && (
              <TopPercent
                dataAtom={sfDestroyedCountsAtom}
                type="destroyedCount"
              />
            )}
          </div>
        </>
      )}

      {/* ─── 잠재능력 결과 ─── */}
      {potEnabled && (
        <div>
          <SectionSubtitle>잠재능력 등급업 기대 비용</SectionSubtitle>
          {potIsCalculating ? (
            <Skeleton className="mt-2 h-24 w-full rounded-2xl" />
          ) : potResult ? (
            <div className="mt-2 flex flex-col gap-2">
              {gradeSteps.map((grade, i) => {
                const step = potResult[i];
                if (!step) return null;
                const nextGrade = gradeOrder[gradeOrder.indexOf(grade) + 1];
                return (
                  <div
                    key={grade}
                    className="flex items-center justify-between rounded-xl bg-default-100 px-4 py-3"
                  >
                    <span className="text-sm text-default-600">
                      {Potential.gradeLabels[grade]} →{" "}
                      {Potential.gradeLabels[nextGrade]}{" "}
                      <span className="text-xs text-default-400">
                        ({Potential.resetMethodLabels[resetMethod]})
                      </span>
                    </span>
                    <div className="text-right">
                      <p className="font-bold text-primary-500">
                        {putUnit(Math.round(step.expectedCost))} 메소
                      </p>
                      <p className="text-xs text-default-400">
                        평균 {Math.round(step.expectedCount)}회
                      </p>
                    </div>
                  </div>
                );
              })}

              {totalPotCost != null && gradeSteps.length > 1 && (
                <div className="flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3">
                  <span className="text-sm font-bold text-primary-700">
                    잠재능력 합계
                  </span>
                  <p className="font-bold text-primary-700">
                    {putUnit(Math.round(totalPotCost))} 메소
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-2 text-default-400">
              계산하기 버튼을 눌러 기대 비용을 확인하세요.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
