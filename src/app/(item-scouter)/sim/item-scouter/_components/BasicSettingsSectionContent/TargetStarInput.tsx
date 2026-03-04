"use client";

import { useMolecule } from "bunshi/react";
import { identity, pipe } from "fp-ts/lib/function";
import { useAtom, useAtomValue } from "jotai";
import { useState } from "react";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { Starforce } from "~/entities/starforce";
import { E } from "~/shared/fp";
import { Input } from "~/shared/ui";

export const TargetStarInput = () => {
  const [touched, setTouched] = useState(false);
  const { sfTargetStarAtom, levelAtom } = useMolecule(ItemScouterMolecule);
  const level = useAtomValue(levelAtom);
  const [targetStar, setTargetStar] = useAtom(sfTargetStarAtom);

  const levelValue = pipe(
    level.value,
    E.getOrElse(() => 200),
  );
  const reachableStar = Starforce.getReachableStar(levelValue);
  const errorMessage = pipe(
    targetStar.value,
    E.match(identity, () => undefined),
  );

  return (
    <Input
      label="목표 성급"
      type="number"
      step="1"
      value={targetStar.input}
      onValueChange={(v) => {
        setTouched(true);
        setTargetStar(v);
      }}
      onBlur={() => setTouched(true)}
      onFocus={(e) => e.target.select()}
      isInvalid={touched && !!errorMessage}
      errorMessage={touched && errorMessage}
      description={`1 ~ ${reachableStar}성`}
    />
  );
};
