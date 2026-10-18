import { describe, expect, it } from "vitest";

import { loadStarforceTable } from "./rules";
import { expectedCostOfStep, getCosts, type StarRow } from "./starforce";

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
