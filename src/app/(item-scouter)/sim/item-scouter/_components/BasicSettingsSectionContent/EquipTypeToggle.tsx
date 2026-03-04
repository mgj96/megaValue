"use client";

import { useMolecule } from "bunshi/react";
import { useAtom } from "jotai";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { cx } from "~/shared/style";
import { Button } from "~/shared/ui";

const ITEM_TYPES = ["방어구", "장신구"] as const;

export const EquipTypeToggle = () => {
  const { itemTypeAtom } = useMolecule(ItemScouterMolecule);
  const [itemType, setItemType] = useAtom(itemTypeAtom);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-default-500">장비 타입</span>
      <div className="flex overflow-hidden rounded-xl border border-default">
        {ITEM_TYPES.map((t) => (
          <Button
            key={t}
            className={cx(
              "w-0 flex-1 rounded-none border-default text-sm [&:nth-child(n+2)]:border-l",
              itemType === t && "font-bold",
            )}
            variant={itemType === t ? "flat" : "light"}
            color={itemType === t ? "primary" : "default"}
            radius="none"
            onPress={() => setItemType(t)}
          >
            {t}
          </Button>
        ))}
      </div>
    </div>
  );
};
