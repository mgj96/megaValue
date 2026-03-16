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
import type { SimulateTraceOutput } from "~/entities/equip/workers/types";
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
    scrollInputsAtom,
    scrollInputsErrorMessageAtom,
    sfCostsAtom,
    sfDestroyedCountsAtom,
    sfIsCalculatingAtom,
    potResultAtom,
    potCostsAtom,
    potIsCalculatingAtom,
    scrollCostsAtom,
    scrollIsCalculatingAtom,
    sfEnabledAtom,
    potEnabledAtom,
    scrollEnabledAtom,
  } = useMolecule(ItemScouterMolecule);

  const sfEnabled = useAtomValue(sfEnabledAtom);
  const potEnabled = useAtomValue(potEnabledAtom);
  const scrollEnabled = useAtomValue(scrollEnabledAtom);
  const sfInputsErrorMessage = useAtomValue(sfInputsErrorMessageAtom);
  const potInputsErrorMessage = useAtomValue(potInputsErrorMessageAtom);
  const scrollInputsErrorMessage = useAtomValue(scrollInputsErrorMessageAtom);

  const [sfIsCalculating, setSfIsCalculating] = useAtom(sfIsCalculatingAtom);
  const [potIsCalculating, setPotIsCalculating] = useAtom(potIsCalculatingAtom);
  const [scrollIsCalculating, setScrollIsCalculating] = useAtom(scrollIsCalculatingAtom);
  const [, setSfCosts] = useAtom(sfCostsAtom);
  const [, setSfDestroyedCounts] = useAtom(sfDestroyedCountsAtom);
  const [, setPotResult] = useAtom(potResultAtom);
  const [, setPotCosts] = useAtom(potCostsAtom);
  const [, setScrollCosts] = useAtom(scrollCostsAtom);

  const isCalculating =
    sfIsCalculating || potIsCalculating || scrollIsCalculating;

  const canRunStarforce = sfEnabled && !sfInputsErrorMessage;
  const canRunPotential = potEnabled && !potInputsErrorMessage;
  const canRunScroll = scrollEnabled && !scrollInputsErrorMessage;

  const canRunAny = canRunStarforce || canRunPotential || canRunScroll;

  const errorMessage =
    (sfEnabled && sfInputsErrorMessage) ||
    (potEnabled && potInputsErrorMessage) ||
    (scrollEnabled && scrollInputsErrorMessage) ||
    null;

  const isDisabled = !canRunAny || isCalculating;

  const tooltipMessage =
    !canRunAny && errorMessage
      ? errorMessage
      : canRunAny && errorMessage
        ? "일부 항목에 오류가 있어 해당 항목만 제외하고 시뮬레이션합니다."
        : null;

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
          
          const simulationTotalCount = 10000;
          const allCosts: number[] = new Array(simulationTotalCount).fill(0);

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
            
            // 큐브 시뮬레이션을 위한 임의 분포 (간단한 이항 시뮬레이션: 천장 지원)
            const prob = record.probability;
            const ceil = record.ceil;
            for (let j = 0; j < simulationTotalCount; j++) {
              let count = 0;
              let success = false;
              while (!success) {
                count++;
                if (Math.random() <= prob) success = true;
                if (ceil && count >= ceil) success = true;
              }
              allCosts[j] += count * cubePrice;
            }
          }
          
          allCosts.sort((a, b) => a - b);
          setPotCosts(allCosts);
          setPotResult(results);
        } finally {
          setPotIsCalculating(false);
        }
      },
      [potInputsAtom, queryClient, setPotIsCalculating, setPotResult, setPotCosts],
    ),
  );

  const traceWorkers = useRef<Worker[]>([]);
  const finishedTraceWorkerCount = useRef(0);
  const localTraceCosts = useRef<number[]>([]);

  const handleTraceWorkerOutput = useAtomCallback(
    useCallback(
      (_, set, output: SimulateTraceOutput) => {
        if (output.type === "calculating") {
          // You could add progress state if needed
        } else {
          finishedTraceWorkerCount.current += 1;
          localTraceCosts.current = [...localTraceCosts.current, ...output.costs];
        }

        if (finishedTraceWorkerCount.current === traceWorkers.current.length) {
          localTraceCosts.current.sort((a, b) => a - b);
          setScrollCosts(localTraceCosts.current);
          setScrollIsCalculating(false);
        }
      },
      [setScrollCosts, setScrollIsCalculating],
    ),
  );

  const startTraceCalc = useAtomCallback(
    useCallback(
      (get) => {
        const inputs = E.getOrElseW(() => null)(get(scrollInputsAtom));
        if (!inputs) return;

        const simulationTotalCount = 10000; // 좀 더 가벼운 횟수 
        const simulationSetCount = Math.min(10, simulationTotalCount);
        const simulationUnitCount = Math.floor(
          simulationTotalCount / simulationSetCount,
        );

        const simulationWorkerSetCount = Math.max(
          1,
          Math.floor(simulationSetCount / maxWorkerCount.current),
        );

        traceWorkers.current = Array.from({
          length: Math.min(maxWorkerCount.current, simulationTotalCount),
        }).map((_, index, arr) => {
          const worker = new Worker(
            new URL(
              "~/entities/equip/workers/simulateTrace.ts",
              import.meta.url,
            ),
          );

          worker.onmessage = (event: MessageEvent<SimulateTraceOutput>) => {
            handleTraceWorkerOutput(event.data);
          };

          worker.postMessage({
            ...inputs,
            tracePrice: Number(inputs.tracePrice) || 2000,
            slotCount: Number(inputs.slotCount) || 8,
            ...(index === arr.length - 1
              ? {
                  simulationTotalCount:
                    simulationTotalCount -
                    (arr.length - 1) *
                      simulationWorkerSetCount *
                      simulationUnitCount,
                }
              : {
                  simulationTotalCount:
                    simulationWorkerSetCount * simulationUnitCount,
                }),
          });

          return worker;
        });
      },
      [handleTraceWorkerOutput, scrollInputsAtom],
    ),
  );

  const handleCalculate = useAtomCallback(
    useCallback(
      (_get) => {
        setProgress(0);
        finishedWorkerCount.current = 0;
        localCosts.current = [];
        localDestroyedCounts.current = [];
        
        finishedTraceWorkerCount.current = 0;
        localTraceCosts.current = [];

        if (canRunStarforce) {
          setSfIsCalculating(true);
          startStarforceCalc();
        }

        if (canRunPotential) {
          setPotIsCalculating(true);
          startPotentialCalc();
        }

        if (canRunScroll) {
          setScrollIsCalculating(true);
          startTraceCalc();
        }
      },
      [
        canRunStarforce,
        canRunPotential,
        canRunScroll,
        setSfIsCalculating,
        setPotIsCalculating,
        setScrollIsCalculating,
        startStarforceCalc,
        startPotentialCalc,
        startTraceCalc,
      ],
    ),
  );

  const cancelCalculate = () => {
    workers.current.forEach((w) => w.terminate());
    traceWorkers.current.forEach((w) => w.terminate());
    setSfIsCalculating(false);
    setPotIsCalculating(false);
    setScrollIsCalculating(false);
  };

  useIsomorphicLayoutEffect(() => {
    maxWorkerCount.current = Math.max(
      1,
      Math.floor(navigator.hardwareConcurrency * 0.5),
    );
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Tooltip content={tooltipMessage} isDisabled={tooltipMessage == null}>
        <Button
          color={isCalculating ? "default" : "primary"}
          size="md"
          onPress={() => handleCalculate()}
          isDisabled={isDisabled}
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
