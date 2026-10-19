import { describe, expect, it } from "vitest";

import {
  assetsOf,
  buy,
  dataKeyOf,
  enhance,
  isOver,
  newGame,
  recover,
  sell,
  select,
  selectedItem,
  totalStars,
  type GameData,
  type GameItem,
} from "./game";
import { buildGameData } from "./gameData";

const LEVEL = 200;
const PRICE = 5e8;
const data = buildGameData(LEVEL, PRICE) as GameData;
const dataFor = () => data;

const item = (key: string, star: number | null = null, price = PRICE): GameItem => ({
  key,
  slot: key,
  name: `${key} 이름`,
  setId: null,
  slotId: null,
  icon: null,
  level: LEVEL,
  price,
  star,
  maxStarReached: star ?? 0,
});

const start = (meso: number, ...items: GameItem[]) =>
  newGame({ mode: "scratch", meso, items: items.length ? items : [item("무기")] });

const withStar = (star: number, meso = 1e12) => start(meso, item("무기", star));

describe("game", () => {
  it("사고 팔면 원가 가치 그대로라 ★0에서는 손익이 없다", () => {
    const bought = buy(start(1e10), data);
    expect(selectedItem(bought)?.star).toBe(0);
    expect(sell(bought, data).meso).toBeCloseTo(1e10);
  });

  it("자금이 부족하면 못 산다", () => {
    const poor = start(PRICE - 1);
    expect(buy(poor, data)).toBe(poor);
    expect(isOver(poor)).toBe(true);
  });

  it("난수에 따라 성공·유지·파괴가 갈린다(★17: 성공 15%, 파괴 6.8%)", () => {
    expect(selectedItem(enhance(withStar(17), data, false, () => 0.1))?.star).toBe(18);
    expect(selectedItem(enhance(withStar(17), data, false, () => 0.5))?.star).toBe(17);
    const destroyed = enhance(withStar(17), data, false, () => 0.99);
    expect(selectedItem(destroyed)?.star).toBeNull();
    expect(destroyed.destroyed).toEqual({ key: "무기", star: 17 });
  });

  it("파괴 방지는 비용이 3배고 파괴가 유지로 바뀐다", () => {
    const guarded = enhance(withStar(17), data, true, () => 0.99);
    expect(selectedItem(guarded)?.star).toBe(17);
    expect(1e12 - guarded.meso).toBeCloseTo(data.costs[17] * 3);
    expect(enhance(withStar(20), data, true, () => 0.1).attempts).toBe(0);
  });

  it("복구 방식: 12성 복구는 ★12, 확정복구는 터진 성(23성 이상은 22성)", () => {
    const at17 = { ...start(1e12, item("무기")), destroyed: { key: "무기", star: 17 } };
    expect(selectedItem(recover(at17, data, "twelve"))?.star).toBe(12);
    expect(selectedItem(recover(at17, data, "restore"))?.star).toBe(17);
    const at27 = { ...at17, destroyed: { key: "무기", star: 27 } };
    expect(selectedItem(recover(at27, data, "restore"))?.star).toBe(22);
    expect(selectedItem(recover(at17, data, "giveup"))?.star).toBeNull();
    expect(recover(at17, data, "giveup").destroyed).toBeNull();
  });

  it("복구 비용을 못 내면 상태가 그대로다", () => {
    const poor = { ...start(1, item("무기")), destroyed: { key: "무기", star: 17 } };
    expect(recover(poor, data, "twelve")).toBe(poor);
    expect(recover(poor, data, "restore")).toBe(poor);
  });

  it("파괴 후 복구를 고르기 전에는 다른 동작이 막힌다", () => {
    const pending = enhance(withStar(17), data, false, () => 0.99);
    expect(select(pending, "무기")).toBe(pending);
    expect(buy(pending, data)).toBe(pending);
  });

  it("장비를 하나씩 골라서 따로 강화한다", () => {
    let state = start(1e12, item("무기", 10), item("어깨장식", 5));
    state = select(state, "어깨장식");
    state = enhance(state, data, false, () => 0.01);

    expect(state.items.map((i) => [i.key, i.star])).toEqual([
      ["무기", 10],
      ["어깨장식", 6],
    ]);
    expect(totalStars(state)).toBe(16);
  });

  it("자산은 메소 + 보유 장비들의 원가 가치", () => {
    const state = start(100, item("무기", 17), item("모자", 10), item("장갑"));
    expect(assetsOf(state, dataFor)).toBeCloseTo(100 + data.values[17] + data.values[10]);
  });

  it("장비마다 구매가가 다르면 데이터 키도 다르다", () => {
    expect(dataKeyOf(item("무기", 0, 1e9))).not.toBe(dataKeyOf(item("무기", 0, 5e8)));
  });
});
