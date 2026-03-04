"use client";

import { useMolecule } from "bunshi/react";
import { pipe } from "fp-ts/lib/function";
import { useAtom } from "jotai";
import { z } from "zod";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { Starforce } from "~/entities/starforce";
import { E } from "~/shared/fp";
import { Checkbox, CheckboxGroup, SectionSubtitle } from "~/shared/ui";
import { parseZod } from "~/shared/zod";

export const DiscountCheckboxGroup = () => {
  const { sfDiscountsAtom } = useMolecule(ItemScouterMolecule);
  const [discounts, setDiscounts] = useAtom(sfDiscountsAtom);

  return (
    <div>
      <SectionSubtitle>강화비용 할인</SectionSubtitle>
      <CheckboxGroup
        orientation="horizontal"
        size="sm"
        className="mt-2"
        value={discounts}
        onValueChange={(values) => {
          setDiscounts((prev) =>
            pipe(
              values,
              parseZod(z.array(Starforce.discountSchema)),
              E.map((vals) => {
                const newValue = vals.find((v) => !prev.some((p) => p === v));
                const isNotMVP = (
                  v: Starforce.Discount,
                ): v is Exclude<
                  Starforce.Discount,
                  "MVP Silver" | "MVP Gold" | "MVP Diamond"
                > =>
                  v !== "MVP Silver" && v !== "MVP Gold" && v !== "MVP Diamond";
                if (newValue == null || isNotMVP(newValue)) return vals;
                return [newValue, ...prev.filter(isNotMVP)];
              }),
              E.getOrElseW(() => prev),
            ),
          );
        }}
      >
        {Starforce.discounts.map((discount) => (
          <Checkbox key={discount} value={discount}>
            {Starforce.discountLabelRecord[discount]}
          </Checkbox>
        ))}
      </CheckboxGroup>
    </div>
  );
};
