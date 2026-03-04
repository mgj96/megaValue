"use client";

import { useMolecule } from "bunshi/react";
import { useAtom } from "jotai";
import { useState } from "react";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { keys } from "~/shared/object";
import { Button, SectionSubtitle } from "~/shared/ui";

export const StarcatchButtonGroup = () => {
  const [shouldSelectAll, setShouldSelectAll] = useState(true);
  const { sfStarcatchRecordAtom } = useMolecule(ItemScouterMolecule);
  const [starcatchRecord, setStarcatchRecord] = useAtom(sfStarcatchRecordAtom);

  return (
    <div>
      <div className="flex items-center">
        <SectionSubtitle>스타캐치</SectionSubtitle>
        <Button
          color="primary"
          size="sm"
          variant="light"
          className="ml-1"
          onPress={() => {
            setStarcatchRecord((prev) =>
              keys(prev).reduce<typeof starcatchRecord>(
                (acc, key) => ({ ...acc, [key]: shouldSelectAll }),
                {},
              ),
            );
            setShouldSelectAll((v) => !v);
          }}
        >
          {shouldSelectAll ? "모두 선택" : "모두 해제"}
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {keys(starcatchRecord).map((star) => (
          <Button
            key={star}
            size="sm"
            className="min-w-[3rem] border-default text-xs text-default-500"
            variant={starcatchRecord[star] ? "flat" : "light"}
            radius="md"
            onPress={() =>
              setStarcatchRecord((prev) => ({
                ...prev,
                [star]: !prev[star],
              }))
            }
          >
            {star}성
          </Button>
        ))}
      </div>
    </div>
  );
};
