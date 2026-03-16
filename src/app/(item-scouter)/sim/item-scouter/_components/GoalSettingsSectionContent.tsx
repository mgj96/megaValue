"use client";

import { useMolecule } from "bunshi/react";
import { pipe } from "fp-ts/lib/function";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useRef } from "react";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import {
  mapStarforceGoalResultToCommonShape,
  simulateStarforceGoal,
} from "~/entities/starforce/goal-simulator";
import { E } from "~/shared/fp";
import { putUnit } from "~/shared/number";
import { Button, Input } from "~/shared/ui";

const DEFAULT_ITERATIONS = 10_000;

interface GoalSettingsSectionContentProps {
  /** true면 상단 헤더용 한 줄 배치 (예산 입력 + 버튼) */
  variant?: "default" | "inline";
}

export const GoalSettingsSectionContent = ({
  variant = "default",
}: GoalSettingsSectionContentProps) => {
  const {
    levelAtom,
    sfCurrentStarAtom,
    sfTargetStarAtom,
    sfSpareCostAtom,
    sfSafeguardRecordAtom,
    sfStarcatchRecordAtom,
    sfEventAtom,
    sfGoalBudgetAtom,
    sfGoalSimulationResultAtom,
    sfGoalSimulationRunningAtom,
  } = useMolecule(ItemScouterMolecule);

  const level = useAtomValue(levelAtom);
  const currentStarPayload = useAtomValue(sfCurrentStarAtom);
  const targetStarPayload = useAtomValue(sfTargetStarAtom);
  const spareCostPayload = useAtomValue(sfSpareCostAtom);
  const [goalBudgetPayload, setGoalBudget] = useAtom(sfGoalBudgetAtom);
  const safeguardRecord = useAtomValue(sfSafeguardRecordAtom);
  const starcatchRecord = useAtomValue(sfStarcatchRecordAtom);
  const event = useAtomValue(sfEventAtom);
  const isRunning = useAtomValue(sfGoalSimulationRunningAtom);
  const setGoalResult = useSetAtom(sfGoalSimulationResultAtom);
  const setGoalRunning = useSetAtom(sfGoalSimulationRunningAtom);

  // 클릭 시점의 예산을 쓰기 위해 ref에 최신값 유지 (클로저/배치 이슈 방지)
  const goalBudgetValueRef = useRef(goalBudgetPayload.value);
  goalBudgetValueRef.current = goalBudgetPayload.value;

  const runGoalSimulation = useCallback(() => {
    const levelValue = pipe(level.value, E.getOrElse(() => 200));
    const currentStar = pipe(
      currentStarPayload.value,
      E.getOrElse(() => 0),
    );
    const targetStar = pipe(
      targetStarPayload.value,
      E.getOrElse(() => 0),
    );
    const spareCost = pipe(spareCostPayload.value, E.getOrElse(() => 0));
    const budget = pipe(
      goalBudgetValueRef.current,
      E.getOrElse(() => 1_000_000_000),
    );

    setGoalRunning(true);
    setTimeout(() => {
      try {
        const result = simulateStarforceGoal({
          currentStar,
          targetStar,
          equipLevel: levelValue,
          budget,
          iterations: DEFAULT_ITERATIONS,
          starcatchRecord: starcatchRecord as { [key: number]: boolean },
          safeguardRecord: safeguardRecord as { [key: number]: boolean },
          event,
          spareCost,
        });
        const { summary, distribution } =
          mapStarforceGoalResultToCommonShape(result);
        setGoalResult({ summary, distribution, budget });
      } catch {
        setGoalResult(null);
      } finally {
        setGoalRunning(false);
      }
    }, 0);
  }, [
    level.value,
    currentStarPayload.value,
    targetStarPayload.value,
    spareCostPayload.value,
    goalBudgetPayload.value,
    starcatchRecord,
    safeguardRecord,
    event,
    setGoalResult,
    setGoalRunning,
  ]);

  const budgetText = pipe(
    goalBudgetPayload.value,
    E.match(
      () => null,
      (메소) => `${putUnit(메소)} 메소`,
    ),
  );

  const canRun = pipe(
    E.Do,
    E.apS("level", level.value),
    E.apS("currentStar", currentStarPayload.value),
    E.apS("targetStar", targetStarPayload.value),
    E.apS("budget", goalBudgetPayload.value),
    E.isRight,
  );

  const isInline = variant === "inline";

  return (
    <div
      className={
        isInline
          ? "flex flex-wrap items-end gap-2"
          : "flex flex-col gap-4"
      }
    >
      <div className={isInline ? "min-w-[100px] max-w-[120px]" : undefined}>
        <Input
          label={isInline ? "목표 예산 (억)" : "목표 달성 예산 (억)"}
          type="text"
          inputMode="decimal"
          value={goalBudgetPayload.input}
          onValueChange={setGoalBudget}
          description={
            isInline
              ? budgetText ?? undefined
              : budgetText
                ? `${budgetText} · 이 예산 안에서 목표 달성 확률을 시뮬레이션합니다`
                : "단위: 억 (1 = 1억 메소). 입력 시 만/억으로 표시됩니다."
          }
        />
      </div>
      <Button
        color="primary"
        onPress={runGoalSimulation}
        isDisabled={!canRun || isRunning}
        isLoading={isRunning}
        size={isInline ? "md" : "lg"}
      >
        {isRunning ? "시뮬레이션 중..." : "목표 달성 시뮬"}
      </Button>
    </div>
  );
};
