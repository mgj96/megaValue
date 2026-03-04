"use client";

import { useMolecule } from "bunshi/react";
import { useAtom } from "jotai";
import { useState } from "react";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { keys } from "~/shared/object";
import { Button, SectionSubtitle } from "~/shared/ui";

export const SafeguardButtonGroup = () => {
  const [shouldSelectAll, setShouldSelectAll] = useState(true);
  const { sfSafeguardRecordAtom } = useMolecule(ItemScouterMolecule);
  const [safeguardRecord, setSafeguardRecord] = useAtom(sfSafeguardRecordAtom);

  return (
    <div>
      <div className="flex items-center">
        <SectionSubtitle>파괴방지</SectionSubtitle>
        <Button
          color="primary"
          size="sm"
          variant="light"
          className="ml-1"
          onPress={() => {
            setSafeguardRecord((prev) =>
              keys(prev).reduce<typeof safeguardRecord>(
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
      <div className="mt-2 flex overflow-hidden rounded-2xl border-1 border-default">
        {keys(safeguardRecord).map((star) => (
          <Button
            key={star}
            className="w-0 flex-1 border-default text-default-500 [&:nth-child(n+2)]:border-l"
            variant={safeguardRecord[star] ? "flat" : "light"}
            radius="none"
            onPress={() =>
              setSafeguardRecord((prev) => ({
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
