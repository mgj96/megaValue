import { describe, expect, it } from "vitest";

import { buildDiagnosisPrompt, buildReply, diagnoseItems, recommendSlots } from "./diagnose";
import type { Equipment } from "./nexon";
import { loadStarforceRules } from "./rules";

const rules = loadStarforceRules();
const emptyPotential = { grade: null, options: [null, null, null] };

const item = (
  overrides: Partial<Equipment["items"][number]> = {},
): Equipment["items"][number] => ({
  part: "모자",
  slot: "모자",
  name: "테스트 모자",
  level: 200,
  starforce: 5,
  starforceScrollFlag: "미사용",
  scrollUpgradeable: 0,
  potential: emptyPotential,
  additionalPotential: emptyPotential,
  ...overrides,
});

const equipmentOf = (...items: Equipment["items"]): Equipment => ({
  date: "2026-10-18T00:00:00+09:00",
  characterClass: "아델",
  presetNo: 1,
  items,
});

describe("diagnoseItems", () => {
  it("다음 성의 확률과 비용을 규칙표에서 가져온다", () => {
    const [d] = diagnoseItems(equipmentOf(item({ starforce: 5 })), rules);

    expect(d.next?.successPct).toBeCloseTo(rules.table[5].success * 100);
    expect(d.next?.destroyPct).toBeCloseTo(rules.table[5].destroy * 100);
    expect(d.next?.expectedMeso).toBeGreaterThanOrEqual(d.next!.mesoPerAttempt);
  });

  it("최대 성이면 next가 null", () => {
    const max = rules.maxStarOf(200)!;
    const [d] = diagnoseItems(equipmentOf(item({ starforce: max })), rules);

    expect(d.maxStar).toBe(max);
    expect(d.next).toBeNull();
  });

  it("레벨 정보가 없거나 숫자가 아닌 성은 강화 대상에서 거른다", () => {
    const [noLevel, nanStar] = diagnoseItems(
      equipmentOf(item({ level: 0 }), item({ starforce: NaN })),
      rules,
    );

    expect(noLevel.next).toBeNull();
    expect(nanStar.star).toBe(0);
  });
});

describe("buildReply", () => {
  it("강화 대상과 잠재능력을 문장으로 만든다", () => {
    const equipment = equipmentOf(
      item({
        potential: { grade: "레전드리", options: ["STR +12%", null, null] },
      }),
    );
    const reply = buildReply(equipment, diagnoseItems(equipment, rules));

    expect(reply).toContain("아델 캐릭터의 장비 1개");
    expect(reply).toContain("기준일 2026-10-18");
    expect(reply).toContain("★5→★6");
    expect(reply).toContain("레전드리 (STR +12%)");
  });

  it("파괴 가능 구간이면 확정복구와 12성 복구 중 유리한 쪽을 알려 준다", () => {
    const equipment = equipmentOf(item({ starforce: 22 }));
    const reply = buildReply(equipment, diagnoseItems(equipment, rules));

    expect(reply).toContain("파괴 시 확정복구가 유리");
  });

  it("파괴 없는 구간에는 복구 비교를 붙이지 않는다", () => {
    const equipment = equipmentOf(item({ starforce: 5 }));
    const reply = buildReply(equipment, diagnoseItems(equipment, rules));

    expect(reply).not.toContain("복구");
  });

  it("강화할 장비가 없으면 그렇게 알려 준다", () => {
    const equipment = equipmentOf(item({ starforce: rules.maxStarOf(200)! }));
    const reply = buildReply(equipment, diagnoseItems(equipment, rules));

    expect(reply).toContain("강화할 수 있는 장비가 없어요");
  });
});

describe("buildDiagnosisPrompt", () => {
  it("필요한 성의 규칙 행만 발췌한다", () => {
    const equipment = equipmentOf(item({ starforce: 5 }), item({ starforce: 17 }));
    const prompt = buildDiagnosisPrompt(
      equipment,
      diagnoseItems(equipment, rules),
      rules,
    );

    expect(prompt).toContain("5성→6성");
    expect(prompt).toContain("17성→18성");
    expect(prompt).not.toContain("6성→7성");
  });

  it("전부 레전드리면 큐브 규칙을 생략한다", () => {
    const equipment = equipmentOf(
      item({ potential: { grade: "레전드리", options: [null, null, null] } }),
    );
    const prompt = buildDiagnosisPrompt(
      equipment,
      diagnoseItems(equipment, rules),
      rules,
    );

    expect(prompt).toContain("큐브 규칙 생략");
  });
});

describe("recommendSlots", () => {
  const recommend = (...items: Equipment["items"]) =>
    recommendSlots(diagnoseItems(equipmentOf(...items), rules));

  it("강화할 수 있는 부위만 기대 메소가 적은 순으로 순위를 매긴다", () => {
    const result = recommend(
      item({ slot: "무기", starforce: 22 }),
      item({ slot: "장갑", level: 140, starforce: 12 }),
      item({ slot: "신발", starforce: rules.maxStarOf(200)! }),
    );

    expect(result.map((r) => [r.slot, r.rank])).toEqual([
      ["장갑", 1],
      ["무기", 2],
      ["신발", null],
    ]);
    expect(result[2].headline).toBe("스타포스 완료");
  });

  it("파괴 방지 구간과 복구 추천을 근거로 붙인다", () => {
    const [r] = recommend(item({ starforce: 17 }));

    expect(r.reasons.join(" ")).toContain("파괴 방지");
    expect(r.reasons.join(" ")).toContain("12성 복구가 유리");
  });

  it("레전드리가 아닌 윗잠재와 빈 에디셔널을 짚는다", () => {
    const [r] = recommend(
      item({ potential: { grade: "에픽", options: ["STR +6%", null, null] } }),
    );

    expect(r.reasons).toContain("윗잠재 등급: 에픽 — 큐브로 올릴 여지가 있어요.");
    expect(r.reasons).toContain("에디셔널 잠재가 비어 있어요.");
  });
});
