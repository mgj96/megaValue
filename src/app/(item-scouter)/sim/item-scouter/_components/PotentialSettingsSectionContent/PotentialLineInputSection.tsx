"use client";

import { SelectItem } from "@heroui/react";

import { Input, Select, SectionSubtitle } from "~/shared/ui";
import { type StatOption } from "./potential-logic";

export interface PotLine {
  statType: StatOption;
  value: string;
}

interface PotentialLineInputSectionProps {
  title: string;
  lines: PotLine[];
  onLineChange: (idx: number, partial: Partial<PotLine>) => void;
  availableOptions: StatOption[];
  maxValue?: number;
}

export const PotentialLineInputSection = ({
  title,
  lines,
  onLineChange,
  availableOptions,
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
              {availableOptions.map((opt) => (
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
