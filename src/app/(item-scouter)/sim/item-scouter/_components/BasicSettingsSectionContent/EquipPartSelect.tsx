"use client";

import { SelectItem } from "@heroui/react";
import { useMolecule } from "bunshi/react";
import { useAtom } from "jotai";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { equips, type Equip } from "~/entities/equip";
import { Select } from "~/shared/ui";

export const EquipPartSelect = () => {
  const { equipPartAtom } = useMolecule(ItemScouterMolecule);
  const [equipPart, setEquipPart] = useAtom(equipPartAtom);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-default-500">장비 부위</span>
      <Select
        aria-label="장비 부위"
        placeholder="장비 부위 선택"
        selectedKeys={[equipPart]}
        onChange={(e) => {
          if (e.target.value) {
            setEquipPart(e.target.value as Equip);
          }
        }}
        size="md"
        classNames={{
          trigger: "h-10 min-h-10",
        }}
      >
        {equips.map((part) => (
          <SelectItem key={part}>{part}</SelectItem>
        ))}
      </Select>
    </div>
  );
};
