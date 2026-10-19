"use client";

import { useEffect, useState } from "react";

import { formatMeso, formatPct } from "~/format";
import {
  GUARD_STARS,
  assetsOf,
  attemptCostOf,
  buy,
  enhance,
  isOver,
  newGame,
  recover,
  restoreCostOf,
  sell,
  type GameData,
  type GameState,
  type RecoveryChoice,
} from "~/game";
import { Button, PageTitle, SectionContainer } from "~/shared/ui";

const STORAGE_KEY = "starforce-game-v1";
const START_CHOICES = [3e9, 1e10, 5e10];

const INK = "#18181B";
const MUTED = "#71717A";
const DANGER = "#E5052E";

const read = (): GameState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GameState) : null;
  } catch {
    return null;
  }
};

const write = (state: GameState | null) => {
  try {
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장이 막힌 환경에서도 게임은 계속된다.
  }
};

const signed = (meso: number) =>
  Math.abs(meso) < 1 ? "0" : `${meso > 0 ? "+" : "-"}${formatMeso(Math.abs(meso))}`;

export const GameScreen = ({ data }: { data: GameData }) => {
  const [state, setState] = useState<GameState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(read());
    setReady(true);
  }, []);

  const update = (next: GameState | null) => {
    setState(next);
    write(next);
  };

  if (!ready) return null;

  if (!state) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <PageTitle>스타포스 키우기</PageTitle>
        <SectionContainer title="시작 자금을 고르세요">
          <p className="mb-4 text-sm text-default-600">
            {data.level}제 장비를 사서 스타포스를 올리고, 원가 가치에 파는 게임이에요. 시세가 아니라
            &quot;대체 장비 {formatMeso(data.spareCost)} + 그 성까지 키우는 기대 비용&quot;을 판매가로 쓰는 가정값이라, 운이
            좋아야 이득이 나요. 진행 상황은 이 브라우저에만 저장돼요.
          </p>
          <div className="flex flex-wrap gap-2">
            {START_CHOICES.map((meso) => (
              <Button key={meso} color="primary" onPress={() => update(newGame(meso))}>
                {formatMeso(meso)} 메소로 시작
              </Button>
            ))}
          </div>
        </SectionContainer>
      </div>
    );
  }

  const over = isOver(state, data);
  const assets = assetsOf(state, data);
  const row = state.star !== null ? data.table[state.star] : null;
  const canGuard = state.star !== null && GUARD_STARS.includes(state.star);
  const busy = state.destroyedAt !== null;
  const attemptCost = attemptCostOf(state, data, false);
  const guardCost = attemptCostOf(state, data, true);
  const maxed = state.star !== null && state.star >= data.maxStar;

  const rollRng = () => Math.random();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <PageTitle>스타포스 키우기</PageTitle>

      <SectionContainer>
        <dl className="grid grid-cols-3 gap-3 text-center">
          {[
            ["메소", formatMeso(state.meso)],
            ["총 자산(원가 기준)", formatMeso(assets)],
            ["시작 대비", signed(assets - state.startMeso)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-default-500">{label}</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-center text-xs text-default-500">
          시도 {state.attempts}회 · 파괴 {state.destroys}회 · 최고 ★{state.maxStarReached}
        </p>
      </SectionContainer>

      <SectionContainer title={state.star !== null ? `${data.level}제 장비 ★${state.star}` : "장비 없음"}>
        {over && (
          <p className="mb-3 rounded-xl bg-default-100 p-3 text-sm">
            더 살 메소가 없어요. 게임 끝! 최종 자산 {formatMeso(assets)}, 최고 ★{state.maxStarReached}.
          </p>
        )}

        {state.star !== null && !busy && (
          <>
            <div className="h-3 w-full rounded-[4px] bg-default-100">
              <div
                className="bar-grow h-3 rounded-[4px]"
                style={{ width: `${(state.star / data.maxStar) * 100}%`, background: INK }}
              />
            </div>
            <p className="mt-1 text-xs text-default-500">
              ★{state.star} / {data.maxStar} · 지금 팔면 {formatMeso(data.values[state.star])}
            </p>
            {row && !maxed && (
              <>
                <div className="mt-3 flex h-3 gap-0.5" role="img" aria-label="성공 유지 파괴 확률">
                  {[
                    ["성공", row.success, INK],
                    ["유지", row.maintain, MUTED],
                    ["파괴", row.destroy, DANGER],
                  ]
                    .filter(([, p]) => (p as number) > 0)
                    .map(([label, p, color]) => (
                      <div
                        key={label as string}
                        className="rounded-[4px]"
                        style={{ width: `${(p as number) * 100}%`, background: color as string }}
                      />
                    ))}
                </div>
                <p className="mt-1 text-xs text-default-700">
                  성공 {formatPct(row.success * 100)} · 유지 {formatPct(row.maintain * 100)} · 파괴{" "}
                  {formatPct(row.destroy * 100)}
                </p>
              </>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {!maxed && (
                <Button
                  color="primary"
                  isDisabled={state.meso < attemptCost}
                  onPress={() => update(enhance(state, data, false, rollRng))}
                >
                  강화 ({formatMeso(attemptCost)})
                </Button>
              )}
              {canGuard && (
                <Button
                  variant="flat"
                  isDisabled={state.meso < guardCost}
                  onPress={() => update(enhance(state, data, true, rollRng))}
                >
                  파괴 방지 강화 ({formatMeso(guardCost)})
                </Button>
              )}
              <Button variant="bordered" onPress={() => update(sell(state, data))}>
                판매 (+{formatMeso(data.values[state.star])})
              </Button>
            </div>
          </>
        )}

        {state.star === null && !busy && !over && (
          <Button color="primary" onPress={() => update(buy(state, data))}>
            장비 사기 ({formatMeso(data.spareCost)})
          </Button>
        )}

        {busy && state.destroyedAt !== null && (
          <RecoveryChoices
            state={state}
            data={data}
            onChoose={(choice) => update(recover(state, data, choice))}
          />
        )}
      </SectionContainer>

      {state.log.length > 0 && (
        <SectionContainer title="기록">
          <ul className="flex flex-col gap-1 text-sm text-default-700">
            {state.log.map((line, index) => (
              <li key={`${index}-${line}`}>{line}</li>
            ))}
          </ul>
        </SectionContainer>
      )}

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="light"
          onPress={() => {
            if (window.confirm("진행 상황을 지우고 처음부터 시작할까요?")) update(null);
          }}
        >
          새로 시작
        </Button>
      </div>
    </div>
  );
};

const RecoveryChoices = ({
  state,
  data,
  onChoose,
}: {
  state: GameState;
  data: GameData;
  onChoose: (choice: RecoveryChoice) => void;
}) => {
  const destroyedAt = state.destroyedAt!;
  const restoreCost = restoreCostOf(destroyedAt, data);
  const compared = data.recovery[destroyedAt];
  const restoreTarget = Math.min(destroyedAt, 22);

  return (
    <div>
      <p className="mb-3 text-sm font-semibold">★{destroyedAt}에서 파괴됐어요. 어떻게 복구할까요?</p>
      <div className="flex flex-col gap-2">
        <Button
          color="primary"
          isDisabled={restoreCost === null || state.meso < restoreCost}
          onPress={() => onChoose("restore")}
        >
          확정복구 → ★{restoreTarget} ({restoreCost === null ? "불가" : formatMeso(restoreCost)})
          {compared?.cheaper === "확정복구" ? " · 기대값상 유리" : ""}
        </Button>
        <Button
          variant="flat"
          isDisabled={state.meso < data.spareCost}
          onPress={() => onChoose("twelve")}
        >
          12성 복구 → ★12 ({formatMeso(data.spareCost)})
          {compared?.cheaper === "12성 복구" ? " · 기대값상 유리" : ""}
        </Button>
        <Button variant="bordered" onPress={() => onChoose("giveup")}>
          포기
        </Button>
      </div>
      {compared && (
        <p className="mt-2 text-xs text-default-500">
          다시 ★{restoreTarget}까지 가는 기대 비용: 확정복구 {formatMeso(compared.restoreCost)} / 12성 복구{" "}
          {formatMeso(compared.noRestoreCost)}
        </p>
      )}
    </div>
  );
};
