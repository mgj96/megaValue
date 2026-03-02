"use client";

import { useMolecule } from "bunshi/react";
import { identity, pipe } from "fp-ts/lib/function";
import { useAtom, useAtomValue } from "jotai";
import { useState } from "react";
import { z } from "zod";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { Starforce } from "~/entities/starforce";
import { E } from "~/shared/fp";
import { keys } from "~/shared/object";
import { cx } from "~/shared/style";
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Input,
  Radio,
  RadioGroup,
} from "~/shared/ui";
import { SectionSubtitle } from "~/shared/ui/typographies";
import { parseZod } from "~/shared/zod";

const NONE = "none";

export const StarforceSettings = () => {
  const {
    levelAtom,
    sfCurrentStarAtom,
    sfTargetStarAtom,
    sfSpareCostAtom,
    sfSafeguardRecordAtom,
    sfStarcatchRecordAtom,
    sfEventAtom,
    sfDiscountsAtom,
  } = useMolecule(ItemScouterMolecule);

  const level = useAtomValue(levelAtom);
  const [currentStar, setCurrentStar] = useAtom(sfCurrentStarAtom);
  const [targetStar, setTargetStar] = useAtom(sfTargetStarAtom);
  const [spareCost, setSpareCost] = useAtom(sfSpareCostAtom);
  const [safeguardRecord, setSafeguardRecord] = useAtom(sfSafeguardRecordAtom);
  const [starcatchRecord, setStarcatchRecord] = useAtom(sfStarcatchRecordAtom);
  const [event, setEvent] = useAtom(sfEventAtom);
  const [discounts, setDiscounts] = useAtom(sfDiscountsAtom);

  const [currentStarTouched, setCurrentStarTouched] = useState(false);
  const [targetStarTouched, setTargetStarTouched] = useState(false);
  const [spareCostTouched, setSpareCostTouched] = useState(false);
  const [shouldSelectAllSafeguard, setShouldSelectAllSafeguard] =
    useState(true);
  const [shouldSelectAllStarcatch, setShouldSelectAllStarcatch] =
    useState(true);

  const levelValue = pipe(
    level.value,
    E.getOrElse(() => 200),
  );
  const reachableStar = Starforce.getReachableStar(levelValue);

  const currentStarError = pipe(
    currentStar.value,
    E.match(identity, () => undefined),
  );
  const targetStarError = pipe(
    targetStar.value,
    E.match(identity, () => undefined),
  );
  const spareCostError = pipe(
    spareCost.value,
    E.match(identity, () => undefined),
  );

  return (
    <div className="flex flex-col gap-6">
      <SectionSubtitle>스타포스 설정</SectionSubtitle>

      {/* 별 수 입력 */}
      <div className="grid grid-cols-3 gap-4">
        <Input
          label="현재 스타포스"
          type="number"
          step="1"
          value={currentStar.input}
          onValueChange={(v) => {
            setCurrentStarTouched(true);
            setCurrentStar(v);
          }}
          onBlur={() => setCurrentStarTouched(true)}
          isInvalid={currentStarTouched && !!currentStarError}
          errorMessage={currentStarTouched && currentStarError}
          description={`0 ~ ${reachableStar - 1}성`}
        />
        <Input
          label="목표 스타포스"
          type="number"
          step="1"
          value={targetStar.input}
          onValueChange={(v) => {
            setTargetStarTouched(true);
            setTargetStar(v);
          }}
          onBlur={() => setTargetStarTouched(true)}
          isInvalid={targetStarTouched && !!targetStarError}
          errorMessage={targetStarTouched && targetStarError}
          description={`1 ~ ${reachableStar}성`}
        />
        <Input
          label="스페어 비용 (메소)"
          type="number"
          step="1"
          value={spareCost.input}
          placeholder="0"
          onValueChange={(v) => {
            setSpareCostTouched(true);
            setSpareCost(v);
          }}
          onBlur={() => setSpareCostTouched(true)}
          isInvalid={spareCostTouched && !!spareCostError}
          errorMessage={spareCostTouched && spareCostError}
        />
      </div>

      {/* 파괴방지 */}
      <div>
        <div className="flex items-center">
          <SectionSubtitle>파괴방지</SectionSubtitle>
          <Button
            color="primary"
            size="sm"
            variant="light"
            className="ml-1"
            onPress={() => {
              setSafeguardRecord((prev) =>
                keys(prev).reduce<typeof safeguardRecord>(
                  (acc, key) => ({ ...acc, [key]: shouldSelectAllSafeguard }),
                  {},
                ),
              );
              setShouldSelectAllSafeguard((v) => !v);
            }}
          >
            {shouldSelectAllSafeguard ? "모두 선택" : "모두 해제"}
          </Button>
        </div>
        <div className="mt-2 flex overflow-hidden rounded-2xl border-1 border-default">
          {keys(safeguardRecord).map((star) => (
            <Button
              key={star}
              className="w-0 flex-1 border-default text-default-500 [&:nth-child(n+2)]:border-l"
              variant={safeguardRecord[star] ? "flat" : "light"}
              radius="none"
              onPress={() =>
                setSafeguardRecord((prev) => ({
                  ...prev,
                  [star]: !prev[star],
                }))
              }
            >
              {star}성
            </Button>
          ))}
        </div>
      </div>

      {/* 스타캐치 */}
      <div>
        <div className="flex items-center">
          <SectionSubtitle>스타캐치</SectionSubtitle>
          <Button
            color="primary"
            size="sm"
            variant="light"
            className="ml-1"
            onPress={() => {
              setStarcatchRecord((prev) =>
                keys(prev).reduce<typeof starcatchRecord>(
                  (acc, key) => ({ ...acc, [key]: shouldSelectAllStarcatch }),
                  {},
                ),
              );
              setShouldSelectAllStarcatch((v) => !v);
            }}
          >
            {shouldSelectAllStarcatch ? "모두 선택" : "모두 해제"}
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {keys(starcatchRecord).map((star) => (
            <Button
              key={star}
              size="sm"
              className="min-w-[3rem] border-default text-xs text-default-500"
              variant={starcatchRecord[star] ? "flat" : "light"}
              radius="md"
              onPress={() =>
                setStarcatchRecord((prev) => ({
                  ...prev,
                  [star]: !prev[star],
                }))
              }
            >
              {star}성
            </Button>
          ))}
        </div>
      </div>

      {/* 이벤트 */}
      <div>
        <SectionSubtitle>스타포스 이벤트</SectionSubtitle>
        <RadioGroup
          className="mt-2"
          value={event ?? NONE}
          size="sm"
          orientation="horizontal"
          onValueChange={(v) => {
            setEvent(
              pipe(
                v === NONE ? null : v,
                parseZod(Starforce.eventSchema.nullable()),
                E.getOrElseW(() => null),
              ),
            );
          }}
        >
          <Radio value={NONE}>없음</Radio>
          {Starforce.events.map((ev) => (
            <Radio
              key={ev}
              value={ev}
              classNames={{
                label: cx(
                  (ev === "샤타포스" || ev === "샤타포스(15 16 포함)") &&
                    "font-bold",
                ),
              }}
            >
              {Starforce.eventLabelRecord[ev]}
            </Radio>
          ))}
        </RadioGroup>
      </div>

      {/* 할인 */}
      <div>
        <SectionSubtitle>강화비용 할인</SectionSubtitle>
        <CheckboxGroup
          orientation="horizontal"
          size="sm"
          className="mt-2"
          value={discounts}
          onValueChange={(values) => {
            setDiscounts((prev) =>
              pipe(
                values,
                parseZod(z.array(Starforce.discountSchema)),
                E.map((vals) => {
                  const newValue = vals.find((v) => !prev.some((p) => p === v));
                  const isNotMVP = (
                    v: Starforce.Discount,
                  ): v is Exclude<
                    Starforce.Discount,
                    "MVP Silver" | "MVP Gold" | "MVP Diamond"
                  > =>
                    v !== "MVP Silver" &&
                    v !== "MVP Gold" &&
                    v !== "MVP Diamond";
                  if (newValue == null || isNotMVP(newValue)) return vals;
                  return [newValue, ...prev.filter(isNotMVP)];
                }),
                E.getOrElseW(() => prev),
              ),
            );
          }}
        >
          {Starforce.discounts.map((discount) => (
            <Checkbox key={discount} value={discount}>
              {Starforce.discountLabelRecord[discount]}
            </Checkbox>
          ))}
        </CheckboxGroup>
      </div>
    </div>
  );
};
