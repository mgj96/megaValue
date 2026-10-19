import { formatMeso, formatPct } from "~/format";
import { SectionContainer } from "~/components/section-container";
import type { AttemptEvaluation, RecoveryComparison } from "~/starforce";

// 색만으로 구분하지 않는다: 모든 막대에 글자 라벨이 붙는다.
const OUTCOME_BG = {
  성공: "bg-foreground",
  유지: "bg-muted-foreground",
  파괴: "bg-destructive",
} as const;

const signed = (meso: number) =>
  Math.abs(meso) < 1 ? "0" : `${meso > 0 ? "+" : "-"}${formatMeso(Math.abs(meso))}`;

export const ExampleCard = ({
  title,
  evaluation,
}: {
  title: string;
  evaluation: AttemptEvaluation;
}) => {
  const { outcomes, expectedNet, recoveryBy, recoveryCost, value, nextValue, attemptCost } =
    evaluation;
  const maxNet = Math.max(...outcomes.map((o) => Math.abs(o.net)), 1);

  return (
    <SectionContainer title={title}>
      <div role="img" aria-label="성공, 유지, 파괴 확률" className="flex h-4 gap-0.5">
        {outcomes
          .filter((o) => o.prob > 0)
          .map((o) => (
            <div
              key={o.label}
              className={`bar-grow rounded-[4px] ${OUTCOME_BG[o.label]}`}
              style={{ width: `${o.prob * 100}%` }}
            />
          ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/80">
        {outcomes.map((o) => (
          <li key={o.label} className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-[3px] ${OUTCOME_BG[o.label]}`} />
            {o.label} {formatPct(o.prob * 100)}
          </li>
        ))}
      </ul>

      <table className="mt-4 w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr>
            <th className="py-1 font-normal">결과</th>
            <th className="font-normal">순손익 (원가 가치 변화 − 쓴 메소)</th>
          </tr>
        </thead>
        <tbody>
          {outcomes
            .filter((o) => o.prob > 0)
            .map((o) => (
              <tr key={o.label} className="border-t border-border">
                <td className="w-16 py-2 align-middle">{o.label}</td>
                <td className="py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-3 flex-1">
                      <div
                        className={`bar-grow h-3 rounded-[4px] ${OUTCOME_BG[o.label]}`}
                        style={{ width: `${(Math.abs(o.net) / maxNet) * 100}%` }}
                      />
                    </div>
                    <span className="w-24 text-right tabular-nums">{signed(o.net)}</span>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <p className="mt-4 text-sm font-semibold text-foreground/90">
        1회 기대 손익 {signed(expectedNet)}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        원가 가치는 대체 장비 값에 0성부터 그 성까지 키우는 기대 비용을 더한 금액이에요(★ 가치{" "}
        {formatMeso(value)} → {formatMeso(nextValue)}, 1회 시도 {formatMeso(attemptCost)}). 시세는 반영하지
        않았고, 평균으로 보면 복구를 싸게 하는 만큼만 이득이 나요.{" "}
        {recoveryCost > 0
          ? `파괴되면 ${recoveryBy}(${formatMeso(recoveryCost)})로 같은 성까지 되돌려요.`
          : "이 구간은 파괴가 없어요."}
      </p>
    </SectionContainer>
  );
};

export const RecoveryBars = ({
  rows,
}: {
  rows: { star: number; recovery: RecoveryComparison }[];
}) => (
  <SectionContainer title="복구 비용 비교">
    <ul className="mb-3 flex gap-4 text-xs text-foreground/80">
      <li className="flex items-center gap-1.5">
        <span className="inline-block size-2.5 rounded-[3px] bg-foreground" />
        확정복구
      </li>
      <li className="flex items-center gap-1.5">
        <span className="inline-block size-2.5 rounded-[3px] bg-muted-foreground" />
        12성 복구
      </li>
    </ul>
    <div className="flex flex-col gap-3">
      {rows.map(({ star, recovery }) => {
        const max = Math.max(recovery.restoreCost, recovery.noRestoreCost, 1);
        const bars = [
          { label: "확정복구", cost: recovery.restoreCost, color: "bg-foreground" },
          { label: "12성 복구", cost: recovery.noRestoreCost, color: "bg-muted-foreground" },
        ] as const;
        return (
          <div key={star}>
            <p className="mb-1 text-xs text-muted-foreground">
              ★{star} 파괴 시 {recovery.cheaper}가 유리
            </p>
            <div className="flex flex-col gap-0.5">
              {bars.map((bar) => (
                <div key={bar.label} className="flex items-center gap-3">
                  <div className="h-3 flex-1">
                    <div
                      className={`bar-grow h-3 rounded-[4px] ${bar.color}`}
                      style={{ width: `${(bar.cost / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-28 text-right text-xs tabular-nums">
                    {bar.label === recovery.cheaper ? "✓ " : ""}
                    {formatMeso(bar.cost)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
    <p className="mt-3 text-xs text-muted-foreground">막대는 별마다 두 비용 중 큰 쪽을 100%로 맞춘 비교예요.</p>
  </SectionContainer>
);
