"use client";

import { useMolecule } from "bunshi/react";
import { identity, pipe } from "fp-ts/lib/function";
import { useAtom, useAtomValue } from "jotai";
import { useState } from "react";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { Starforce } from "~/entities/starforce";
import { E } from "~/shared/fp";
import { Input } from "~/shared/ui";

export const CurrentStarInput = () => {
  const [touched, setTouched] = useState(false);
  const { sfCurrentStarAtom, levelAtom } = useMolecule(ItemScouterMolecule);
  const level = useAtomValue(levelAtom);
  const [currentStar, setCurrentStar] = useAtom(sfCurrentStarAtom);

  const levelValue = pipe(
    level.value,
    E.getOrElse(() => 200),
  );
  const reachableStar = Starforce.getReachableStar(levelValue);
  const errorMessage = pipe(
    currentStar.value,
    E.match(identity, () => undefined),
  );

  return (
    <Input
      label="현재 성급"
      type="number"
      step="1"
      value={currentStar.input}
      onValueChange={(v) => {
        setTouched(true);
        setCurrentStar(v);
      }}
      onBlur={() => setTouched(true)}
      onFocus={(e) => e.target.select()}
      isInvalid={touched && !!errorMessage}
      errorMessage={touched && errorMessage}
      description={`0 ~ ${reachableStar - 1}성`}
    />
  );
};
