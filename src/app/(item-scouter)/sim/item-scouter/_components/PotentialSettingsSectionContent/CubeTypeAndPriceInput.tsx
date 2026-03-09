"use client";

import { SelectItem } from "@heroui/react";
import { useMolecule } from "bunshi/react";
import { identity, pipe } from "fp-ts/lib/function";
import { useAtom, useAtomValue } from "jotai";
import { useState } from "react";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { Potential } from "~/entities/potential";
import { E, O } from "~/shared/fp";
import { convertToNumber, putUnit } from "~/shared/number";
import { Input, Select } from "~/shared/ui";

export const CubeTypeAndPriceInput = () => {
  const {
    potResetMethodAtom,
    potCubePriceAtom,
    potTypeAtom,
    potCurrentGradeAtom,
  } = useMolecule(ItemScouterMolecule);
  const [resetMethod, setResetMethod] = useAtom(potResetMethodAtom);
  const [cubePrice, setCubePrice] = useAtom(potCubePriceAtom);
  const [cubePriceTouched, setCubePriceTouched] = useState(false);
  const potType = useAtomValue(potTypeAtom);
  const currentGrade = useAtomValue(potCurrentGradeAtom);

  const cubePriceError = pipe(
    cubePrice.value,
    E.match(identity, () => undefined),
  );

  const availableResetMethods = Potential.resetMethods.filter(
    (method) =>
      Potential.gradesEnableToPromote[method]?.includes(currentGrade) &&
      Potential.typesEnableToReset[method]?.includes(potType),
  );

  const formattedPrice = pipe(
    cubePrice.input,
    convertToNumber,
    O.match(
      () => "",
      (n) => `(${putUnit(n)})`,
    ),
  );

  return (
    <>
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
        description={`큐브 1개당 가격 ${formattedPrice}`}
      />
    </>
  );
};
