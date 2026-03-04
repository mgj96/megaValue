"use client";

import { Tooltip } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useMolecule } from "bunshi/react";
import { useAtom, useAtomValue } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { useCallback, useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "usehooks-ts";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import type {
  SimulateStarforceInput,
  SimulateStarforceOutput,
} from "~/entities/starforce/workers/types";
import { PotentialQueries } from "~/features/get-potential-data/queries";
import { E } from "~/shared/fp";
import { maxFractionDigits, maxFractionDigitsString } from "~/shared/math";
import { Button } from "~/shared/ui";

const gradeOrder = ["RARE", "EPIC", "UNIQUE", "LEGENDARY"] as const;

function expectedCubesWithCeil(probability: number, ceil?: number): number {
  if (!ceil || ceil <= 0) return 1 / probability;
  // E[X capped at N] = (1 - (1-p)^N) / p
  return (1 - Math.pow(1 - probability, ceil)) / probability;
}

export const CalculateButton = () => {
  const queryClient = useQueryClient();
  const maxWorkerCount = useRef(1);
  const workers = useRef<Worker[]>([]);
  const localCosts = useRef<number[]>([]);
  const localDestroyedCounts = useRef<number[]>([]);
  const finishedWorkerCount = useRef(0);
  const [progress, setProgress] = useState(0);

  const {
    sfInputsAtom,
    sfInputsErrorMessageAtom,
    potInputsAtom,
    potInputsErrorMessageAtom,
    sfCostsAtom,
    sfDestroyedCountsAtom,
    sfIsCalculatingAtom,
    potResultAtom,
    potIsCalculatingAtom,
    sfEnabledAtom,
    potEnabledAtom,
  } = useMolecule(ItemScouterMolecule);

  const sfEnabled = useAtomValue(sfEnabledAtom);
  const potEnabled = useAtomValue(potEnabledAtom);
  const sfInputsErrorMessage = useAtomValue(sfInputsErrorMessageAtom);
  const potInputsErrorMessage = useAtomValue(potInputsErrorMessageAtom);

  const [sfIsCalculating, setSfIsCalculating] = useAtom(sfIsCalculatingAtom);
  const [potIsCalculating, setPotIsCalculating] = useAtom(potIsCalculatingAtom);
  const [, setSfCosts] = useAtom(sfCostsAtom);
  const [, setSfDestroyedCounts] = useAtom(sfDestroyedCountsAtom);
  const [, setPotResult] = useAtom(potResultAtom);

  const isCalculating = sfIsCalculating || potIsCalculating;

  const errorMessage =
    (sfEnabled ? sfInputsErrorMessage : null) ??
    (potEnabled ? potInputsErrorMessage : null);

  const handleWorkerOutput = useAtomCallback(
    useCallback(
      (_, set, output: SimulateStarforceOutput, progressUnit: number) => {
        if (output.type === "calculating") {
          setProgress((prev) => Math.min(100, prev + progressUnit));
        } else {
          finishedWorkerCount.current += 1;
          localCosts.current = [...localCosts.current, ...output.costs];
          localDestroyedCounts.current = [
            ...localDestroyedCounts.current,
            ...output.destroyedCounts,
          ];
        }

        if (finishedWorkerCount.current === workers.current.length) {
          localCosts.current.sort((a, b) => a - b);
          localDestroyedCounts.current.sort((a, b) => a - b);
          setSfCosts(localCosts.current);
          setSfDestroyedCounts(localDestroyedCounts.current);
          setSfIsCalculating(false);
        }
      },
      [setSfCosts, setSfDestroyedCounts, setSfIsCalculating],
    ),
  );

  const startStarforceCalc = useAtomCallback(
    useCallback(
      (get) => {
        const inputs = E.getOrElseW(() => null)(get(sfInputsAtom));
        if (!inputs) return;

        const simulationTotalCount = 100000;
        const simulationSetCount = Math.min(100, simulationTotalCount);
        const simulationUnitCount = Math.floor(
          simulationTotalCount / simulationSetCount,
        );
        const progressUnit = maxFractionDigits(2)(100 / simulationSetCount);

        const simulationWorkerSetCount = Math.max(
          1,
          Math.floor(simulationSetCount / maxWorkerCount.current),
        );

        // map으로 생성+설정을 한 번에 처리 (no-param-reassign 방지)
        workers.current = Array.from({
          length: Math.min(maxWorkerCount.current, simulationTotalCount),
        }).map((_, index, arr) => {
          const worker = new Worker(
            new URL(
              "~/entities/starforce/workers/simulateStarforce.ts",
              import.meta.url,
            ),
          );

          worker.onmessage = (event: MessageEvent<SimulateStarforceOutput>) => {
            handleWorkerOutput(event.data, progressUnit);
          };

          worker.postMessage({
            ...inputs,
            ...(index === arr.length - 1
              ? {
                  simulationTotalCount:
                    simulationTotalCount -
                    (arr.length - 1) *
                      simulationWorkerSetCount *
                      simulationUnitCount,
                  simulationSetCount:
                    simulationSetCount -
                    (arr.length - 1) * simulationWorkerSetCount,
                }
              : {
                  simulationTotalCount:
                    simulationWorkerSetCount * simulationUnitCount,
                  simulationSetCount: simulationWorkerSetCount,
                }),
          } satisfies SimulateStarforceInput);

          return worker;
        });
      },
      [handleWorkerOutput, sfInputsAtom],
    ),
  );

  const startPotentialCalc = useAtomCallback(
    useCallback(
      async (get) => {
        const inputs = E.getOrElseW(() => null)(get(potInputsAtom));
        if (!inputs) return;

        const { currentGrade, targetGrade, resetMethod, cubePrice } = inputs;

        const currentIdx = gradeOrder.indexOf(currentGrade);
        const targetIdx = gradeOrder.indexOf(targetGrade);

        if (currentIdx >= targetIdx) {
          setPotIsCalculating(false);
          return;
        }

        try {
          const results: { expectedCount: number; expectedCost: number }[] = [];

          for (let i = currentIdx; i < targetIdx; i++) {
            const grade = gradeOrder[i];
            const record = await queryClient.fetchQuery(
              PotentialQueries.useGradeUpRecord.getOptions({
                method: resetMethod,
                grade,
              }),
            );

            if (!record) continue;

            const expectedCount = expectedCubesWithCeil(
              record.probability,
              record.ceil,
            );
            results.push({
              expectedCount,
              expectedCost: expectedCount * cubePrice,
            });
          }

          setPotResult(results);
        } finally {
          setPotIsCalculating(false);
        }
      },
      [potInputsAtom, queryClient, setPotIsCalculating, setPotResult],
    ),
  );

  const handleCalculate = useAtomCallback(
    useCallback(
      (_get) => {
        setProgress(0);
        finishedWorkerCount.current = 0;
        localCosts.current = [];
        localDestroyedCounts.current = [];

        if (sfEnabled) {
          setSfIsCalculating(true);
          startStarforceCalc();
        }

        if (potEnabled) {
          setPotIsCalculating(true);
          startPotentialCalc();
        }
      },
      [
        sfEnabled,
        potEnabled,
        setSfIsCalculating,
        setPotIsCalculating,
        startStarforceCalc,
        startPotentialCalc,
      ],
    ),
  );

  const cancelCalculate = () => {
    workers.current.forEach((w) => w.terminate());
    setSfIsCalculating(false);
    setPotIsCalculating(false);
  };

  useIsomorphicLayoutEffect(() => {
    maxWorkerCount.current = Math.max(
      1,
      Math.floor(navigator.hardwareConcurrency * 0.5),
    );
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Tooltip content={errorMessage} isDisabled={errorMessage == null}>
        <Button
          color={isCalculating ? "default" : "primary"}
          size="md"
          onPress={() => handleCalculate()}
          isDisabled={!!errorMessage || isCalculating}
          isLoading={isCalculating}
          startContent={!isCalculating ? <span>↗</span> : undefined}
        >
          {isCalculating
            ? `계산 중...${sfEnabled ? `${maxFractionDigitsString(0)(progress)}%` : ""}`
            : "시뮬레이션 시작"}
        </Button>
      </Tooltip>
      {isCalculating && (
        <Button
          size="md"
          variant="flat"
          color="default"
          onPress={cancelCalculate}
        >
          취소
        </Button>
      )}
    </div>
  );
};
