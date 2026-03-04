"use client";

import { SelectItem } from "@heroui/react";

import { Input, Select, SectionSubtitle } from "~/shared/ui";

const STAT_OPTIONS = [
  "STR",
  "DEX",
  "INT",
  "LUK",
  "올스탯",
  "최대 HP",
  "공격력",
  "마력",
  "보스 몬스터 공격 시 데미지",
  "방어율 무시",
  "크리티컬 데미지",
] as const;

type StatOption = (typeof STAT_OPTIONS)[number] | "";

export interface PotLine {
  statType: StatOption;
  value: string;
}

interface PotentialLineInputSectionProps {
  title: string;
  lines: PotLine[];
  onLineChange: (idx: number, partial: Partial<PotLine>) => void;
  maxValue?: number;
}

export const PotentialLineInputSection = ({
  title,
  lines,
  onLineChange,
  maxValue,
}: PotentialLineInputSectionProps) => {
  return (
    <div className="flex flex-col gap-3">
      <SectionSubtitle>{title}</SectionSubtitle>
      {lines.map((line, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <div className="flex-1">
            <Select
              placeholder="옵션 선택"
              selectedKeys={line.statType ? [line.statType] : []}
              onChange={(e) =>
                onLineChange(idx, { statType: e.target.value as StatOption })
              }
              aria-label="옵션 선택"
              size="sm"
            >
              {STAT_OPTIONS.map((opt) => (
                <SelectItem key={opt}>{opt}</SelectItem>
              ))}
            </Select>
          </div>
          <Input
            type="number"
            min={1}
            max={maxValue}
            placeholder="수치"
            value={line.value}
            isDisabled={!line.statType}
            onValueChange={(v) => onLineChange(idx, { value: v })}
            size="sm"
            className="w-24"
            aria-label="수치(%)"
            endContent={
              <span className="pointer-events-none text-xs text-default-400">
                %
              </span>
            }
          />
        </div>
      ))}
    </div>
  );
};
