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
  | "eye"
  | "face"
  | "pocket";

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
  face: "얼굴장식",
  pocket: "포켓 아이템",
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
  { id: "pitch", name: "칠흑", level: 160, color: "#3b3b52", slots: ["face", "eye", "pendant", "belt", "pocket"] },
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

/**
 * 게임 장비창 배치. [열, 행]이고 7열 6행 격자에서 3~5열 1~4행은 캐릭터 자리다.
 * 넥슨 API의 item_equipment_slot 이름을 키로 쓴다. 보내 주신 장비창 화면을 보고 맞춘 값이라
 * 실제 게임과 칸이 다르면 여기만 고치면 된다. 표에 없는 부위는 빈 칸에 차례로 들어간다.
 */
export const SLOT_POSITIONS: Record<string, [number, number]> = {
  반지4: [1, 1],
  반지3: [1, 2],
  반지2: [1, 3],
  반지1: [1, 4],
  벨트: [1, 5],
  "포켓 아이템": [1, 6],
  얼굴장식: [2, 1],
  눈장식: [2, 2],
  귀고리: [2, 3],
  펜던트: [2, 4],
  펜던트2: [2, 5],
  엠블렘: [3, 5],
  무기: [4, 5],
  보조무기: [5, 5],
  모자: [6, 1],
  상의: [6, 2],
  하의: [6, 3],
  어깨장식: [6, 4],
  "기계 심장": [6, 5],
  망토: [7, 1],
  신발: [7, 2],
  장갑: [7, 3],
  뱃지: [7, 4],
  훈장: [7, 5],
};

/** 세트 부위를 장비창 칸 이름으로. 한벌옷은 상의 칸에 둔다. */
export const SLOT_TO_EQUIPMENT_SLOT: Record<SlotId, string> = {
  hat: "모자",
  outfit: "상의",
  gloves: "장갑",
  shoes: "신발",
  cape: "망토",
  shoulder: "어깨장식",
  weapon: "무기",
  ring: "반지1",
  pendant: "펜던트",
  belt: "벨트",
  earring: "귀고리",
  eye: "눈장식",
  face: "얼굴장식",
  pocket: "포켓 아이템",
};

/**
 * 세트 부위별 아이콘 파일. public/items/<세트 id>/<부위 id>.png 처럼 넣고 여기에 적으면 그 그림을 쓴다.
 * 비어 있는 부위는 부위 이름만 적은 빈 칸으로 보여 준다.
 * 칠흑 그림은 사용자가 보내 준 파일이다. 출처 URL은 TODO. 나머지 세트 그림도 받는 대로 넣는다.
 */
export const ITEM_IMAGES: Partial<Record<string, string>> = {
  "pitch/face": "/items/pitch/face.png",
  "pitch/eye": "/items/pitch/eye.webp",
  "pitch/pendant": "/items/pitch/pendant.png",
  "pitch/belt": "/items/pitch/belt.png",
  "pitch/pocket": "/items/pitch/pocket.webp",
};

export const imageOf = (setId: string, slot: string) => ITEM_IMAGES[`${setId}/${slot}`];
