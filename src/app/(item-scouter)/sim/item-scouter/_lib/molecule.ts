"use client";

import { molecule, type MoleculeConstructor } from "bunshi";
import { flow, identity, pipe } from "fp-ts/lib/function";
import { atom } from "jotai";
import { z } from "zod";

import type { Potential } from "~/entities/potential";
import { Starforce } from "~/entities/starforce";
import { E, O } from "~/shared/fp";
import { convertToNumber } from "~/shared/number";
import { type FormPayload } from "~/shared/react";
import { parseZodWithErrorMessage } from "~/shared/zod";

import { ItemScouterScope } from "./scopes";

const itemScouterMoleculeConstructor = ((_, scope) => {
  scope(ItemScouterScope);

  // ─── 공통: 장비 레벨 ───────────────────────────────────────────────
  const _levelAtom = atom<FormPayload<number>>({
    input: "",
    value: E.left("레벨을 입력해주세요."),
  });
  const levelAtom = atom(
    (get) => get(_levelAtom),
    (_get, set, input: string) => {
      set(_levelAtom, {
        input,
        value: pipe(
          input,
          E.fromPredicate(
            (s) => s !== "",
            () => "레벨을 입력해주세요.",
          ),
          E.chain(
            flow(
              convertToNumber,
              O.toNullable,
              parseZodWithErrorMessage(
                z
                  .number({ message: "레벨을 입력해주세요." })
                  .int({ message: "정수를 입력해주세요." })
                  .min(0, { message: "0 이상의 값을 입력해주세요." })
                  .max(300, { message: "300 이하의 값을 입력해주세요." }),
              ),
            ),
          ),
        ),
      });
    },
  );

  // ─── 스타포스 섹션 ────────────────────────────────────────────────

  const _sfSpareCostAtom = atom<FormPayload<number>>({
    input: "",
    value: E.of(0),
  });
  const sfSpareCostAtom = atom(
    (get) => get(_sfSpareCostAtom),
    (_get, set, input: string) => {
      set(_sfSpareCostAtom, {
        input,
        value: pipe(
          convertToNumber(input || 0),
          O.toNullable,
          parseZodWithErrorMessage(
            z.number({ message: "올바른 값을 입력해주세요." }),
          ),
        ),
      });
    },
  );

  const _sfCurrentStarInputAtom = atom("");
  const sfCurrentStarAtom = atom(
    (get): FormPayload<number> => {
      const level = pipe(
        get(levelAtom).value,
        E.getOrElse(() => 200),
      );
      const reachableStar = Starforce.getReachableStar(level);
      return pipe(get(_sfCurrentStarInputAtom), (input) => ({
        input,
        value: pipe(
          convertToNumber(input || 0),
          O.toNullable,
          parseZodWithErrorMessage(
            z
              .number({ message: "올바른 값을 입력해주세요." })
              .int({ message: "정수를 입력해주세요." })
              .min(0, { message: "0 이상의 값을 입력해주세요." })
              .max(reachableStar - 1, {
                message: `${reachableStar} 이하의 값을 입력해주세요.`,
              }),
          ),
        ),
      }));
    },
    (_get, set, input: string) => {
      set(_sfCurrentStarInputAtom, input);
    },
  );

  const _sfTargetStarInputAtom = atom("");
  const sfTargetStarAtom = atom(
    (get): FormPayload<number> => {
      const currentStar = pipe(
        get(sfCurrentStarAtom).value,
        E.getOrElse(() => 0),
      );
      const level = pipe(
        get(levelAtom).value,
        E.getOrElse(() => 200),
      );
      const reachableStar = Starforce.getReachableStar(level);
      return pipe(get(_sfTargetStarInputAtom), (input) => ({
        input,
        value: pipe(
          input,
          E.fromPredicate(
            (s) => s !== "",
            () => "목표 스타포스를 입력해주세요.",
          ),
          E.chain(
            flow(
              convertToNumber,
              O.toNullable,
              parseZodWithErrorMessage(
                z
                  .number({ message: "올바른 값을 입력해주세요." })
                  .int({ message: "정수를 입력해주세요." })
                  .min(currentStar + 1, {
                    message: "현재 스타포스보다 높은 값을 입력해주세요.",
                  })
                  .max(reachableStar, {
                    message: `${reachableStar} 이하의 값을 입력해주세요.`,
                  }),
              ),
            ),
          ),
        ),
      }));
    },
    (_get, set, input: string) => {
      set(_sfTargetStarInputAtom, input);
    },
  );

  const sfSafeguardRecordAtom = atom<{ [key: `${number}`]: boolean }>({
    15: false,
    16: false,
    17: false,
  });

  const sfStarcatchRecordAtom = atom<{ [key: `${number}`]: boolean }>(
    Array.from({ length: 30 }).reduce<{ [key: number]: boolean }>(
      (acc, _, i) => ({ ...acc, [i]: false }),
      {},
    ),
  );

  const sfEventAtom = atom<Starforce.Event | null>(null);

  const sfDiscountsAtom = atom<Starforce.Discount[]>([]);

  const sfInputsAtom = atom((get) =>
    pipe(
      E.Do,
      E.apS(
        "level",
        pipe(
          get(levelAtom).value,
          E.mapLeft(() => "장비 레벨을 정확히 입력해주세요."),
        ),
      ),
      E.apS(
        "spareCost",
        pipe(
          get(sfSpareCostAtom).value,
          E.mapLeft(() => "스페어 비용을 정확히 입력해주세요."),
        ),
      ),
      E.apS(
        "currentStar",
        pipe(
          get(sfCurrentStarAtom).value,
          E.mapLeft(() => "현재 스타포스를 정확히 입력해주세요."),
        ),
      ),
      E.apS(
        "targetStar",
        pipe(
          get(sfTargetStarAtom).value,
          E.mapLeft(() => "목표 스타포스를 정확히 입력해주세요."),
        ),
      ),
      E.map((inputs) => ({
        ...inputs,
        safeguardRecord: get(sfSafeguardRecordAtom),
        starcatchRecord: get(sfStarcatchRecordAtom),
        event: get(sfEventAtom),
        discounts: get(sfDiscountsAtom),
      })),
    ),
  );

  const sfInputsErrorMessageAtom = atom((get) =>
    pipe(
      get(sfInputsAtom),
      E.match(identity, () => null),
    ),
  );

  const sfIsCalculatingAtom = atom(false);
  const sfCostsAtom = atom<number[]>([]);
  const sfDestroyedCountsAtom = atom<number[]>([]);
  const sfResultExistsAtom = atom((get) => get(sfCostsAtom).length > 0);

  // 잠재능력 결과 (등급업 기대 비용/횟수)
  type PotResult = { expectedCount: number; expectedCost: number }[];
  const potResultAtom = atom<PotResult | null>(null);
  const potIsCalculatingAtom = atom(false);

  // ─── 잠재능력 섹션 ────────────────────────────────────────────────

  const potTypeAtom = atom<Potential.Type>("COMMON");

  const _potCurrentGradeAtom = atom<Potential.Grade>("RARE");
  const potCurrentGradeAtom = atom(
    (get) => get(_potCurrentGradeAtom),
    (_get, set, grade: Potential.Grade) => {
      set(_potCurrentGradeAtom, grade);
    },
  );

  const _potTargetGradeAtom = atom<Potential.Grade>("LEGENDARY");
  const potTargetGradeAtom = atom(
    (get) => get(_potTargetGradeAtom),
    (_get, set, grade: Potential.Grade) => {
      set(_potTargetGradeAtom, grade);
    },
  );

  const potResetMethodAtom = atom<Potential.ResetMethod>("RED");

  const _potCubePriceAtom = atom<FormPayload<number>>({
    input: "",
    value: E.left("큐브 가격을 입력해주세요."),
  });
  const potCubePriceAtom = atom(
    (get) => get(_potCubePriceAtom),
    (_get, set, input: string) => {
      set(_potCubePriceAtom, {
        input,
        value: pipe(
          input,
          E.fromPredicate(
            (s) => s !== "",
            () => "큐브 가격을 입력해주세요.",
          ),
          E.chain(
            flow(
              convertToNumber,
              O.toNullable,
              parseZodWithErrorMessage(
                z
                  .number({ message: "올바른 값을 입력해주세요." })
                  .min(0, { message: "0 이상의 값을 입력해주세요." }),
              ),
            ),
          ),
        ),
      });
    },
  );

  const potInputsAtom = atom((get) =>
    pipe(
      E.Do,
      E.apS(
        "level",
        pipe(
          get(levelAtom).value,
          E.mapLeft(() => "장비 레벨을 정확히 입력해주세요."),
        ),
      ),
      E.apS(
        "cubePrice",
        pipe(
          get(potCubePriceAtom).value,
          E.mapLeft(() => "큐브 가격을 정확히 입력해주세요."),
        ),
      ),
      E.map((inputs) => ({
        ...inputs,
        type: get(potTypeAtom),
        currentGrade: get(potCurrentGradeAtom),
        targetGrade: get(potTargetGradeAtom),
        resetMethod: get(potResetMethodAtom),
      })),
    ),
  );

  const potInputsErrorMessageAtom = atom((get) =>
    pipe(
      get(potInputsAtom),
      E.match(identity, () => null),
    ),
  );

  // ─── 통합 결과 ──────────────────────────────────────────────────

  const sfEnabledAtom = atom(true);
  const potEnabledAtom = atom(true);

  const isHighchartsLoadedAtom = atom(false);

  return {
    // 공통
    levelAtom,
    sfEnabledAtom,
    potEnabledAtom,
    isHighchartsLoadedAtom,
    // 스타포스
    sfSpareCostAtom,
    sfCurrentStarAtom,
    sfTargetStarAtom,
    sfSafeguardRecordAtom,
    sfStarcatchRecordAtom,
    sfEventAtom,
    sfDiscountsAtom,
    sfInputsAtom,
    sfInputsErrorMessageAtom,
    sfIsCalculatingAtom,
    sfCostsAtom,
    sfDestroyedCountsAtom,
    sfResultExistsAtom,
    // 잠재능력
    potTypeAtom,
    potCurrentGradeAtom,
    potTargetGradeAtom,
    potResetMethodAtom,
    potCubePriceAtom,
    potInputsAtom,
    potInputsErrorMessageAtom,
    potResultAtom,
    potIsCalculatingAtom,
  };
}) satisfies MoleculeConstructor<unknown>;

export const ItemScouterMolecule = molecule(itemScouterMoleculeConstructor);

export type ItemScouterMoleculeStructure = ReturnType<
  typeof itemScouterMoleculeConstructor
>;
