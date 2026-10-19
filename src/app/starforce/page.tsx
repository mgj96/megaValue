import type { Metadata } from "next";
import { z } from "zod";

import { formatMeso, formatPct } from "~/diagnose";
import { loadStarforceRules } from "~/rules";
import { Button, PageTitle, SectionContainer } from "~/shared/ui";
import { compareRecovery, expectedCostOfStep, getCosts } from "~/starforce";

export const metadata: Metadata = { title: "스타포스 테스트 | 메이플 장비 진단" };

const RESTORE_STAR = 12;

const querySchema = z.object({
  level: z.coerce.number().int().min(1).max(300),
  star: z.coerce.number().int().min(0).max(29),
  /** 대체 장비 가격(억). */
  spare: z.coerce.number().min(0).max(100000).default(0),
});

const HUNDRED_MILLION = 100_000_000;

const inputClass =
  "w-full rounded-xl bg-default-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

export default async function StarforcePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = querySchema.safeParse(await searchParams);
  const rules = loadStarforceRules();

  const rows = (() => {
    if (!query.success) return null;
    const { level, star, spare } = query.data;
    const spareCost = spare * HUNDRED_MILLION;
    const maxStar = rules.maxStarOf(level);
    if (maxStar === null || star >= maxStar) return { maxStar, items: [] };

    const last = Math.min(maxStar, 30);
    const expected = Array.from({ length: last }, (_, from) =>
      expectedCostOfStep({ equipLevel: level, table: rules.table, fromStar: from, spareCost }),
    );
    const costs = getCosts(level);

    return {
      maxStar,
      items: Array.from({ length: last - star }, (_, i) => {
        const from = star + i;
        const row = rules.table[from];
        const recovery =
          row.destroy > 0
            ? compareRecovery({
                equipLevel: level,
                table: rules.table,
                star: from,
                spareCost,
                restore: rules.restoreOf(level, from),
              })
            : null;
        return { from, row, attempt: costs[from], expected: expected[from], recovery };
      }),
    };
  })();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <PageTitle>스타포스 테스트</PageTitle>

      <SectionContainer>
        <form className="flex flex-wrap items-end gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            장비 착용 레벨
            <input
              name="level"
              type="number"
              defaultValue={query.success ? query.data.level : 200}
              className={inputClass}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            현재 성
            <input
              name="star"
              type="number"
              defaultValue={query.success ? query.data.star : 17}
              className={inputClass}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            대체 장비 가격(억)
            <input
              name="spare"
              type="number"
              step="any"
              defaultValue={query.success ? query.data.spare : 0}
              className={inputClass}
            />
          </label>
          <Button type="submit" color="primary">
            계산
          </Button>
        </form>
      </SectionContainer>

      {rows && rows.items.length === 0 && (
        <SectionContainer>
          <p className="text-sm text-default-600">
            {rows.maxStar === null
              ? "이 레벨은 규칙 구간 밖이에요."
              : `이 레벨의 최대 성은 ${rows.maxStar}성이라 더 강화할 수 없어요.`}
          </p>
        </SectionContainer>
      )}

      {rows && rows.items.length > 0 && (
        <SectionContainer title={`${query.success ? query.data.star : ""}성부터 ${rows.maxStar}성까지`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-right text-sm">
              <thead className="text-default-500">
                <tr>
                  <th className="py-2 text-left">성</th>
                  <th>1회 메소</th>
                  <th>성공</th>
                  <th>유지</th>
                  <th>파괴</th>
                  <th>1성 기대 메소</th>
                  <th>파괴 시 {RESTORE_STAR}성 복구</th>
                  <th>파괴 시 확정복구</th>
                  <th>유리한 쪽</th>
                </tr>
              </thead>
              <tbody>
                {rows.items.map(({ from, row, attempt, expected, recovery }) => (
                  <tr key={from} className="border-t border-default-100">
                    <td className="py-2 text-left">
                      ★{from}→{from + 1}
                    </td>
                    <td>{formatMeso(attempt)}</td>
                    <td>{formatPct(row.success * 100)}</td>
                    <td>{formatPct(row.maintain * 100)}</td>
                    <td>{formatPct(row.destroy * 100)}</td>
                    <td>{formatMeso(expected)}</td>
                    <td>{recovery ? formatMeso(recovery.noRestoreCost) : "-"}</td>
                    <td>{recovery ? formatMeso(recovery.restoreCost) : "-"}</td>
                    <td>{recovery ? recovery.cheaper : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-default-500">
            {RESTORE_STAR}성 복구는 파괴되면 {RESTORE_STAR}성으로 돌아가 그 성까지 다시 올리는 기대 메소(대체 장비 1개 포함),
            확정복구는 터진 성 그대로 복구하는 재료 비용이에요. 확정복구는 15~22성, 130·135·140·145·150·160·200·250제만
            표가 있어 나머지는 &quot;-&quot;예요. 비용식과 확정복구 표는 비공식 출처(원본 mesulive)이고, 복구 이벤트
            할인은 반영하지 않았어요.
          </p>
        </SectionContainer>
      )}
    </div>
  );
}
