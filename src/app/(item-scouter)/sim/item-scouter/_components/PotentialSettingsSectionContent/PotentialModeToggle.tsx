"use client";

import { useMolecule } from "bunshi/react";
import { useAtom, useAtomValue } from "jotai";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { type Potential } from "~/entities/potential";
import { cx } from "~/shared/style";
import { Button } from "~/shared/ui";

const GRADE_FLOAT_DESC: Record<Potential.Grade, string> = {
  RARE: "에픽 등급 옵션이 한 줄 이상 나올 때까지 큐브 사용",
  EPIC: "유니크 등급 옵션이 한 줄 이상 나올 때까지 큐브 사용",
  UNIQUE: "레전드리 등급 옵션이 한 줄 이상 나올 때까지 큐브 사용",
  LEGENDARY: "레전드리 아이템에서 원하는 옵션 조합이 나올 때까지 큐브 사용",
};

export const PotentialModeToggle = () => {
  const { potModeAtom, potCurrentGradeAtom } = useMolecule(ItemScouterMolecule);
  const [potMode, setPotMode] = useAtom(potModeAtom);
  const currentGrade = useAtomValue(potCurrentGradeAtom);

  return (
    <>
      <div className="flex overflow-hidden rounded-xl border border-default">
        {(
          [
            { key: "GRADE_UP", label: "등급업" },
            { key: "GRADE_FLOAT", label: "등급업 띄우기" },
          ] as const
        ).map(({ key, label }) => (
          <Button
            key={key}
            className={cx(
              "w-0 flex-1 rounded-none border-default text-sm [&:nth-child(n+2)]:border-l",
              potMode === key && "font-bold",
            )}
            variant={potMode === key ? "flat" : "light"}
            color={potMode === key ? "primary" : "default"}
            radius="none"
            onPress={() => setPotMode(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {potMode === "GRADE_FLOAT" && (
        <div className="rounded-xl bg-primary-50 px-3 py-2">
          <p className="text-xs text-primary-700">
            {GRADE_FLOAT_DESC[currentGrade]}
          </p>
          <p className="mt-1 text-[10px] text-primary-500">
            등급업 확률이 아닌, 상위 등급 옵션 라인이 나타날 기댓값으로
            계산합니다.
          </p>
        </div>
      )}
    </>
  );
};
