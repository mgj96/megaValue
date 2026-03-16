"use client";

import { molecule, type MoleculeConstructor } from "bunshi";
import { flow, identity, pipe } from "fp-ts/lib/function";
import { atom } from "jotai";
import { z } from "zod";

import type { GoalSimulationDistribution, GoalSimulationSummary } from "~/entities/game/goal-simulation";
import type { Potential } from "~/entities/potential";
import type { Equip } from "~/entities/equip";
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

  /** 스타캐치 상시 적용: UI 제거 후 모든 성에서 true로 고정 */
  const sfStarcatchRecordAtom = atom<{ [key: `${number}`]: boolean }>(
    Array.from({ length: 30 }).reduce<{ [key: number]: boolean }>(
      (acc, _, i) => ({ ...acc, [i]: true }),
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

  /** 스타포스 목표 달성 시뮬 결과 (요약 + 분포). null이면 카드 미표시 */
  const sfGoalSimulationResultAtom = atom<{
    summary: GoalSimulationSummary;
    distribution: GoalSimulationDistribution;
    budget: number;
  } | null>(null);

  /** 목표 달성 시뮬 예산: 입력은 "억" 단위(1 = 1억 메소), value는 메소 */
  const ONE_EOK = 100_000_000;
  const _sfGoalBudgetAtom = atom<FormPayload<number>>({
    input: "10",
    value: E.right(10 * ONE_EOK),
  });
  const sfGoalBudgetAtom = atom(
    (get) => get(_sfGoalBudgetAtom),
    (_get, set, input: string) => {
      // "20억", "20" 모두 파싱: 억 제거 후 숫자만 추출
      const normalized = input.trim().replace(/억\s*$/i, "").trim();
      const value = pipe(
        normalized,
        E.fromPredicate(
          (s) => s !== "",
          () => "예산을 입력해주세요.",
        ),
        E.chain((s) =>
          pipe(
            convertToNumber(s),
            O.toNullable,
            parseZodWithErrorMessage(
              z
                .number({ message: "올바른 값을 입력해주세요." })
                .min(0, { message: "0 이상의 값을 입력해주세요." }),
            ),
            E.map((억단위) => 억단위 * ONE_EOK),
          ),
        ),
      );
      set(_sfGoalBudgetAtom, { input, value });
    },
  );

  /** 목표 달성 시뮬 반복 횟수 (기본 10,000) */
  const sfGoalIterationsAtom = atom(10_000);

  /** 목표 달성 시뮬 실행 중 */
  const sfGoalSimulationRunningAtom = atom(false);

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
  const scrollEnabledAtom = atom((get) => get(scrollTypeAtom) !== "미사용");

  const isHighchartsLoadedAtom = atom(false);

  // ─── 장비 타입 (scroll/potential/bonus 세부 설정에 활용) ───────────────
  const equipPartAtom = atom<Equip>("무기");

  // ─── SF 분위수 파생 (luck 슬라이더용) ───────────────────────────
  const sfCostStatsAtom = atom((get) => {
    const costs = get(sfCostsAtom);
    if (costs.length === 0) return null;
    const sum = costs.reduce((a, b) => a + b, 0);
    return {
      p10: costs[Math.floor(costs.length * 0.1)] ?? 0,
      p50: costs[Math.floor(costs.length * 0.5)] ?? 0,
      p90: costs[Math.floor(costs.length * 0.9)] ?? 0,
      mean: sum / costs.length,
    };
  });

  // ─── Potential 결과 ───────────────────────────────────────────────
  const potTotalCostAtom = atom((get) => {
    const result = get(potResultAtom);
    return result?.reduce((sum, r) => sum + r.expectedCost, 0) ?? null;
  });
  
  const potCostsAtom = atom<number[]>([]);
  const potCostStatsAtom = atom((get) => {
    const costs = get(potCostsAtom);
    if (costs.length === 0) return null;
    const sum = costs.reduce((a, b) => a + b, 0);
    return {
      p10: costs[Math.floor(costs.length * 0.1)] ?? 0,
      p50: costs[Math.floor(costs.length * 0.5)] ?? 0,
      p90: costs[Math.floor(costs.length * 0.9)] ?? 0,
      mean: sum / costs.length,
    };
  });

  // ─── 잠재능력 저격 라인 (세부 설정) ─────────────────────────────
  const mainLinesAtom = atom<string[]>([]);
  const addiLinesAtom = atom<string[]>([]);

  // ─── 주흔작 종류 ─────────────────────────────────────────────────
  const scrollTypeAtom = atom<"미사용" | "70%" | "30%" | "15%">("미사용");

  const _scrollTracePriceAtom = atom<FormPayload<number>>({
    input: "2000",
    value: E.of(2000),
  });
  const scrollTracePriceAtom = atom(
    (get) => get(_scrollTracePriceAtom),
    (_get, set, input: string) => {
      set(_scrollTracePriceAtom, {
        input,
        value: pipe(
          input,
          E.fromPredicate(
            (s) => s !== "",
            () => "주문의 흔적 가격을 입력해주세요.",
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

  const _scrollSlotCountAtom = atom<FormPayload<number>>({
    input: "8",
    value: E.of(8),
  });
  const scrollSlotCountAtom = atom(
    (get) => get(_scrollSlotCountAtom),
    (_get, set, input: string) => {
      set(_scrollSlotCountAtom, {
        input,
        value: pipe(
          input,
          E.fromPredicate(
            (s) => s !== "",
            () => "업그레이드 가능 횟수를 입력해주세요.",
          ),
          E.chain(
            flow(
              convertToNumber,
              O.toNullable,
              parseZodWithErrorMessage(
                z
                  .number({ message: "올바른 값을 입력해주세요." })
                  .int({ message: "정수를 입력해주세요." })
                  .min(1, { message: "1 이상의 값을 입력해주세요." }),
              ),
            ),
          ),
        ),
      });
    },
  );

  const scrollDiligenceLevelAtom = atom<number>(10);
  const scrollGuildSkillAtom = atom<boolean>(true);
  const scrollSundayMapleAtom = atom<("HALF_PRICE" | "FEVER_TIME")[]>(
    [],
  );

  const scrollCostsAtom = atom<number[]>([]);
  const scrollCostStatsAtom = atom((get) => {
    const costs = get(scrollCostsAtom);
    if (costs.length === 0) return null;
    const sum = costs.reduce((a, b) => a + b, 0);
    return {
      p10: costs[Math.floor(costs.length * 0.1)] ?? 0,
      p50: costs[Math.floor(costs.length * 0.5)] ?? 0,
      p90: costs[Math.floor(costs.length * 0.9)] ?? 0,
      mean: sum / costs.length,
    };
  });
  const scrollIsCalculatingAtom = atom(false);
  
  const scrollInputsAtom = atom((get) =>
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
        "tracePrice",
        pipe(
          get(scrollTracePriceAtom).value,
          E.mapLeft(() => "주문의 흔적 가격을 정확히 입력해주세요."),
        ),
      ),
      E.apS(
        "slotCount",
        pipe(
          get(scrollSlotCountAtom).value,
          E.mapLeft(() => "업그레이드 가능 횟수를 정확히 입력해주세요."),
        ),
      ),
      E.map((inputs) => ({
        ...inputs,
        type: get(scrollTypeAtom),
        equipPart: get(equipPartAtom),
        diligenceLevel: get(scrollDiligenceLevelAtom),
        isGuildSkillEnabled: get(scrollGuildSkillAtom),
        sundayMaple: get(scrollSundayMapleAtom),
      })),
    ),
  );
  
  const scrollInputsErrorMessageAtom = atom((get) =>
    pipe(
      get(scrollInputsAtom),
      E.match(identity, () => null),
    ),
  );

  return {
    // 공통
    levelAtom,
    equipPartAtom,
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
    sfGoalSimulationResultAtom,
    sfGoalBudgetAtom,
    sfGoalIterationsAtom,
    sfGoalSimulationRunningAtom,
    sfCostStatsAtom,
    // 잠재능력
    potTypeAtom,
    potCurrentGradeAtom,
    potTargetGradeAtom,
    potResetMethodAtom,
    potCubePriceAtom,
    potInputsAtom,
    potInputsErrorMessageAtom,
    potResultAtom,
    potCostsAtom,
    potCostStatsAtom,
    potIsCalculatingAtom,
    potTotalCostAtom,
    mainLinesAtom,
    addiLinesAtom,
    // 주흔작
    scrollEnabledAtom,
    scrollTypeAtom,
    scrollTracePriceAtom,
    scrollSlotCountAtom,
    scrollDiligenceLevelAtom,
    scrollGuildSkillAtom,
    scrollSundayMapleAtom,
    scrollCostsAtom,
    scrollCostStatsAtom,
    scrollIsCalculatingAtom,
    scrollInputsAtom,
    scrollInputsErrorMessageAtom,
  };
}) satisfies MoleculeConstructor<unknown>;

export const ItemScouterMolecule = molecule(itemScouterMoleculeConstructor);

export type ItemScouterMoleculeStructure = ReturnType<
  typeof itemScouterMoleculeConstructor
>;
