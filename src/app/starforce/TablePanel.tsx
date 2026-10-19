import { z } from "zod";

import { SectionContainer } from "~/components/section-container";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { formatMeso, formatPct } from "~/format";
import { ITEM_SETS, setById, setNameOfLevel } from "~/items";
import { loadStarforceRules } from "~/rules";
import { compareRecovery, evaluateAttempt, expectedCostOfStep, getCosts } from "~/starforce";

import { ExampleCard, RecoveryBars } from "./Charts";

const RESTORE_STAR = 12;

const querySchema = z.object({
  level: z.coerce.number().int().min(1).max(300),
  star: z.coerce.number().int().min(0).max(29),
  /** 대체 장비 가격(억). */
  spare: z.coerce.number().min(0).max(100000).default(0),
});

const HUNDRED_MILLION = 100_000_000;


/** 계산표 탭: 입력한 레벨과 성에서 30성까지 단계별 확률·기대 메소·복구 비교. */
export const TablePanel = async ({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) => {
  const picked = typeof searchParams.set === "string" ? setById(searchParams.set) : undefined;
  const query = querySchema.safeParse({ ...searchParams, level: picked?.level ?? searchParams.level });
  const setLabel = query.success ? (picked?.name ?? setNameOfLevel(query.data.level) ?? `${query.data.level}제`) : "";
  const rules = loadStarforceRules();

  const rows = (() => {
    if (!query.success) return null;
    const { level, star, spare } = query.data;
    const spareCost = spare * HUNDRED_MILLION;
    const maxStar = rules.maxStarOf(level);
    if (maxStar === null || star >= maxStar) return { maxStar, example: null, items: [] };

    const last = Math.min(maxStar, 30);
    const expected = Array.from({ length: last }, (_, from) =>
      expectedCostOfStep({ equipLevel: level, table: rules.table, fromStar: from, spareCost }),
    );
    const costs = getCosts(level);

    const example = evaluateAttempt({
      equipLevel: level,
      table: rules.table,
      star,
      spareCost,
      restoreOf: rules.restoreOf,
    });

    return {
      maxStar,
      example,
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
                restoreOf: rules.restoreOf,
              })
            : null;
        return { from, row, attempt: costs[from], expected: expected[from], recovery };
      }),
    };
  })();

  return (
    <div className="flex flex-col gap-4">

      <SectionContainer>
        <form className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="tab" value="table" />
          <label className="flex flex-1 flex-col gap-1 text-sm">
            세트
            <select
              name="set"
              defaultValue={picked?.id ?? ITEM_SETS.find((x) => query.success && x.level === query.data.level)?.id ?? "eternal"}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {ITEM_SETS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            현재 성
            <Input
              name="star"
              type="number"
              defaultValue={query.success ? query.data.star : 17}
                          />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            대체 장비 가격(억)
            <Input
              name="spare"
              type="number"
              step="any"
              defaultValue={query.success ? query.data.spare : 0}
                          />
          </label>
          <Button type="submit">
            계산
          </Button>
        </form>
      </SectionContainer>

      {rows && rows.items.length === 0 && (
        <SectionContainer>
          <p className="text-sm text-muted-foreground">
            {rows.maxStar === null
              ? "이 장비는 규칙 구간 밖이에요."
              : `이 장비의 최대 성은 ${rows.maxStar}성이라 더 강화할 수 없어요.`}
          </p>
        </SectionContainer>
      )}

      {rows?.example && query.success && (
        <ExampleCard
          title={`${setLabel} ★${query.data.star}→${query.data.star + 1} 1회 시도 예제`}
          evaluation={rows.example}
        />
      )}

      {rows && rows.items.length > 0 && (
        <SectionContainer title={`${query.success ? query.data.star : ""}성부터 ${rows.maxStar}성까지`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-right text-sm">
              <thead className="text-muted-foreground">
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
                  <tr key={from} className="border-t border-border">
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
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {RESTORE_STAR}성 복구는 파괴되면 {RESTORE_STAR}성으로 돌아가 그 성까지 다시 올리는 기대 메소예요(대체 장비 1개
            포함). 확정복구는 터진 성 그대로 복구하는 재료 비용이고, 23성 이상에서 파괴되면 22성으로 설정되니 22성까지
            돌아오는 비용을 비교해요. 확정복구 표는 파프니르, 앱솔랩스, 칠흑, 여명, 아케인셰이드, 에테르넬 구간에만
            있어요. 비용식과 확정복구 표는 비공식 출처(원본 mesulive)를 썼고 복구 이벤트 할인은 넣지 않았어요.
          </p>
        </SectionContainer>
      )}

      {rows && (() => {
        const compared = rows.items.flatMap(({ from, recovery }) =>
          recovery ? [{ star: from, recovery }] : [],
        );
        return compared.length > 0 ? <RecoveryBars rows={compared} /> : null;
      })()}
    </div>
  );
};
