"use client";

import { useMolecule } from "bunshi/react";
import { identity, pipe } from "fp-ts/lib/function";
import { useAtom } from "jotai";

import { StarforceSimulatorMolecule } from "~/app/(starforce-simulator)/sim/starforce/_lib/molecule";
import { E } from "~/shared/fp";
import { putUnit } from "~/shared/number";
import { Input } from "~/shared/ui";

export const SimulationCountInput = () => {
  const { simulationCountAtom } = useMolecule(StarforceSimulatorMolecule);
  const [simulationCount, setSimulationCount] = useAtom(simulationCountAtom);
  const errorMessage = pipe(
    simulationCount.value,
    E.match(identity, () => undefined),
  );

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-foreground">시뮬레이션 횟수</span>
      <Input
        type="text"
        inputMode="numeric"
        value={simulationCount.input}
        onValueChange={(value) => {
          setSimulationCount(value);
        }}
        isInvalid={!!errorMessage}
        errorMessage={errorMessage}
        description={pipe(
          simulationCount.value,
          E.matchW(() => undefined, putUnit),
        )}
      />
    </div>
  );
};
