"use client";

import { useMolecule } from "bunshi/react";
import { useAtom } from "jotai";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { cx } from "~/shared/style";
import { Button } from "~/shared/ui";

const SCROLL_TYPES = [
  { key: "미사용" as const, label: "미사용" },
  { key: "70%" as const, label: "70%작" },
  { key: "30%" as const, label: "30%작" },
  { key: "15%" as const, label: "15%작" },
];

export const ScrollSettingsSectionContent = () => {
  const { scrollTypeAtom } = useMolecule(ItemScouterMolecule);
  const [scrollType, setScrollType] = useAtom(scrollTypeAtom);

  return (
    <div>
      <span className="text-xs text-default-500">주흔 종류</span>
      <div className="mt-2 flex overflow-hidden rounded-xl border border-default">
        {SCROLL_TYPES.map(({ key, label }) => (
          <Button
            key={key}
            className={cx(
              "w-0 flex-1 rounded-none border-default text-sm [&:nth-child(n+2)]:border-l",
              scrollType === key && "font-bold",
            )}
            variant={scrollType === key ? "flat" : "light"}
            color={scrollType === key ? "primary" : "default"}
            radius="none"
            onPress={() => setScrollType(key)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};
