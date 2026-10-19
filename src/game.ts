import { GUARD_EXTRA_COST_RATIO, RESTORE_MAX_STAR, type RecoveryComparison, type StarRow } from "./starforce";

/** 파괴 방지를 걸 수 있는 성(rules/starforce.yaml 의 destroy_guard_available_stars). */
export const GUARD_STARS: readonly number[] = [15, 16, 17];

const LOG_LIMIT = 50;

/** 서버가 규칙에서 계산해 화면으로 넘기는 읽기 전용 데이터. 착용 레벨과 구매가 조합마다 하나다. */
export type GameData = {
  level: number;
  /** 장비를 사는 값이자 파괴 후 12성 복구에 드는 대체 장비 1개 값. 시세가 아니라 게임용 가정값이다. */
  spareCost: number;
  maxStar: number;
  table: StarRow[];
  /** index = 성, 강화 1회 기본 메소. */
  costs: number[];
  /** index = 성(0~maxStar), 원가 기반 판매가. */
  values: number[];
  /** index = 파괴된 성. 확정복구가 없는 조합이면 null. */
  recovery: Record<number, RecoveryComparison | null>;
  /** index = 복구 목표 성(15~22). 필요한 대체 장비 수와 메소. */
  restore: Record<number, { spareCount: number; meso: number } | null>;
};

export type GameMode = "mine" | "scratch";

export type GameItem = {
  key: string;
  /** 장비창 칸 이름(SLOT_POSITIONS 의 키). */
  equipSlot: string;
  /** 화면에 보이는 부위 이름(무기, 어깨장식 등). */
  slot: string;
  name: string;
  /** 처음부터 하기에서 아이콘을 그릴 때 쓴다. */
  setId: string | null;
  slotId: string | null;
  /** 내 장비 모드에서 넥슨이 준 아이콘 주소. */
  icon: string | null;
  level: number;
  /** 구매가이자 대체 장비 값. */
  price: number;
  /** 보유 중인 성. 장비가 없으면 null. */
  star: number | null;
  maxStarReached: number;
};

export type GameState = {
  mode: GameMode;
  /** 내 장비 모드에서 넥슨이 준 캐릭터 이름과 그림. 장비창 가운데에 보여 준다. */
  character: { name: string; image: string } | null;
  /** 시작 시점 자산(메소 + 장비 원가 가치). 손익 기준이다. */
  startAssets: number;
  meso: number;
  items: GameItem[];
  /** 지금 다루는 장비의 key. */
  selected: string;
  /** 파괴 직후 복구 방식을 고르는 중이면 그 장비와 터진 성. */
  destroyed: { key: string; star: number } | null;
  attempts: number;
  destroys: number;
  log: string[];
};

export type RecoveryChoice = "restore" | "twelve" | "giveup";

export const dataKeyOf = (item: Pick<GameItem, "level" | "price">) => `${item.level}-${item.price}`;

export const newGame = ({
  mode,
  meso,
  items,
  startAssets = meso,
  character = null,
}: {
  mode: GameMode;
  meso: number;
  items: GameItem[];
  startAssets?: number;
  character?: GameState["character"];
}): GameState => ({
  mode,
  character,
  startAssets,
  meso,
  items,
  selected: items[0]?.key ?? "",
  destroyed: null,
  attempts: 0,
  destroys: 0,
  log: [],
});

export const itemOf = (state: GameState, key: string) => state.items.find((item) => item.key === key);
export const selectedItem = (state: GameState) => itemOf(state, state.selected);

type DataFor = (item: GameItem) => GameData | undefined;

/** 메소 + 보유 장비들의 원가 가치. 데이터가 아직 없는 장비는 빼고 센다. */
export const assetsOf = (state: GameState, dataFor: DataFor) =>
  state.meso +
  state.items.reduce((sum, item) => {
    const data = dataFor(item);
    return sum + (item.star !== null && data ? data.values[item.star] : 0);
  }, 0);

/** 보유 장비들의 성 합. 캐릭터 스펙을 가늠하는 숫자다. */
export const totalStars = (state: GameState) =>
  state.items.reduce((sum, item) => sum + (item.star ?? 0), 0);

export const isOver = (state: GameState) =>
  state.destroyed === null &&
  state.items.every((item) => item.star === null) &&
  state.meso < Math.min(...state.items.map((item) => item.price));

export const attemptCostOf = (star: number, data: GameData, guard: boolean) =>
  data.costs[star] * (guard ? 1 + GUARD_EXTRA_COST_RATIO : 1);

/** 확정복구 총비용(필요 대체 장비 + 메소). 목표 성은 22성까지. 불가능하면 null. */
export const restoreCostOf = (destroyedAt: number, data: GameData) => {
  const restore = data.restore[Math.min(destroyedAt, RESTORE_MAX_STAR)];
  return restore ? restore.spareCount * data.spareCost + restore.meso : null;
};

const patch = (state: GameState, key: string, change: Partial<GameItem>): GameState => ({
  ...state,
  items: state.items.map((item) => (item.key === key ? { ...item, ...change } : item)),
});

const log = (state: GameState, line: string): GameState => ({
  ...state,
  log: [line, ...state.log].slice(0, LOG_LIMIT),
});

const idle = (state: GameState) => state.destroyed === null;

export const select = (state: GameState, key: string): GameState =>
  itemOf(state, key) && idle(state) ? { ...state, selected: key } : state;

export const buy = (state: GameState, data: GameData): GameState => {
  const item = selectedItem(state);
  if (!item || item.star !== null || !idle(state) || state.meso < item.price) return state;
  return log(
    { ...patch(state, item.key, { star: 0 }), meso: state.meso - item.price },
    `${item.slot}을(를) 샀어요. ★0`,
  );
};

export const sell = (state: GameState, data: GameData): GameState => {
  const item = selectedItem(state);
  if (!item || item.star === null || !idle(state)) return state;
  return log(
    { ...patch(state, item.key, { star: null }), meso: state.meso + data.values[item.star] },
    `${item.slot} ★${item.star}을(를) 원가 가치로 팔았어요.`,
  );
};

export const enhance = (
  state: GameState,
  data: GameData,
  guard: boolean,
  rng: () => number,
): GameState => {
  const item = selectedItem(state);
  if (!item || item.star === null || !idle(state)) return state;
  const { star } = item;
  if (star >= data.maxStar) return state;
  if (guard && !GUARD_STARS.includes(star)) return state;

  const cost = attemptCostOf(star, data, guard);
  if (state.meso < cost) return state;

  const row = data.table[star];
  // 파괴 방지: 파괴 확률은 유지 확률로 넘어간다.
  const destroy = guard ? 0 : row.destroy;
  const roll = rng();
  const paid = { ...state, meso: state.meso - cost, attempts: state.attempts + 1 };

  if (roll < row.success) {
    return log(
      patch(paid, item.key, { star: star + 1, maxStarReached: Math.max(item.maxStarReached, star + 1) }),
      `${item.slot} ★${star}→★${star + 1} 성공!`,
    );
  }
  if (roll >= 1 - destroy) {
    return log(
      {
        ...patch(paid, item.key, { star: null }),
        destroyed: { key: item.key, star },
        destroys: state.destroys + 1,
      },
      `${item.slot}이(가) ★${star}에서 파괴됐어요.`,
    );
  }
  return log(paid, `${item.slot} ★${star} 유지.`);
};

/** data 는 파괴된 장비의 것이다. */
export const recover = (state: GameState, data: GameData, choice: RecoveryChoice): GameState => {
  const { destroyed } = state;
  const item = destroyed ? itemOf(state, destroyed.key) : undefined;
  if (!destroyed || !item) return state;
  const done = { ...state, destroyed: null };

  if (choice === "giveup") return log(done, `${item.slot} 복구를 포기했어요.`);

  if (choice === "twelve") {
    if (state.meso < item.price) return state;
    return log(
      { ...patch(done, item.key, { star: 12 }), meso: state.meso - item.price },
      `${item.slot} 12성 복구: ★12로 돌아왔어요.`,
    );
  }

  const cost = restoreCostOf(destroyed.star, data);
  if (cost === null || state.meso < cost) return state;
  const target = Math.min(destroyed.star, RESTORE_MAX_STAR);
  return log(
    { ...patch(done, item.key, { star: target }), meso: state.meso - cost },
    `${item.slot} 확정복구: ★${target}로 돌아왔어요.`,
  );
};
