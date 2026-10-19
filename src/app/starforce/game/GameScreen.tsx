"use client";

import { AnimatePresence, m } from "framer-motion";
import { useEffect, useState } from "react";

import { AnimatedMeso } from "~/components/animated-meso";
import { EquipmentWindow } from "~/components/equipment-window";
import { ItemVisual } from "~/components/item-visual";
import { SectionContainer } from "~/components/section-container";
import { StarStrip } from "~/components/star-strip";
import { StarText } from "~/components/star-text";
import { Button } from "~/components/ui/button";
import { formatMeso, formatPct } from "~/format";
import {
  GUARD_STARS,
  assetsOf,
  attemptCostOf,
  buy,
  dataKeyOf,
  enhance,
  isOver,
  itemOf,
  recover,
  restoreCostOf,
  select,
  selectedItem,
  sell,
  totalStars,
  type GameData,
  type GameItem,
  type GameState,
  type RecoveryChoice,
} from "~/game";
import { cn } from "~/shared/style";

import { fetchGameData } from "./api";
import { StartScreen } from "./StartScreen";

const STORAGE_KEY = "starforce-game-v3";

type Fx = { id: number; kind: "success" | "maintain" | "destroy" | "other" };
type DataMap = Record<string, GameData>;

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
  const [dataMap, setDataMap] = useState<DataMap>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [fx, setFx] = useState<Fx | null>(null);
  const [guardOn, setGuardOn] = useState(false);

  useEffect(() => {
    const saved = read();
    setState(saved);
    setReady(true);
    if (!saved) return;
    const unique = new Map(saved.items.map((item) => [dataKeyOf(item), item]));
    Promise.all(
      [...unique].map(async ([key, item]) => [key, await fetchGameData(item.level, item.price)] as const),
    )
      .then((entries) => setDataMap(Object.fromEntries(entries)))
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  const update = (next: GameState | null, kind: Fx["kind"] = "other") => {
    setState(next);
    write(next);
    setFx((prev) => ({ id: (prev?.id ?? 0) + 1, kind }));
  };

  const begin = (next: GameState, loaded: DataMap) => {
    setDataMap(loaded);
    update(next);
  };

  const dataFor = (item: GameItem) => dataMap[dataKeyOf(item)];

  const tryEnhance = (current: GameState, data: GameData, guard: boolean) => {
    const before = selectedItem(current)?.star ?? null;
    const next = enhance(current, data, guard, Math.random);
    const after = selectedItem(next)?.star ?? null;
    const kind =
      next.destroyed !== null
        ? "destroy"
        : before !== null && after !== null && after > before
          ? "success"
          : "maintain";
    update(next, kind);
  };

  if (!ready) return null;

  if (!state) return <StartScreen onStart={begin} />;

  const missing = state.items.some((item) => !dataFor(item));
  if (missing) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <SectionContainer>
          <p className="text-sm text-muted-foreground">{loadError ?? "게임 데이터를 불러오는 중이에요…"}</p>
          {loadError && (
            <Button className="mt-3" variant="outline" onClick={() => update(null)}>
              처음 화면으로
            </Button>
          )}
        </SectionContainer>
      </div>
    );
  }

  const pending = state.destroyed ? itemOf(state, state.destroyed.key) : undefined;
  const item = pending ?? selectedItem(state)!;
  const data = dataFor(item)!;
  const owned = item.star !== null;
  const over = isOver(state);
  const assets = assetsOf(state, dataFor);
  const star = item.star;
  const row = star !== null ? data.table[star] : null;
  const canGuard = star !== null && GUARD_STARS.includes(star);
  const guard = guardOn && canGuard;
  const maxed = star !== null && star >= data.maxStar;
  const cost = star !== null && !maxed ? attemptCostOf(star, data, guard) : 0;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
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
          <StarText>{`스펙 총 ★${totalStars(state)}`}</StarText>, 시도 {state.attempts}회, 파괴 {state.destroys}회
        </p>
      </SectionContainer>

      <SectionContainer title="장비창">
        <EquipmentWindow
          selected={item.key}
          onSelect={(key) => update(select(state, key))}
          tiles={state.items.map((entry) => ({
            key: entry.key,
            label: entry.slot,
            badge: entry.star !== null ? `★${entry.star}` : undefined,
            dim: entry.star === null,
            icon: (
              <ItemVisual
                icon={entry.icon}
                setId={entry.setId}
                slot={entry.slotId}
                label={entry.name}
              />
            ),
          }))}
        />
      </SectionContainer>

      <SectionContainer
        key={fx?.id}
        title={item.name}
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
            더 살 메소가 없어요. 게임 끝! 최종 자산 {formatMeso(assets)}.
          </p>
        )}

        {owned && !pending && star !== null && (
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              disabled={maxed || state.meso < cost}
              onClick={() => tryEnhance(state, data, guard)}
              aria-label={`${item.name} 강화하기`}
              className="group relative size-36 rounded-2xl border-2 bg-muted/50 p-2 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary hover:shadow-md active:translate-y-0 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
            >
              <ItemVisual
                icon={item.icon}
                setId={item.setId}
                slot={item.slotId}
                label={item.name}
                className="rounded-xl"
              />
              <span className="absolute left-1.5 top-1.5 rounded bg-yellow-400 px-1.5 text-xs font-bold leading-5 text-zinc-900">
                ★{star}
              </span>
              {!maxed && (
                <span className="absolute inset-x-2 bottom-2 rounded-md bg-background/85 py-0.5 text-center text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  눌러서 강화
                </span>
              )}
            </button>

            <p className="text-sm font-semibold">{maxed ? "최대 성이에요" : `강화 1회 ${formatMeso(cost)}`}</p>

            <div className="w-full">
              <StarStrip star={star} max={data.maxStar} />
              <p className="mt-1 text-xs text-muted-foreground">
                <StarText>{`★${star} / ${data.maxStar}, 지금 팔면 ${formatMeso(data.values[star])}`}</StarText>
              </p>
            </div>

            {row && !maxed && (
              <div className="w-full">
                <div className="flex h-3 gap-0.5" role="img" aria-label="성공 유지 파괴 확률">
                  {[
                    { label: "성공", p: row.success, bg: "bg-foreground" },
                    { label: "유지", p: row.maintain + (guard ? row.destroy : 0), bg: "bg-muted-foreground" },
                    { label: "파괴", p: guard ? 0 : row.destroy, bg: "bg-destructive" },
                  ]
                    .filter(({ p }) => p > 0)
                    .map(({ label, p, bg }) => (
                      <div key={label} className={cn("bar-grow rounded-[4px]", bg)} style={{ width: `${p * 100}%` }} />
                    ))}
                </div>
                <p className="mt-1 text-xs text-foreground/80">
                  성공 {formatPct(row.success * 100)}, 유지 {formatPct((row.maintain + (guard ? row.destroy : 0)) * 100)},
                  파괴 {formatPct((guard ? 0 : row.destroy) * 100)}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              {canGuard && (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={guardOn}
                    onChange={(event) => setGuardOn(event.target.checked)}
                    className="size-4 accent-primary"
                  />
                  파괴 방지 (비용 3배)
                </label>
              )}
              <Button variant="outline" onClick={() => update(sell(state, data))}>
                판매 (+{formatMeso(data.values[star])})
              </Button>
            </div>
          </div>
        )}

        {!owned && !pending && !over && (
          <button
            type="button"
            disabled={state.meso < item.price}
            onClick={() => update(buy(state, data))}
            className="mx-auto flex size-36 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-sm text-muted-foreground transition-all hover:border-primary hover:text-foreground active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="text-3xl leading-none">+</span>
            <span className="font-semibold">{item.slot} 사기</span>
            <span className="text-xs">{formatMeso(item.price)}</span>
          </button>
        )}

        {pending && state.destroyed && (
          <RecoveryChoices
            meso={state.meso}
            destroyedAt={state.destroyed.star}
            data={data}
            price={pending.price}
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
                  <StarText>{line}</StarText>
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
  meso,
  destroyedAt,
  data,
  price,
  onChoose,
}: {
  meso: number;
  destroyedAt: number;
  data: GameData;
  price: number;
  onChoose: (choice: RecoveryChoice) => void;
}) => {
  const restoreCost = restoreCostOf(destroyedAt, data);
  const compared = data.recovery[destroyedAt];
  const restoreTarget = Math.min(destroyedAt, 22);

  return (
    <div>
      <p className="mb-3 text-sm font-semibold">
        <StarText>{`★${destroyedAt}에서 파괴됐어요. 어떻게 복구할까요?`}</StarText>
      </p>
      <div className="flex flex-col gap-2">
        <Button disabled={restoreCost === null || meso < restoreCost} onClick={() => onChoose("restore")}>
          <StarText>{`확정복구 → ★${restoreTarget} (${restoreCost === null ? "불가" : formatMeso(restoreCost)})`}</StarText>
          {compared?.cheaper === "확정복구" ? " · 기대값상 유리" : ""}
        </Button>
        <Button variant="secondary" disabled={meso < price} onClick={() => onChoose("twelve")}>
          <StarText>{`12성 복구 → ★12 (${formatMeso(price)})`}</StarText>
          {compared?.cheaper === "12성 복구" ? " · 기대값상 유리" : ""}
        </Button>
        <Button variant="outline" onClick={() => onChoose("giveup")}>
          포기
        </Button>
      </div>
      {compared && (
        <p className="mt-2 text-xs text-muted-foreground">
          <StarText>{`다시 ★${restoreTarget}까지 가는 기대 비용: 확정복구 ${formatMeso(compared.restoreCost)} / 12성 복구 ${formatMeso(compared.noRestoreCost)}`}</StarText>
        </p>
      )}
    </div>
  );
};
