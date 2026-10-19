import { z } from "zod";

import type { Equipment } from "./nexon";
import { loadRule, type StarforceRules } from "./rules";
import { expectedCostOfStep, getCosts } from "./starforce";

type Item = Equipment["items"][number];

export type ItemDiagnosis = {
  slot: string;
  name: string;
  level: number;
  star: number;
  /** 규칙 구간 밖이면 null. */
  maxStar: number | null;
  /** 최대 성이거나 레벨 정보가 없으면 null. */
  next: null | {
    successPct: number;
    destroyPct: number;
    mesoPerAttempt: number;
    /** 다음 1성까지 기대 메소. 파괴 시 대체 장비 비용은 포함하지 않는다(spareCost = 0). */
    expectedMeso: number;
  };
  potential: Item["potential"];
  additionalPotential: Item["additionalPotential"];
};

export const diagnoseItems = (
  equipment: Equipment,
  { table, maxStarOf }: StarforceRules,
): ItemDiagnosis[] =>
  equipment.items.map((item) => {
    const star = Number.isFinite(item.starforce) ? item.starforce : 0;
    const maxStar = maxStarOf(item.level);
    const canEnhance = item.level > 0 && maxStar !== null && star < maxStar && star < 30;

    return {
      slot: item.slot,
      name: item.name,
      level: item.level,
      star,
      maxStar,
      next: canEnhance
        ? {
            successPct: table[star].success * 100,
            destroyPct: table[star].destroy * 100,
            mesoPerAttempt: getCosts(item.level)[star],
            expectedMeso: expectedCostOfStep({
              equipLevel: item.level,
              table,
              fromStar: star,
              spareCost: 0,
            }),
          }
        : null,
      potential: item.potential,
      additionalPotential: item.additionalPotential,
    };
  });

export const formatMeso = (meso: number): string => {
  if (meso >= 1e12) return `${(meso / 1e12).toFixed(2)}조`;
  if (meso >= 1e8) return `${(meso / 1e8).toFixed(2)}억`;
  if (meso >= 1e4) return `${Math.round(meso / 1e4).toLocaleString("ko-KR")}만`;
  return `${Math.round(meso)}`;
};
export const formatPct = (pct: number): string => `${Number(pct.toFixed(2))}%`;
const optionsOf = (potential: Item["potential"]): string =>
  potential.options.filter(Boolean).join(" / ") || "없음";

/** 대화창에 보여줄 설명. LLM 없이 코드가 만든 고정 문장이다. */
export const buildReply = (
  equipment: Equipment,
  diagnoses: ItemDiagnosis[],
): string => {
  const lines = [
    `${equipment.characterClass} 캐릭터의 장비 ${diagnoses.length}개를 확인했어요${
      equipment.date ? ` (기준일 ${equipment.date.slice(0, 10)})` : ""
    }.`,
    "",
    "[스타포스 — 다음 1성 시도]",
  ];

  const enhanceable = diagnoses.filter((d) => d.next);
  if (enhanceable.length === 0) lines.push("강화할 수 있는 장비가 없어요.");
  for (const d of enhanceable) {
    const n = d.next!;
    lines.push(
      `• ${d.slot} ${d.name} (${d.level}제) ★${d.star}→★${d.star + 1}: ` +
        `1회 ${formatMeso(n.mesoPerAttempt)} 메소, 성공 ${formatPct(n.successPct)}, ` +
        `파괴 ${formatPct(n.destroyPct)}, 기대 ${formatMeso(n.expectedMeso)} 메소`,
    );
  }

  lines.push("", "[잠재능력]");
  for (const d of diagnoses) {
    if (!d.potential.grade && !d.additionalPotential.grade) continue;
    lines.push(
      `• ${d.slot}: ${d.potential.grade ?? "-"} (${optionsOf(d.potential)}) ` +
        `| 에디셔널 ${d.additionalPotential.grade ?? "-"} (${optionsOf(d.additionalPotential)})`,
    );
  }

  lines.push(
    "",
    "※ 기대 메소는 파괴 시 대체 장비 비용을 뺀 값이고, 비용식은 비공식 출처예요.",
    "※ 효율 순위(능력치 상승 ÷ 메소)는 성별 능력치 상승 폭, 큐브 메소 가격, 직업별 환산 계수가 확정되면 제공해요. 지금은 비용 진단까지예요.",
    "※ 엠블렘·뱃지·포켓처럼 스타포스를 못 하는 장비도 목록에 나올 수 있어요.",
  );
  return lines.join("\n");
};

const cubeRuleSchema = z.object({
  version: z.string(),
  grade_up: z.record(z.record(z.number())),
  pity: z.record(z.record(z.number())),
});

const OFFICIAL_SOURCES = [
  "스타포스 15~29성 확률: https://maplestory.nexon.com/testworld/news/update/88",
  "스타포스 규칙: https://maplestory.nexon.com/Guide/N23GameInformation/Articles/412",
  "큐브 확률: https://maplestory.nexon.com/Guide/OtherProbability/cube/black",
];

/**
 * 외부 AI(Gemini 등)에 붙여 넣는 진단 프롬프트.
 * RAG 방식: 이 장비들에 실제로 필요한 규칙 행만 골라 넣는다.
 */
export const buildDiagnosisPrompt = (
  equipment: Equipment,
  diagnoses: ItemDiagnosis[],
  rules: StarforceRules,
): string => {
  const targets = diagnoses.filter((d) => d.next);
  const neededStars = [...new Set(targets.map((d) => d.star))].sort((a, b) => a - b);
  const starRules = neededStars.map((star) => {
    const row = rules.table[star];
    return `${star}성→${star + 1}성: 성공 ${formatPct(row.success * 100)}, 유지 ${formatPct(
      row.maintain * 100,
    )}, 파괴 ${formatPct(row.destroy * 100)}`;
  });

  const needsCube = diagnoses.some(
    (d) => d.potential.grade && d.potential.grade !== "레전드리",
  );
  const cube = needsCube ? cubeRuleSchema.safeParse(loadRule("cube")) : null;
  const cubeLines = cube?.success
    ? [
        `등급 상승 확률(%): ${JSON.stringify(cube.data.grade_up)}`,
        `등급 상승 보장 횟수: ${JSON.stringify(cube.data.pity)}`,
      ]
    : ["(레전드리가 아닌 잠재능력이 없어 큐브 규칙 생략)"];

  const itemLines = diagnoses.map((d) =>
    [
      `- ${d.slot} ${d.name} (${d.level}제, ★${d.star}/${d.maxStar ?? "?"})`,
      d.next
        ? ` 다음 1성: 1회 ${formatMeso(d.next.mesoPerAttempt)}메소, 성공 ${formatPct(
            d.next.successPct,
          )}, 파괴 ${formatPct(d.next.destroyPct)}, 기대 ${formatMeso(d.next.expectedMeso)}메소`
        : " 스타포스 추가 강화 불가/해당 없음",
      ` | 잠재 ${d.potential.grade ?? "-"}: ${optionsOf(d.potential)}`,
      ` | 에디셔널 ${d.additionalPotential.grade ?? "-"}: ${optionsOf(d.additionalPotential)}`,
    ].join(""),
  );

  return [
    "너는 메이플스토리 장비 강화 조언자야. 아래 [데이터]와 [규칙]만 근거로 판단해.",
    "데이터에 없는 수치(스타포스 성별 능력치 상승 폭, 큐브 메소 가격 등)는 추측해서 숫자로 말하지 말고, 모르면 '알 수 없음'이라고 써. 알고 있는 일반 지식을 쓴다면 '일반 지식 기준'이라고 명시해.",
    "",
    `[캐릭터] 직업 ${equipment.characterClass}, 기준일 ${equipment.date?.slice(0, 10) ?? "최신"}, 프리셋 ${equipment.presetNo}`,
    "",
    "[데이터: 코드가 계산한 값. 기대 메소는 파괴 시 대체 장비 비용 제외, 비용식은 비공식 출처]",
    ...itemLines,
    "",
    `[규칙 v${rules.version} — 이 장비들에 필요한 행만 발췌]`,
    ...starRules,
    "스타포스는 실패해도 성이 내려가지 않고, 15성 이상에서만 파괴될 수 있다. 파괴 방지는 15~17성에서 기본 비용의 200%를 추가로 낸다.",
    ...cubeLines,
    "",
    "[출처]",
    ...OFFICIAL_SOURCES,
    "",
    "[요청]",
    "1) 지금 가장 먼저 손볼 장비 부위 3개와 이유 (이유마다 근거가 [데이터]/[규칙]/일반 지식 중 무엇인지 표시)",
    "2) 위 데이터만으로는 판단할 수 없는 항목과, 판단하려면 필요한 정보",
    "3) 파괴 위험이 큰 시도에 대한 주의점",
  ].join("\n");
};
