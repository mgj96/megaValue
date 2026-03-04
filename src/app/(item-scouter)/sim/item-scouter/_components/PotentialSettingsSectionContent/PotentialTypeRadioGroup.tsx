"use client";

import { useMolecule } from "bunshi/react";
import { useAtom } from "jotai";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { Potential } from "~/entities/potential";
import { Radio, RadioGroup, SectionSubtitle } from "~/shared/ui";

export const PotentialTypeRadioGroup = () => {
  const { potTypeAtom } = useMolecule(ItemScouterMolecule);
  const [potType, setPotType] = useAtom(potTypeAtom);

  return (
    <div>
      <SectionSubtitle>잠재능력 타입</SectionSubtitle>
      <RadioGroup
        className="mt-2"
        size="sm"
        orientation="horizontal"
        value={potType}
        onValueChange={(v) => {
          const parsed = Potential.typeSchema.safeParse(v);
          if (parsed.success) setPotType(parsed.data);
        }}
      >
        {Potential.types.map((type) => (
          <Radio key={type} value={type}>
            {Potential.typeLabels[type]}
          </Radio>
        ))}
      </RadioGroup>
    </div>
  );
};
