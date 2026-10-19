import { NextResponse } from "next/server";
import { z } from "zod";

import { buildDiagnosisPrompt, buildReply, diagnoseItems, recommendSlots } from "~/diagnose";
import { getEquipment } from "~/nexon";
import { loadStarforceRules } from "~/rules";
import { isAdminTestName, sampleEquipment } from "~/testCase";

export const runtime = "nodejs";

const bodySchema = z.object({ characterName: z.string().trim().min(1).max(30) });

/**
 * 넥슨 오픈 API 키는 x-nxopen-api-key 헤더로만 받는다.
 * 이 요청 안에서만 쓰고 저장·로그하지 않는다.
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
    const rules = loadStarforceRules();
    const diagnoses = diagnoseItems(equipment, rules);

    return NextResponse.json({
      reply: buildReply(equipment, diagnoses),
      recommendations: recommendSlots(diagnoses),
      prompt: buildDiagnosisPrompt(equipment, diagnoses, rules),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "조회에 실패했어요." },
      { status: 502 },
    );
  }
}
