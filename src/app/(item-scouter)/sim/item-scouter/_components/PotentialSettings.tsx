"use client";

import { SelectItem } from "@heroui/react";
import { useMolecule } from "bunshi/react";
import { identity, pipe } from "fp-ts/lib/function";
import { useAtom } from "jotai";
import { useState } from "react";

import { Potential } from "~/entities/potential";
import { E } from "~/shared/fp";
import { Input, Radio, RadioGroup, Select } from "~/shared/ui";
import { SectionSubtitle } from "~/shared/ui/typographies";

import { ItemScouterMolecule } from "../_lib/molecule";

export const PotentialSettings = () => {
  const {
    potTypeAtom,
    potCurrentGradeAtom,
    potTargetGradeAtom,
    potResetMethodAtom,
    potCubePriceAtom,
  } = useMolecule(ItemScouterMolecule);

  const [potType, setPotType] = useAtom(potTypeAtom);
  const [currentGrade, setCurrentGrade] = useAtom(potCurrentGradeAtom);
  const [targetGrade, setTargetGrade] = useAtom(potTargetGradeAtom);
  const [resetMethod, setResetMethod] = useAtom(potResetMethodAtom);
  const [cubePrice, setCubePrice] = useAtom(potCubePriceAtom);
  const [cubePriceTouched, setCubePriceTouched] = useState(false);

  const cubePriceError = pipe(
    cubePrice.value,
    E.match(identity, () => undefined),
  );

  // 현재 등급보다 높은 목표 등급만 필터링
  const gradeOrder: Potential.Grade[] = ["RARE", "EPIC", "UNIQUE", "LEGENDARY"];
  const currentGradeIdx = gradeOrder.indexOf(currentGrade);
  const targetGrades = gradeOrder.slice(currentGradeIdx + 1);

  // 선택한 타입+등급에 맞는 리셋 방법 필터링
  const availableResetMethods = Potential.resetMethods.filter(
    (method) =>
      Potential.gradesEnableToPromote[method]?.includes(currentGrade) &&
      Potential.typesEnableToReset[method]?.includes(potType),
  );

  return (
    <div className="flex flex-col gap-6">
      <SectionSubtitle>잠재능력 설정</SectionSubtitle>

      {/* 잠재 타입 */}
      <RadioGroup
        label="잠재능력 타입"
        size="sm"
        orientation="horizontal"
        value={potType}
        onValueChange={(v) => {
          const parsed = Potential.typeSchema.safeParse(v);
          if (parsed.success) setPotType(parsed.data);
        }}
      >
        {Potential.types.map((type) => (
          <Radio key={type} value={type}>
            {Potential.typeLabels[type]}
          </Radio>
        ))}
      </RadioGroup>

      {/* 현재 등급 / 목표 등급 */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="현재 등급"
          selectedKeys={[currentGrade]}
          onChange={(e) => {
            const parsed = Potential.gradeSchema.safeParse(e.target.value);
            if (parsed.success) {
              setCurrentGrade(parsed.data);
              // 목표가 현재보다 낮으면 초기화
              if (gradeOrder.indexOf(parsed.data) >= gradeOrder.indexOf(targetGrade)) {
                const newIdx = gradeOrder.indexOf(parsed.data) + 1;
                if (newIdx < gradeOrder.length) {
                  setTargetGrade(gradeOrder[newIdx]);
                }
              }
            }
          }}
        >
          {gradeOrder.slice(0, -1).map((grade) => (
            <SelectItem key={grade}>{Potential.gradeLabels[grade]}</SelectItem>
          ))}
        </Select>

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
      </div>

      {/* 큐브 종류 */}
      <Select
        label="큐브 종류"
        selectedKeys={[resetMethod]}
        onChange={(e) => {
          const parsed = Potential.resetMethodSchema.safeParse(e.target.value);
          if (parsed.success) setResetMethod(parsed.data);
        }}
      >
        {(availableResetMethods.length > 0
          ? availableResetMethods
          : Potential.resetMethods
        ).map((method) => (
          <SelectItem key={method}>
            {Potential.resetMethodLabels[method]}
          </SelectItem>
        ))}
      </Select>

      {/* 큐브 가격 */}
      <Input
        label="큐브 가격 (메소)"
        type="number"
        step="1"
        value={cubePrice.input}
        onValueChange={(v) => {
          setCubePriceTouched(true);
          setCubePrice(v);
        }}
        onBlur={() => setCubePriceTouched(true)}
        isInvalid={cubePriceTouched && !!cubePriceError}
        errorMessage={cubePriceTouched && cubePriceError}
        description="큐브 1개당 가격"
      />
    </div>
  );
};
