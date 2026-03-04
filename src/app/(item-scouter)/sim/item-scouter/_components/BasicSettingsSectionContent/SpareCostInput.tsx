"use client";

import { useMolecule } from "bunshi/react";
import { pipe } from "fp-ts/lib/function";
import { useAtom } from "jotai";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { E } from "~/shared/fp";
import { putUnit } from "~/shared/number";
import { Input } from "~/shared/ui";

export const SpareCostInput = () => {
  const { sfSpareCostAtom } = useMolecule(ItemScouterMolecule);
  const [spareCost, setSpareCost] = useAtom(sfSpareCostAtom);
  const spareCostValue = pipe(
    spareCost.value,
    E.getOrElse(() => 0),
  );

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-default-500">장비 원가</span>
        <button
          type="button"
          className="flex items-center gap-0.5 text-xs text-primary-400 opacity-50"
          disabled
          title="준비 중"
        >
          <span>시세 연동</span>
        </button>
      </div>
      <Input
        type="number"
        step="1"
        placeholder="0"
        value={spareCost.input}
        onValueChange={(v) => setSpareCost(v)}
        onFocus={(e) => e.target.select()}
        aria-label="장비 원가 (메소)"
      />
      {spareCost.input && (
        <span className="text-right text-xs text-default-400">
          = {putUnit(spareCostValue)}
        </span>
      )}
    </div>
  );
};
