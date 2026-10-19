import { match } from "ts-pattern";

import type { RestoreCost } from "./rules";

/** [성공, 유지, 파괴] 확률 (0~1). rules/starforce.yaml 에서 온다. */
export type StarRow = { success: number; maintain: number; destroy: number };

/**
 * 성별 강화 1회 기본 메소 비용 (index = 현재 성).
 * 비공식 식: mgj96/megaValue(원본 kurateh/mesulive, AGPL-3.0) src/entities/starforce/utils.ts 의 getCosts 를 그대로 가져왔다.
 * 공식 문서에 대조할 수치가 없다 → rules/starforce.yaml 의 meso_cost 참고.
 */
export const getCosts = (equipLevel: number): number[] => {
  return Array.from({ length: 30 }).map((_, star) => {
    if (star <= 9) {
      return (
        Math.round((1000 + (equipLevel ** 3 * (star + 1)) / 36) / 100) * 100
      );
    }

    const base = equipLevel ** 3 * (star + 1) ** 2.7;

    return (
      1000 +
      Math.round(
        match(star)
          .with(10, () => base / 571)
          .with(11, () => base / 314)
          .with(12, () => base / 214)
          .with(13, () => base / 157)
          .with(14, () => base / 107)
          .with(17, () => base / 150)
          .with(18, () => base / 70)
          .with(19, () => base / 45)
          .with(21, () => base / 125)
          .otherwise(() => base / 200) / 100,
      ) *
        100
    );
  });
};

/** 파괴 후 되돌아가는 성. 포크의 가정(예전 "12성 복구")을 따른다. 2026-03 개편 후 복구 규칙은 미확정. */
const RESTORE_STAR = 12;

/** 파괴 방지: 기본 비용에 기본 비용의 200%를 더 낸다(총 3배). 파괴 확률은 유지 확률로 넘어간다. */
export const GUARD_EXTRA_COST_RATIO = 2;

export type StepCostParams = {
  equipLevel: number;
  /** 길이 30, index = 성. */
  table: StarRow[];
  /** 이 성에서 한 단계 올리는 기대 비용을 구한다. */
  fromStar: number;
  /** 파괴 방지를 켠 성들. */
  guardedStars?: ReadonlySet<number>;
  /** 파괴로 잃은 장비를 다시 마련하는 비용(원). */
  spareCost: number;
};

/**
 * fromStar → fromStar+1 기대 메소 (닫힌 식).
 * 시도 비용 c, 성공 p, 유지 m, 파괴 d, 파괴 시 RESTORE_STAR 로 돌아가 다시 올라오는 비용 R 이라면
 *   E = c + m·E + d·(spare + R + E)   →   E = (c + d·(spare + R)) / p
 * R(k) = Σ_{j=RESTORE_STAR}^{k-1} E(j)
 */
export const expectedCostOfStep = ({
  equipLevel,
  table,
  fromStar,
  guardedStars = new Set<number>(),
  spareCost,
}: StepCostParams): number => {
  const costs = getCosts(equipLevel);
  let climbBack = 0; // R(k)
  let result = 0;

  for (let star = Math.min(RESTORE_STAR, fromStar); star <= fromStar; star++) {
    const { success, destroy } = table[star];
    const guarded = guardedStars.has(star);
    const cost = guarded ? costs[star] * (1 + GUARD_EXTRA_COST_RATIO) : costs[star];
    const d = guarded ? 0 : destroy;

    const expected = (cost + d * (spareCost + climbBack)) / success;
    if (star === fromStar) result = expected;
    if (star >= RESTORE_STAR) climbBack += expected;
  }

  return result;
};

export type RecoveryComparison = {
  /** 확정복구(그 성 그대로 복구) 총 비용. */
  restoreCost: number;
  /** 12성 복구 후 그 성까지 다시 올리는 기대 비용(대체 장비 1개 포함). */
  noRestoreCost: number;
  cheaper: "확정복구" | "12성 복구";
};

/** 23성 이상에서 파괴되면 22성으로 설정되므로 확정복구는 22성까지만 있다. */
export const RESTORE_MAX_STAR = 22;

/** from 성에서 to 성까지 올리는 기대 비용(12성 복구 가정, 파괴 방지 없음). */
const climbCost = ({
  equipLevel,
  table,
  from,
  to,
  spareCost,
}: {
  equipLevel: number;
  table: StarRow[];
  from: number;
  to: number;
  spareCost: number;
}) => {
  let sum = 0;
  for (let star = from; star < to; star++) {
    sum += expectedCostOfStep({ equipLevel, table, fromStar: star, spareCost });
  }
  return sum;
};

/**
 * star 에서 파괴됐을 때 확정복구와 12성 복구 중 어느 쪽이 싼지 비교한다.
 * 23성 이상은 22성까지 돌아오는 비용을 비교한다(그 위는 두 경로가 똑같이 올라가므로 상쇄된다).
 * 확정복구 재료가 없는 레벨·성이면 null.
 */
export const compareRecovery = ({
  equipLevel,
  table,
  star,
  spareCost,
  restoreOf,
}: {
  equipLevel: number;
  table: StarRow[];
  star: number;
  spareCost: number;
  restoreOf: (level: number, star: number) => RestoreCost | null;
}): RecoveryComparison | null => {
  const target = Math.min(star, RESTORE_MAX_STAR);
  const restore = restoreOf(equipLevel, target);
  if (!restore) return null;

  const noRestoreCost =
    spareCost + climbCost({ equipLevel, table, from: RESTORE_STAR, to: target, spareCost });
  const restoreCost = restore.spareCount * spareCost + restore.meso;
  return {
    restoreCost,
    noRestoreCost,
    cheaper: restoreCost < noRestoreCost ? "확정복구" : "12성 복구",
  };
};

export type AttemptEvaluation = {
  attemptCost: number;
  /** 원가 기반 가치: 대체 장비 + 0성부터 그 성까지 키우는 기대 비용. 시세가 아니다. */
  value: number;
  nextValue: number;
  /** 파괴 시 같은 성으로 되돌아오는 비용(싼 쪽). */
  recoveryCost: number;
  recoveryBy: RecoveryComparison["cheaper"];
  /** 1회 시도 결과별 확률과 순손익(가치 변화 - 쓴 메소). */
  outcomes: { label: "성공" | "유지" | "파괴"; prob: number; net: number }[];
  expectedNet: number;
};

/** star → star+1 한 번 시도했을 때 결과별 손익. 원가 기반 추정이라 평균적으로는 복구 절감분만 이득이다. */
export const evaluateAttempt = ({
  equipLevel,
  table,
  star,
  spareCost,
  restoreOf,
}: {
  equipLevel: number;
  table: StarRow[];
  star: number;
  spareCost: number;
  restoreOf: (level: number, star: number) => RestoreCost | null;
}): AttemptEvaluation => {
  const row = table[star];
  const attemptCost = getCosts(equipLevel)[star];
  const climb = (from: number, to: number) =>
    climbCost({ equipLevel, table, from, to, spareCost });
  const value = spareCost + climb(0, star);
  const nextValue = spareCost + climb(0, star + 1);

  const target = Math.min(star, RESTORE_MAX_STAR);
  const compared = compareRecovery({ equipLevel, table, star, spareCost, restoreOf });
  const noRestoreCost = spareCost + climb(RESTORE_STAR, target);
  const base = compared ? Math.min(compared.restoreCost, compared.noRestoreCost) : noRestoreCost;
  const recoveryCost = row.destroy > 0 ? base + climb(target, star) : 0;

  const outcomes: AttemptEvaluation["outcomes"] = [
    { label: "성공", prob: row.success, net: nextValue - value - attemptCost },
    { label: "유지", prob: row.maintain, net: -attemptCost },
    { label: "파괴", prob: row.destroy, net: -attemptCost - recoveryCost },
  ];

  return {
    attemptCost,
    value,
    nextValue,
    recoveryCost,
    recoveryBy: compared?.cheaper ?? "12성 복구",
    outcomes,
    expectedNet: outcomes.reduce((sum, o) => sum + o.prob * o.net, 0),
  };
};
