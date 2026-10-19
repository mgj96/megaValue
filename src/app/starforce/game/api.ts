import type { GameData } from "~/game";

export type MyItem = {
  slot: string;
  name: string;
  /** 넥슨이 주는 아이템 아이콘 주소. 비어 있을 수 있다. */
  icon: string;
  level: number;
  star: number;
  maxStar: number;
};

const errorOf = async (response: Response, fallback: string) => {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? fallback;
};

export const fetchGameData = async (level: number): Promise<GameData> => {
  const response = await fetch(`/api/game?level=${level}`);
  if (!response.ok) throw new Error(await errorOf(response, "게임 데이터를 불러오지 못했어요."));
  return (await response.json()) as GameData;
};

export const fetchMyItems = async (characterName: string, apiKey: string): Promise<MyItem[]> => {
  const response = await fetch("/api/game", {
    method: "POST",
    headers: { "content-type": "application/json", "x-nxopen-api-key": apiKey.trim() },
    body: JSON.stringify({ characterName: characterName.trim() }),
  });
  if (!response.ok) throw new Error(await errorOf(response, "장비를 불러오지 못했어요."));
  return ((await response.json()) as { items: MyItem[] }).items;
};
