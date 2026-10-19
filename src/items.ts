/**
 * 게임과 계산표에서 고르는 아이템 세트.
 * 착용 레벨은 커뮤니티에서 알려진 값이고 공식 문서와 대조하지 못했다(TODO: 출처 확인).
 * 부위 구성은 세트마다 조금씩 다르지만 여기서는 단순화해 같은 종류끼리 묶었다.
 */
export type SlotId =
  | "hat"
  | "outfit"
  | "gloves"
  | "shoes"
  | "cape"
  | "shoulder"
  | "weapon"
  | "ring"
  | "pendant"
  | "belt"
  | "earring"
  | "eye";

export const SLOT_NAMES: Record<SlotId, string> = {
  hat: "모자",
  outfit: "한벌옷",
  gloves: "장갑",
  shoes: "신발",
  cape: "망토",
  shoulder: "어깨장식",
  weapon: "무기",
  ring: "반지",
  pendant: "펜던트",
  belt: "벨트",
  earring: "귀고리",
  eye: "눈장식",
};

const ARMOR_SLOTS: SlotId[] = ["weapon", "hat", "outfit", "gloves", "shoes", "cape", "shoulder"];
const ACCESSORY_SLOTS: SlotId[] = ["ring", "pendant", "belt", "earring", "eye"];

export type ItemSet = {
  id: string;
  name: string;
  /** 착용 레벨. 게임 데이터를 이 값으로 불러온다. */
  level: number;
  /** 아이콘 색(hex). */
  color: string;
  slots: SlotId[];
};

export const ITEM_SETS: ItemSet[] = [
  { id: "pappnir", name: "파프니르", level: 150, color: "#2f9e6b", slots: ARMOR_SLOTS },
  { id: "absolabs", name: "앱솔랩스", level: 160, color: "#d64545", slots: ARMOR_SLOTS },
  { id: "pitch", name: "칠흑", level: 160, color: "#3b3b52", slots: ACCESSORY_SLOTS },
  { id: "dawn", name: "여명", level: 160, color: "#e0a030", slots: ACCESSORY_SLOTS },
  { id: "arcane", name: "아케인셰이드", level: 200, color: "#7a4fd1", slots: ARMOR_SLOTS },
  { id: "eternal", name: "에테르넬", level: 250, color: "#2a8fd6", slots: ARMOR_SLOTS },
];

export const setById = (id: string) => ITEM_SETS.find((set) => set.id === id);

/** 계산표 같은 곳에서 레벨만 알 때 가장 가까운 세트 이름을 붙인다. 없으면 null. */
export const setNameOfLevel = (level: number) =>
  ITEM_SETS.find((set) => set.level === level)?.name ?? null;

/** 가격 기본값(메소). 시세를 받기 전까지 모든 장비에 같은 값을 쓴다. 시세 아님. */
export const DEFAULT_PRICE = 5e8;

/**
 * 세트별, 부위별 장비 구매가(메소). 비어 있는 칸은 DEFAULT_PRICE 를 쓴다.
 * TODO: 칠흑과 에테르넬 시세를 받으면 채운다. 예) eternal: { weapon: 120e8, hat: 40e8 }
 */
export const ITEM_PRICES: Record<string, Partial<Record<SlotId, number>>> = {
  pitch: {},
  eternal: {},
};

export const priceOf = (setId: string, slot: SlotId) => ITEM_PRICES[setId]?.[slot] ?? DEFAULT_PRICE;
