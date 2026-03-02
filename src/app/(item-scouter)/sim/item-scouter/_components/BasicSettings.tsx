"use client";

import { useMolecule } from "bunshi/react";
import { identity, pipe } from "fp-ts/lib/function";
import { useAtom } from "jotai";
import { useState } from "react";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { E } from "~/shared/fp";
import { Input } from "~/shared/ui";
import { SectionSubtitle } from "~/shared/ui/typographies";

export const BasicSettings = () => {
  const { levelAtom } = useMolecule(ItemScouterMolecule);
  const [level, setLevel] = useAtom(levelAtom);
  const [touched, setTouched] = useState(false);

  const errorMessage = pipe(
    level.value,
    E.match(identity, () => undefined),
  );

  return (
    <div className="flex flex-col gap-4">
      <SectionSubtitle>장비 설정</SectionSubtitle>
      <Input
        label="장비 레벨"
        type="number"
        step="1"
        value={level.input}
        onValueChange={(value) => {
          setTouched(true);
          setLevel(value);
        }}
        onBlur={() => setTouched(true)}
        isInvalid={touched && !!errorMessage}
        errorMessage={touched && errorMessage}
      />
    </div>
  );
};
