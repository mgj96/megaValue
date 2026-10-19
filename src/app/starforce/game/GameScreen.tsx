"use client";

import { AnimatePresence, m } from "framer-motion";
import { useEffect, useState } from "react";

import { formatMeso, formatPct } from "~/format";
import {
  GUARD_STARS,
  assetsOf,
  attemptCostOf,
  buy,
  enhance,
  isOver,
  recover,
  restoreCostOf,
  sell,
  type GameData,
  type GameState,
  type RecoveryChoice,
} from "~/game";
import { AnimatedMeso } from "~/components/animated-meso";
import { SectionContainer } from "~/components/section-container";
import { StarStrip } from "~/components/star-strip";
import { Button } from "~/components/ui/button";
import { cn } from "~/shared/style";

import { fetchGameData } from "./api";
import { StartScreen } from "./StartScreen";

const STORAGE_KEY = "starforce-game-v2";

type Fx = { id: number; kind: "success" | "maintain" | "destroy" | "other" };

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

export const GameScreen = () => {
  const [state, setState] = useState<GameState | null>(null);
  const [data, setData] = useState<GameData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [fx, setFx] = useState<Fx | null>(null);

  useEffect(() => {
    const saved = read();
    setState(saved);
    setReady(true);
    if (!saved) return;
    fetchGameData(saved.level)
      .then(setData)
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  const begin = (next: GameState, loaded: GameData) => {
    setData(loaded);
    update(next);
  };

  const update = (next: GameState | null, kind: Fx["kind"] = "other") => {
    setState(next);
    write(next);
    setFx((prev) => ({ id: (prev?.id ?? 0) + 1, kind }));
  };

  const tryEnhance = (current: GameState, loaded: GameData, guard: boolean) => {
    const next = enhance(current, loaded, guard, Math.random);
    const kind =
      next.destroyedAt !== null
        ? "destroy"
        : next.star !== null && current.star !== null && next.star > current.star
          ? "success"
          : "maintain";
    update(next, kind);
  };

  if (!ready) return null;

  if (!state) return <StartScreen onStart={begin} />;

  if (!data) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <SectionContainer>
          <p className="text-sm text-muted-foreground">
            {loadError ?? "게임 데이터를 불러오는 중이에요…"}
          </p>
          {loadError && (
            <Button className="mt-3" variant="outline" onClick={() => update(null)}>
              처음 화면으로
            </Button>
          )}
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

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <p className="-mt-2 text-sm text-muted-foreground">
        {state.mode === "mine" ? `내 장비 · ${state.itemName}` : `처음부터 · ${state.level}제`}
      </p>

      <SectionContainer>
        <dl className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "메소", value: state.meso, signed: false },
            { label: "총 자산(원가 기준)", value: assets, signed: false },
            { label: "시작 대비", value: assets - state.startAssets, signed: true },
          ].map(({ label, value, signed }) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">
                <AnimatedMeso value={value} signed={signed} />
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          시도 {state.attempts}회 · 파괴 {state.destroys}회 · 최고 ★{state.maxStarReached}
        </p>
      </SectionContainer>

      <SectionContainer
        key={fx?.id}
        title={state.star !== null ? `${data.level}제 장비 ★${state.star}` : "장비 없음"}
        className={cn(
          "relative overflow-hidden",
          fx?.kind === "success" && "animate-star-pop",
          fx?.kind === "destroy" && "animate-shake",
        )}
      >
        {fx?.kind === "destroy" && (
          <div className="pointer-events-none absolute inset-0 animate-destroy-flash" aria-hidden />
        )}
        {over && (
          <p className="mb-3 rounded-xl bg-muted p-3 text-sm">
            더 살 메소가 없어요. 게임 끝! 최종 자산 {formatMeso(assets)}, 최고 ★{state.maxStarReached}.
          </p>
        )}

        {state.star !== null && !busy && (
          <>
            <StarStrip star={state.star} max={data.maxStar} />
            <p className="mt-1 text-xs text-muted-foreground">
              ★{state.star} / {data.maxStar} · 지금 팔면 {formatMeso(data.values[state.star])}
            </p>
            {row && !maxed && (
              <>
                <div className="mt-3 flex h-3 gap-0.5" role="img" aria-label="성공 유지 파괴 확률">
                  {[
                    { label: "성공", p: row.success, bg: "bg-foreground" },
                    { label: "유지", p: row.maintain, bg: "bg-muted-foreground" },
                    { label: "파괴", p: row.destroy, bg: "bg-destructive" },
                  ]
                    .filter(({ p }) => p > 0)
                    .map(({ label, p, bg }) => (
                      <div
                        key={label}
                        className={cn("bar-grow rounded-[4px]", bg)}
                        style={{ width: `${p * 100}%` }}
                      />
                    ))}
                </div>
                <p className="mt-1 text-xs text-foreground/80">
                  성공 {formatPct(row.success * 100)} · 유지 {formatPct(row.maintain * 100)} · 파괴{" "}
                  {formatPct(row.destroy * 100)}
                </p>
              </>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {!maxed && (
                <Button disabled={state.meso < attemptCost} onClick={() => tryEnhance(state, data, false)}>
                  강화 ({formatMeso(attemptCost)})
                </Button>
              )}
              {canGuard && (
                <Button
                  variant="secondary"
                  disabled={state.meso < guardCost}
                  onClick={() => tryEnhance(state, data, true)}
                >
                  파괴 방지 강화 ({formatMeso(guardCost)})
                </Button>
              )}
              <Button variant="outline" onClick={() => update(sell(state, data))}>
                판매 (+{formatMeso(data.values[state.star])})
              </Button>
            </div>
          </>
        )}

        {state.star === null && !busy && !over && (
          <Button onClick={() => update(buy(state, data))}>
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
          <ul className="flex flex-col gap-1 text-sm text-foreground/80">
            <AnimatePresence initial={false}>
              {state.log.map((line, index) => (
                <m.li
                  key={`${state.attempts}-${state.log.length - index}`}
                  layout="position"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {line}
                </m.li>
              ))}
            </AnimatePresence>
          </ul>
        </SectionContainer>
      )}

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
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
         
          disabled={restoreCost === null || state.meso < restoreCost}
          onClick={() => onChoose("restore")}
        >
          확정복구 → ★{restoreTarget} ({restoreCost === null ? "불가" : formatMeso(restoreCost)})
          {compared?.cheaper === "확정복구" ? " · 기대값상 유리" : ""}
        </Button>
        <Button
          variant="secondary"
          disabled={state.meso < data.spareCost}
          onClick={() => onChoose("twelve")}
        >
          12성 복구 → ★12 ({formatMeso(data.spareCost)})
          {compared?.cheaper === "12성 복구" ? " · 기대값상 유리" : ""}
        </Button>
        <Button variant="outline" onClick={() => onChoose("giveup")}>
          포기
        </Button>
      </div>
      {compared && (
        <p className="mt-2 text-xs text-muted-foreground">
          다시 ★{restoreTarget}까지 가는 기대 비용: 확정복구 {formatMeso(compared.restoreCost)} / 12성 복구{" "}
          {formatMeso(compared.noRestoreCost)}
        </p>
      )}
    </div>
  );
};
