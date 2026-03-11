"use client";

import { Tabs, Tab } from "@heroui/react";
import { useMolecule } from "bunshi/react";
import { useAtom, useAtomValue } from "jotai";
import { useState, useEffect } from "react";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { Button } from "~/shared/ui";

import { CubeTypeAndPriceInput } from "./CubeTypeAndPriceInput";
import { GradeSelects } from "./GradeSelects";
import {
  type PotLine,
  PotentialLineInputSection,
} from "./PotentialLineInputSection";
import { getAvailableStatOptions, type StatOption } from "./potential-logic";
import { PotentialTypeRadioGroup } from "./PotentialTypeRadioGroup";
import { TestValueInjector } from "../TestValueInjector";

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
  const { equipPartAtom, mainLinesAtom, addiLinesAtom } =
    useMolecule(ItemScouterMolecule);
  const equipPart = useAtomValue(equipPartAtom);
  const [, setMainLines] = useAtom(mainLinesAtom);
  const [, setAddiLines] = useAtom(addiLinesAtom);

  const mainAvailableOptions = getAvailableStatOptions(equipPart, false);
  const addiAvailableOptions = getAvailableStatOptions(equipPart, true);

  const [mainLineInputs, setMainLineInputs] = useState<PotLine[]>(EMPTY_LINES);
  const [addiLineInputs, setAddiLineInputs] = useState<PotLine[]>(EMPTY_LINES);
  
  const [selectedTab, setSelectedTab] = useState<"GRADE" | "OPTION">("GRADE");

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
      statType: "" as StatOption,
      value: "",
    }));
    setMainLineInputs(empty);
    setAddiLineInputs(empty);
    setMainLines([]);
    setAddiLines([]);
  }

  function injectPotentialTestLines() {
    const mainLines: PotLine[] = [
      { statType: "STR" as StatOption, value: "12" },
      { statType: "STR" as StatOption, value: "9" },
      { statType: "" as StatOption, value: "" },
    ];
    setMainLineInputs(mainLines);
    setMainLines(formatLines(mainLines));
    
    // 밑잠은 비워둠 (요청사항 기반)
    setAddiLineInputs(EMPTY_LINES);
    setAddiLines([]);
    
    // 주입 후 옵션 탭으로 이동하여 확인하기 편하게 함
    setSelectedTab("OPTION");
  }

  useEffect(() => {
    setMainLineInputs((prev) => {
      let changed = false;
      const next = prev.map((l) => {
        if (l.statType && !mainAvailableOptions.includes(l.statType)) {
          changed = true;
          return { ...l, statType: "" as StatOption, value: "" };
        }
        return l;
      });
      if (changed) {
        setMainLines(formatLines(next));
        return next;
      }
      return prev;
    });

    setAddiLineInputs((prev) => {
      let changed = false;
      const next = prev.map((l) => {
        if (l.statType && !addiAvailableOptions.includes(l.statType)) {
          changed = true;
          return { ...l, statType: "" as StatOption, value: "" };
        }
        return l;
      });
      if (changed) {
        setAddiLines(formatLines(next));
        return next;
      }
      return prev;
    });
  }, [equipPart]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더: 잠재능력 설정 타이틀 + 초기화 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-primary">잠재능력 설정</h2>
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-600">
            {equipPart} 기준
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TestValueInjector onInjected={injectPotentialTestLines} />
          <Button
            size="sm"
            variant="light"
            color="danger"
            onPress={resetDetailLines}
          >
            초기화
          </Button>
        </div>
      </div>

      <div className="flex w-full flex-col -mt-2">
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(k) => setSelectedTab(k as "GRADE" | "OPTION")}
          color="primary"
          variant="underlined"
          classNames={{
            tabList:
              "gap-6 w-full relative rounded-none p-0 border-b border-default-200",
            cursor: "w-full bg-primary",
            tab: "max-w-fit px-0 h-10",
            tabContent: "group-data-[selected=true]:text-primary font-bold",
          }}
        >
          <Tab key="GRADE" title="등급(등업) 설정" />
          <Tab key="OPTION" title="목표 옵션 설정" />
        </Tabs>
      </div>

      {selectedTab === "GRADE" && (
        <div className="flex flex-col gap-6">
          <PotentialTypeRadioGroup />
          <GradeSelects />
          <CubeTypeAndPriceInput />
        </div>
      )}

      {selectedTab === "OPTION" && (
        <div className="flex flex-col gap-6">
          <PotentialTypeRadioGroup />
          <GradeSelects isOptionMode={true} />
          <CubeTypeAndPriceInput />

          <PotentialLineInputSection
            title="윗잠 (주 잠재)"
            lines={mainLineInputs}
            onLineChange={handleMainLineChange}
            availableOptions={mainAvailableOptions}
            maxValue={45}
          />
          <PotentialLineInputSection
            title="밑잠 (에디셔널)"
            lines={addiLineInputs}
            onLineChange={handleAddiLineChange}
            availableOptions={addiAvailableOptions}
            maxValue={21}
          />
        </div>
      )}
    </div>
  );
};
