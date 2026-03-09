"use client";

import { SelectItem } from "@heroui/react";
import { useMolecule } from "bunshi/react";
import { useAtom } from "jotai";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { Potential } from "~/entities/potential";
import { cx } from "~/shared/style";
import { Select } from "~/shared/ui";

const gradeOrder: Potential.Grade[] = ["RARE", "EPIC", "UNIQUE", "LEGENDARY"];

export const GradeSelects = ({ isOptionMode = false }: { isOptionMode?: boolean }) => {
  const { potCurrentGradeAtom, potTargetGradeAtom } =
    useMolecule(ItemScouterMolecule);
  const [currentGrade, setCurrentGrade] = useAtom(potCurrentGradeAtom);
  const [targetGrade, setTargetGrade] = useAtom(potTargetGradeAtom);

  const currentGradeIdx = gradeOrder.indexOf(currentGrade);
  const targetGrades = gradeOrder.slice(currentGradeIdx + 1);

  return (
    <div className={cx("grid gap-4", isOptionMode ? "grid-cols-1" : "grid-cols-2")}>
      <Select
        label="현재 등급"
        selectedKeys={[currentGrade]}
        onChange={(e) => {
          const parsed = Potential.gradeSchema.safeParse(e.target.value);
          if (parsed.success) {
            setCurrentGrade(parsed.data);
            if (
              gradeOrder.indexOf(parsed.data) >= gradeOrder.indexOf(targetGrade)
            ) {
              const newIdx = gradeOrder.indexOf(parsed.data) + 1;
              if (newIdx < gradeOrder.length) {
                setTargetGrade(gradeOrder[newIdx]);
              }
            }
          }
        }}
      >
        {(isOptionMode ? gradeOrder : gradeOrder.slice(0, -1)).map((grade) => (
          <SelectItem key={grade}>{Potential.gradeLabels[grade]}</SelectItem>
        ))}
      </Select>

      {!isOptionMode && (
        <Select
          label="목표 등급"
          selectedKeys={[targetGrade]}
          onChange={(e) => {
            const parsed = Potential.gradeSchema.safeParse(e.target.value);
            if (parsed.success) setTargetGrade(parsed.data);
          }}
        >
          {targetGrades.map((grade) => (
            <SelectItem key={grade}>{Potential.gradeLabels[grade]}</SelectItem>
          ))}
        </Select>
      )}
    </div>
  );
};
