"use client";

import { useMolecule } from "bunshi/react";
import { pipe } from "fp-ts/lib/function";
import { useAtom } from "jotai";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { Starforce } from "~/entities/starforce";
import { E } from "~/shared/fp";
import { cx } from "~/shared/style";
import { Radio, RadioGroup, SectionSubtitle } from "~/shared/ui";
import { parseZod } from "~/shared/zod";

const NONE = "none";

export const EventRadioGroup = () => {
  const { sfEventAtom } = useMolecule(ItemScouterMolecule);
  const [event, setEvent] = useAtom(sfEventAtom);

  return (
    <div>
      <SectionSubtitle>스타포스 이벤트</SectionSubtitle>
      <RadioGroup
        className="mt-2"
        value={event ?? NONE}
        size="sm"
        orientation="horizontal"
        onValueChange={(v) => {
          setEvent(
            pipe(
              v === NONE ? null : v,
              parseZod(Starforce.eventSchema.nullable()),
              E.getOrElseW(() => null),
            ),
          );
        }}
      >
        <Radio value={NONE}>없음</Radio>
        {Starforce.events.map((ev) => (
          <Radio
            key={ev}
            value={ev}
            classNames={{
              label: cx(
                (ev === "샤타포스" || ev === "샤타포스(15 16 포함)") &&
                  "font-bold",
              ),
            }}
          >
            {Starforce.eventLabelRecord[ev]}
          </Radio>
        ))}
      </RadioGroup>
    </div>
  );
};
