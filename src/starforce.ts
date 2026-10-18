import { match } from "ts-pattern";

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
const GUARD_EXTRA_COST_RATIO = 2;

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
