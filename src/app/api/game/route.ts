import { NextResponse } from "next/server";
import { z } from "zod";

import { buildGameData } from "~/gameData";
import { DEFAULT_PRICE } from "~/items";
import { getCharacterBasic, getEquipment } from "~/nexon";
import { loadStarforceRules } from "~/rules";
import { isAdminTestName, sampleEquipment } from "~/testCase";

export const runtime = "nodejs";

const querySchema = z.object({
  level: z.coerce.number().int().min(1).max(300),
  /** 구매가(메소). 없으면 기본값. */
  price: z.coerce.number().int().min(1).max(1e14).default(DEFAULT_PRICE),
});

/** 착용 레벨과 구매가별 게임 데이터. */
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const query = querySchema.safeParse(params);
  const data = query.success ? buildGameData(query.data.level, query.data.price) : null;
  if (!data) return NextResponse.json({ error: "지원하지 않는 레벨이에요." }, { status: 400 });
  return NextResponse.json(data);
}

const bodySchema = z.object({ characterName: z.string().trim().min(1).max(30) });

/**
 * 내 장비 목록. 넥슨 오픈 API 키는 x-nxopen-api-key 헤더로만 받고 저장·로그하지 않는다.
 */
export async function POST(request: Request) {
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "캐릭터 이름을 입력해 주세요." }, { status: 400 });
  }

  const isAdminTest = isAdminTestName(body.data.characterName);
  const apiKey = request.headers.get("x-nxopen-api-key")?.trim();
  if (!apiKey && !isAdminTest) {
    return NextResponse.json({ error: "넥슨 오픈 API 키를 입력해 주세요." }, { status: 401 });
  }

  try {
    const equipment = isAdminTest
      ? sampleEquipment
      : await getEquipment(apiKey!, body.data.characterName);
    const { maxStarOf } = loadStarforceRules();

    const items = equipment.items.flatMap((item) => {
      const maxStar = maxStarOf(item.level);
      if (item.level <= 0 || maxStar === null) return [];
      const star = Number.isFinite(item.starforce) ? item.starforce : 0;
      return [
        { slot: item.slot, name: item.name, icon: item.icon, level: item.level, star, maxStar },
      ];
    });

    // 캐릭터 그림은 장비창 가운데에 쓴다. 못 받아도 게임은 할 수 있으니 실패는 무시한다.
    const character = isAdminTest
      ? null
      : await getCharacterBasic(apiKey!, equipment.ocid).catch(() => null);

    return NextResponse.json({ characterClass: equipment.characterClass, character, items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "조회에 실패했어요." },
      { status: 502 },
    );
  }
}
