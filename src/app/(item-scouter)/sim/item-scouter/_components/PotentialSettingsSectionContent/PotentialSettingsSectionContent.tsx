"use client";

import { useMolecule } from "bunshi/react";
import { useAtom, useAtomValue } from "jotai";
import { useState } from "react";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { Button } from "~/shared/ui";

import { CubeTypeAndPriceInput } from "./CubeTypeAndPriceInput";
import { GradeSelects } from "./GradeSelects";
import {
  type PotLine,
  PotentialLineInputSection,
} from "./PotentialLineInputSection";
import { PotentialModeToggle } from "./PotentialModeToggle";
import { PotentialTypeRadioGroup } from "./PotentialTypeRadioGroup";

const EMPTY_LINES: PotLine[] = [
  { statType: "", value: "" },
  { statType: "", value: "" },
  { statType: "", value: "" },
];

function formatLines(lines: PotLine[]): string[] {
  return lines
    .filter((l) => l.statType && l.value)
    .map((l) => `${l.statType} : +${l.value}%`);
}

export const PotentialSettingsSectionContent = () => {
  const { itemTypeAtom, mainLinesAtom, addiLinesAtom } =
    useMolecule(ItemScouterMolecule);
  const itemType = useAtomValue(itemTypeAtom);
  const [, setMainLines] = useAtom(mainLinesAtom);
  const [, setAddiLines] = useAtom(addiLinesAtom);

  const [mainLineInputs, setMainLineInputs] = useState<PotLine[]>(EMPTY_LINES);
  const [addiLineInputs, setAddiLineInputs] = useState<PotLine[]>(EMPTY_LINES);

  function handleMainLineChange(idx: number, partial: Partial<PotLine>) {
    const updated = mainLineInputs.map((line, i) =>
      i === idx ? { ...line, ...partial } : line,
    );
    setMainLineInputs(updated);
    setMainLines(formatLines(updated));
  }

  function handleAddiLineChange(idx: number, partial: Partial<PotLine>) {
    const updated = addiLineInputs.map((line, i) =>
      i === idx ? { ...line, ...partial } : line,
    );
    setAddiLineInputs(updated);
    setAddiLines(formatLines(updated));
  }

  function resetDetailLines() {
    const empty = EMPTY_LINES.map(() => ({
      statType: "" as PotLine["statType"],
      value: "",
    }));
    setMainLineInputs(empty);
    setAddiLineInputs(empty);
    setMainLines([]);
    setAddiLines([]);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더: 잠재능력 설정 타이틀 + 초기화 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-primary">잠재능력 설정</h2>
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-600">
            {itemType} 기준
          </span>
        </div>
        <Button
          size="sm"
          variant="light"
          color="danger"
          onPress={resetDetailLines}
        >
          초기화
        </Button>
      </div>

      <PotentialModeToggle />
      <PotentialTypeRadioGroup />
      <GradeSelects />
      <CubeTypeAndPriceInput />

      <PotentialLineInputSection
        title="윗잠 (주 잠재)"
        lines={mainLineInputs}
        onLineChange={handleMainLineChange}
        maxValue={45}
      />
      <PotentialLineInputSection
        title="밑잠 (에디셔널)"
        lines={addiLineInputs}
        onLineChange={handleAddiLineChange}
        maxValue={21}
      />
    </div>
  );
};
