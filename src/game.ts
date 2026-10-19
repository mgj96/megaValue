import { GUARD_EXTRA_COST_RATIO, RESTORE_MAX_STAR, type RecoveryComparison, type StarRow } from "./starforce";

/** 파괴 방지를 걸 수 있는 성(rules/starforce.yaml 의 destroy_guard_available_stars). */
export const GUARD_STARS: readonly number[] = [15, 16, 17];

const LOG_LIMIT = 50;

/** 서버가 규칙에서 계산해 화면으로 넘기는 읽기 전용 데이터. */
export type GameData = {
  level: number;
  /** 게임용 가정값. 장비를 사는 가격이자 파괴 후 12성 복구에 드는 대체 장비 1개 가격. */
  spareCost: number;
  maxStar: number;
  table: StarRow[];
  /** index = 성, 강화 1회 기본 메소. */
  costs: number[];
  /** index = 성(0~maxStar), 원가 기반 판매가. 시세가 아니다. */
  values: number[];
  /** index = 파괴된 성. 확정복구가 없는 조합이면 null. */
  recovery: Record<number, RecoveryComparison | null>;
  /** index = 복구 목표 성(15~22). 필요한 대체 장비 수와 메소. */
  restore: Record<number, { spareCount: number; meso: number } | null>;
};

export type GameMode = "mine" | "scratch";

export type GameState = {
  mode: GameMode;
  /** 장비 착용 레벨. GameData 를 이 레벨로 불러온다. */
  level: number;
  /** 고른 장비 이름(예: "에테르넬 모자", 내 장비면 게임 속 이름). */
  itemName: string | null;
  /** 처음부터 하기에서 고른 세트와 부위. 아이콘을 그릴 때 쓴다. */
  setId: string | null;
  slot: string | null;
  /** 내 장비 모드에서 넥슨이 준 아이콘 주소. */
  icon: string | null;
  /** 시작 시점 자산(메소 + 장비 원가 가치). 손익 기준이다. */
  startAssets: number;
  meso: number;
  /** 보유 장비의 성. 장비가 없으면 null. */
  star: number | null;
  /** 파괴 직후 복구 방식을 고르는 중이면 터진 성. */
  destroyedAt: number | null;
  attempts: number;
  destroys: number;
  maxStarReached: number;
  log: string[];
};

export type RecoveryChoice = "restore" | "twelve" | "giveup";

export const newGame = ({
  mode,
  level,
  meso,
  star = null,
  itemName = null,
  setId = null,
  slot = null,
  icon = null,
  startAssets = meso,
}: {
  mode: GameMode;
  level: number;
  meso: number;
  star?: number | null;
  itemName?: string | null;
  setId?: string | null;
  slot?: string | null;
  icon?: string | null;
  startAssets?: number;
}): GameState => ({
  mode,
  level,
  itemName,
  setId,
  slot,
  icon,
  startAssets,
  meso,
  star,
  destroyedAt: null,
  attempts: 0,
  destroys: 0,
  maxStarReached: star ?? 0,
  log: [],
});

export const assetsOf = (state: GameState, data: GameData) =>
  state.meso + (state.star !== null ? data.values[state.star] : 0);

export const isOver = (state: GameState, data: GameData) =>
  state.star === null && state.destroyedAt === null && state.meso < data.spareCost;

export const attemptCostOf = (state: GameState, data: GameData, guard: boolean) =>
  state.star === null
    ? 0
    : data.costs[state.star] * (guard ? 1 + GUARD_EXTRA_COST_RATIO : 1);

/** 확정복구 총비용(필요 대체 장비 + 메소). 목표 성은 22성까지. 불가능하면 null. */
export const restoreCostOf = (destroyedAt: number, data: GameData) => {
  const restore = data.restore[Math.min(destroyedAt, RESTORE_MAX_STAR)];
  return restore ? restore.spareCount * data.spareCost + restore.meso : null;
};

const log = (state: GameState, line: string): GameState => ({
  ...state,
  log: [line, ...state.log].slice(0, LOG_LIMIT),
});

const idle = (state: GameState) => state.destroyedAt === null;

export const buy = (state: GameState, data: GameData): GameState => {
  if (state.star !== null || !idle(state) || state.meso < data.spareCost) return state;
  return log({ ...state, meso: state.meso - data.spareCost, star: 0 }, "장비를 샀어요. ★0");
};

export const sell = (state: GameState, data: GameData): GameState => {
  if (state.star === null || !idle(state)) return state;
  const price = data.values[state.star];
  return log(
    { ...state, meso: state.meso + price, star: null },
    `★${state.star} 장비를 원가 가치로 팔았어요.`,
  );
};

export const enhance = (
  state: GameState,
  data: GameData,
  guard: boolean,
  rng: () => number,
): GameState => {
  const { star } = state;
  if (star === null || !idle(state) || star >= data.maxStar) return state;
  if (guard && !GUARD_STARS.includes(star)) return state;

  const cost = attemptCostOf(state, data, guard);
  if (state.meso < cost) return state;

  const row = data.table[star];
  // 파괴 방지: 파괴 확률은 유지 확률로 넘어간다.
  const destroy = guard ? 0 : row.destroy;
  const roll = rng();
  const paid = { ...state, meso: state.meso - cost, attempts: state.attempts + 1 };

  if (roll < row.success) {
    return log(
      { ...paid, star: star + 1, maxStarReached: Math.max(state.maxStarReached, star + 1) },
      `★${star}→★${star + 1} 성공!`,
    );
  }
  if (roll >= 1 - destroy) {
    return log(
      { ...paid, star: null, destroyedAt: star, destroys: state.destroys + 1 },
      `★${star}에서 장비가 파괴됐어요.`,
    );
  }
  return log(paid, `★${star} 유지.`);
};

export const recover = (
  state: GameState,
  data: GameData,
  choice: RecoveryChoice,
): GameState => {
  const { destroyedAt } = state;
  if (destroyedAt === null) return state;
  const done = { ...state, destroyedAt: null };

  if (choice === "giveup") return log(done, "복구하지 않고 포기했어요.");

  if (choice === "twelve") {
    if (state.meso < data.spareCost) return state;
    return log({ ...done, meso: state.meso - data.spareCost, star: 12 }, "12성 복구: ★12로 돌아왔어요.");
  }

  const cost = restoreCostOf(destroyedAt, data);
  if (cost === null || state.meso < cost) return state;
  const target = Math.min(destroyedAt, RESTORE_MAX_STAR);
  return log({ ...done, meso: state.meso - cost, star: target }, `확정복구: ★${target}로 돌아왔어요.`);
};
