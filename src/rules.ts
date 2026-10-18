import { readFileSync } from "node:fs";
import path from "node:path";

import { parse } from "yaml";
import { z } from "zod";

import type { StarRow } from "./starforce";

export const ruleNameSchema = z.enum(["starforce", "cube"]);
export type RuleName = z.infer<typeof ruleNameSchema>;

/**
 * rules/<name>.yaml 을 읽어 그대로 돌려준다. name 은 enum 이라 경로 조작이 불가능하다.
 * Next standalone 빌드에서도 읽히도록 cwd 기준 경로를 쓰고, next.config.mjs 의
 * outputFileTracingIncludes 로 rules/ 를 번들에 포함한다.
 */
export const loadRule = (name: RuleName): unknown =>
  parse(readFileSync(path.join(process.cwd(), "rules", `${name}.yaml`), "utf8"));

const rowSchema = z.object({
  success: z.number(),
  maintain: z.number(),
  destroy: z.number(),
});
const starforceRuleSchema = z.object({
  version: z.string(),
  max_star_by_level: z.array(
    z.object({
      level_min: z.number(),
      level_max: z.number().nullable(),
      max_star: z.number(),
    }),
  ),
  probabilities_0_to_14: z.record(rowSchema),
  probabilities_15_to_29: z.record(rowSchema),
});

export type StarforceRules = {
  version: string;
  /** 길이 30, index = 성. 값은 0~1. */
  table: StarRow[];
  /** 장비 착용 레벨 → 최대 스타포스. 구간 밖이면 null. */
  maxStarOf: (level: number) => number | null;
};

/** 스타포스 규칙을 읽고 검증한다. 행이 빠졌거나 확률 합이 100%가 아니면 던진다. */
export const loadStarforceRules = (): StarforceRules => {
  const rule = starforceRuleSchema.parse(loadRule("starforce"));
  const all = { ...rule.probabilities_0_to_14, ...rule.probabilities_15_to_29 };

  const table = Array.from({ length: 30 }, (_, star) => {
    const row = all[String(star)];
    if (!row) throw new Error(`rules/starforce.yaml: ${star}성 행이 없습니다`);
    const sum = row.success + row.maintain + row.destroy;
    if (Math.abs(sum - 100) > 1e-6) {
      throw new Error(`rules/starforce.yaml: ${star}성 확률 합이 ${sum}% 입니다`);
    }
    return {
      success: row.success / 100,
      maintain: row.maintain / 100,
      destroy: row.destroy / 100,
    };
  });

  return {
    version: rule.version,
    table,
    maxStarOf: (level) =>
      rule.max_star_by_level.find(
        ({ level_min, level_max }) =>
          level >= level_min && (level_max === null || level <= level_max),
      )?.max_star ?? null,
  };
};

/** 하위 호환: 표만 필요한 곳용. */
export const loadStarforceTable = (): StarRow[] => loadStarforceRules().table;
