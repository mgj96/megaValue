import { describe, expect, it } from "vitest";

import { loadStarforceRules, loadStarforceTable } from "./rules";
import { compareRecovery, expectedCostOfStep, getCosts, type StarRow } from "./starforce";

const flat = (row: StarRow): StarRow[] => Array.from({ length: 30 }, () => row);

describe("expectedCostOfStep", () => {
  const equipLevel = 200;
  const cost = (star: number) => getCosts(equipLevel)[star];

  it("성공 100%면 시도 비용 그대로", () => {
    const table = flat({ success: 1, maintain: 0, destroy: 0 });
    expect(expectedCostOfStep({ equipLevel, table, fromStar: 5, spareCost: 0 })).toBe(cost(5));
  });

  it("성공 50%·파괴 없음이면 기대 시도 2회", () => {
    const table = flat({ success: 0.5, maintain: 0.5, destroy: 0 });
    expect(expectedCostOfStep({ equipLevel, table, fromStar: 5, spareCost: 0 })).toBeCloseTo(2 * cost(5));
  });

  it("12성에서 파괴되면 대체 장비 비용만큼 더해진다 (E = (c + d·spare) / p)", () => {
    const table = flat({ success: 0.5, maintain: 0, destroy: 0.5 });
    const spare = 1_000_000;
    expect(expectedCostOfStep({ equipLevel, table, fromStar: 12, spareCost: spare })).toBeCloseTo(
      (cost(12) + 0.5 * spare) / 0.5,
    );
  });

  it("13성 파괴는 12성부터 다시 올라오는 비용(R)을 포함한다", () => {
    const table = flat({ success: 0.5, maintain: 0, destroy: 0.5 });
    const e12 = (cost(12) + 0.5 * 0) / 0.5;
    const expected13 = (cost(13) + 0.5 * e12) / 0.5;
    expect(expectedCostOfStep({ equipLevel, table, fromStar: 13, spareCost: 0 })).toBeCloseTo(expected13);
  });

  it("파괴 방지는 총 3배 비용에 파괴가 없다", () => {
    const table = flat({ success: 0.5, maintain: 0, destroy: 0.5 });
    expect(
      expectedCostOfStep({
        equipLevel,
        table,
        fromStar: 12,
        guardedStars: new Set([12]),
        spareCost: 999,
      }),
    ).toBeCloseTo((3 * cost(12)) / 0.5);
  });
});

describe("rules/starforce.yaml", () => {
  it("0~29성 행이 모두 있고 확률 합이 1이다", () => {
    const table = loadStarforceTable();
    expect(table).toHaveLength(30);
    for (const row of table) {
      expect(row.success + row.maintain + row.destroy).toBeCloseTo(1);
    }
  });

  it("공식 공지 값: 22성 성공 15% / 파괴 17%", () => {
    const row = loadStarforceTable()[22];
    expect(row.success).toBeCloseTo(0.15);
    expect(row.destroy).toBeCloseTo(0.17);
  });
});

describe("compareRecovery", () => {
  const rules = loadStarforceRules();
  const compare = (star: number, spareCost: number, level = 200) =>
    compareRecovery({
      equipLevel: level,
      table: rules.table,
      star,
      spareCost,
      restore: rules.restoreOf(level, star),
    });

  it("대체 장비가 공짜면 낮은 성은 12성 복구, 높은 성은 확정복구가 싸다", () => {
    expect(compare(17, 0)?.cheaper).toBe("12성 복구");
    expect(compare(22, 0)?.cheaper).toBe("확정복구");
  });

  it("12성 복구 비용은 12성부터 그 성 직전까지 기대 비용의 합 + 대체 장비", () => {
    const spare = 3e8;
    const sum = [12, 13, 14, 15, 16].reduce(
      (acc, from) =>
        acc + expectedCostOfStep({ equipLevel: 200, table: rules.table, fromStar: from, spareCost: spare }),
      0,
    );

    expect(compare(17, spare)?.noRestoreCost).toBeCloseTo(sum + spare);
    expect(compare(17, spare)?.restoreCost).toBeCloseTo(rules.restoreOf(200, 17)!.meso + spare);
  });

  it("표에 없는 레벨·성이면 null", () => {
    expect(compare(17, 0, 100)).toBeNull();
    expect(compare(25, 0)).toBeNull();
    expect(compare(20, 0, 130)).toBeNull();
  });
});
