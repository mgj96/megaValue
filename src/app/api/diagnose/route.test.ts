import { afterEach, describe, expect, it } from "vitest";

import { POST } from "./route";

const call = (characterName: string, headers: Record<string, string> = {}) =>
  POST(
    new Request("http://localhost/api/diagnose", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({ characterName }),
    }),
  );

describe("POST /api/diagnose 관리자 검수 명령", () => {
  afterEach(() => {
    delete process.env.ADMIN_TEST_COMMAND;
  });

  it("명령어가 맞으면 API 키 없이 표본 장비의 프롬프트를 돌려준다", async () => {
    process.env.ADMIN_TEST_COMMAND = "#검수-test";
    const response = await call("#검수-test");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.reply).toContain("검수용 캐릭터의 장비 5개");
    expect(data.prompt).toContain("17성→18성");
  });

  it("환경변수 값 앞뒤 공백은 무시한다", async () => {
    process.env.ADMIN_TEST_COMMAND = " #검수-test\n";
    const response = await call("#검수-test");

    expect(response.status).toBe(200);
  });

  it("명령어가 설정돼 있지 않으면 일반 요청처럼 키를 요구한다", async () => {
    const response = await call("#검수-test");

    expect(response.status).toBe(401);
  });

  it("명령어가 달라도 키가 없으면 401", async () => {
    process.env.ADMIN_TEST_COMMAND = "#검수-test";
    const response = await call("다른이름");

    expect(response.status).toBe(401);
  });
});
