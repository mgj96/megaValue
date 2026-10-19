import { describe, expect, it } from "vitest";

import {
  assetsOf,
  buy,
  enhance,
  isOver,
  newGame,
  recover,
  sell,
  type GameData,
} from "./game";
import { loadStarforceRules } from "./rules";
import { compareRecovery, evaluateAttempt, getCosts } from "./starforce";

const rules = loadStarforceRules();
const LEVEL = 200;
const spareCost = 5e8;

const data: GameData = (() => {
  const maxStar = rules.maxStarOf(LEVEL)!;
  const evaluations = Array.from({ length: maxStar }, (_, star) =>
    evaluateAttempt({ equipLevel: LEVEL, table: rules.table, star, spareCost, restoreOf: rules.restoreOf }),
  );
  return {
    level: LEVEL,
    spareCost,
    maxStar,
    table: rules.table,
    costs: getCosts(LEVEL),
    values: [...evaluations.map((e) => e.value), evaluations[maxStar - 1].nextValue],
    recovery: Object.fromEntries(
      Array.from({ length: maxStar }, (_, star) => [
        star,
        compareRecovery({ equipLevel: LEVEL, table: rules.table, star, spareCost, restoreOf: rules.restoreOf }),
      ]),
    ),
    restore: Object.fromEntries(
      Array.from({ length: 8 }, (_, i) => [15 + i, rules.restoreOf(LEVEL, 15 + i)]),
    ),
  };
})();

const withStar = (star: number, meso = 1e12) => ({ ...newGame(meso), star });

describe("game", () => {
  it("사고 팔면 원가 가치 그대로라 ★0에서는 손익이 없다", () => {
    const bought = buy(newGame(1e10), data);
    expect(bought.star).toBe(0);
    expect(sell(bought, data).meso).toBeCloseTo(1e10);
  });

  it("자금이 부족하면 못 산다", () => {
    expect(buy(newGame(spareCost - 1), data).star).toBeNull();
    expect(isOver(newGame(spareCost - 1), data)).toBe(true);
  });

  it("난수에 따라 성공·유지·파괴가 갈린다(★17: 성공 15%, 파괴 6.8%)", () => {
    expect(enhance(withStar(17), data, false, () => 0.1).star).toBe(18);
    expect(enhance(withStar(17), data, false, () => 0.5).star).toBe(17);
    const destroyed = enhance(withStar(17), data, false, () => 0.99);
    expect(destroyed.star).toBeNull();
    expect(destroyed.destroyedAt).toBe(17);
  });

  it("파괴 방지는 비용이 3배고 파괴가 유지로 바뀐다", () => {
    const guarded = enhance(withStar(17, 1e12), data, true, () => 0.99);
    expect(guarded.star).toBe(17);
    expect(1e12 - guarded.meso).toBeCloseTo(data.costs[17] * 3);
    expect(enhance(withStar(20), data, true, () => 0.1).attempts).toBe(0);
  });

  it("복구 방식: 12성 복구는 ★12, 확정복구는 터진 성(23성 이상은 22성)", () => {
    const at17 = { ...newGame(1e12), destroyedAt: 17 };
    expect(recover(at17, data, "twelve").star).toBe(12);
    expect(recover(at17, data, "restore").star).toBe(17);
    expect(recover({ ...at17, destroyedAt: 27 }, data, "restore").star).toBe(22);
    expect(recover(at17, data, "giveup").star).toBeNull();
  });

  it("복구 비용을 못 내면 상태가 그대로다", () => {
    const poor = { ...newGame(1), destroyedAt: 17 };
    expect(recover(poor, data, "twelve")).toBe(poor);
    expect(recover(poor, data, "restore")).toBe(poor);
  });

  it("자산은 메소 + 보유 장비의 원가 가치", () => {
    expect(assetsOf(withStar(17, 100), data)).toBeCloseTo(100 + data.values[17]);
  });
});
