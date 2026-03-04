"use client";

import { Skeleton } from "@heroui/react";
import { useMolecule } from "bunshi/react";
import { useAtomValue } from "jotai";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { Potential } from "~/entities/potential";
import { putUnit } from "~/shared/number";
import { SectionSubtitle } from "~/shared/ui/typographies";

const gradeOrder: Potential.Grade[] = ["RARE", "EPIC", "UNIQUE", "LEGENDARY"];

export const PotentialCostBreakdown = () => {
  const {
    potResultAtom,
    potIsCalculatingAtom,
    potTotalCostAtom,
    potCurrentGradeAtom,
    potTargetGradeAtom,
    potResetMethodAtom,
  } = useMolecule(ItemScouterMolecule);

  const potResult = useAtomValue(potResultAtom);
  const potIsCalculating = useAtomValue(potIsCalculatingAtom);
  const potTotalCost = useAtomValue(potTotalCostAtom);
  const currentGrade = useAtomValue(potCurrentGradeAtom);
  const targetGrade = useAtomValue(potTargetGradeAtom);
  const resetMethod = useAtomValue(potResetMethodAtom);

  const currentIdx = gradeOrder.indexOf(currentGrade);
  const targetIdx = gradeOrder.indexOf(targetGrade);
  const gradeSteps = gradeOrder.slice(currentIdx, targetIdx);

  return (
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
                  <p className="font-bold text-violet-500">
                    {putUnit(Math.round(step.expectedCost))} 메소
                  </p>
                  <p className="text-xs text-default-400">
                    평균 {Math.round(step.expectedCount)}회
                  </p>
                </div>
              </div>
            );
          })}

          {potTotalCost != null && gradeSteps.length > 1 && (
            <div className="flex items-center justify-between rounded-xl bg-violet-50 px-4 py-3">
              <span className="text-sm font-bold text-violet-700">
                잠재능력 합계
              </span>
              <p className="font-bold text-violet-700">
                {putUnit(Math.round(potTotalCost))} 메소
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-2 text-sm text-default-400">
          계산하기 버튼을 눌러 기대 비용을 확인하세요.
        </p>
      )}
    </div>
  );
};
