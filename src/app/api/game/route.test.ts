import { afterEach, describe, expect, it } from "vitest";

import { GET, POST } from "./route";

const get = (query: string) => GET(new Request(`http://localhost/api/game${query}`));
const post = (characterName: string, headers: Record<string, string> = {}) =>
  POST(
    new Request("http://localhost/api/game", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({ characterName }),
    }),
  );

describe("GET /api/game", () => {
  it("착용 레벨의 게임 데이터를 돌려준다", async () => {
    const response = await get("?level=200");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.maxStar).toBe(30);
    expect(data.values).toHaveLength(31);
    expect(data.restore["22"]).toEqual({ spareCount: 4, meso: 24168000000 });
  });

  it("구매가를 주면 그 값으로 가치를 계산한다", async () => {
    const base = await (await get("?level=200")).json();
    const pricey = await (await get("?level=200&price=1000000000")).json();

    expect(base.spareCost).toBe(500000000);
    expect(pricey.spareCost).toBe(1000000000);
    expect(pricey.values[10]).toBeGreaterThan(base.values[10]);
  });

  it("레벨이 없거나 이상하면 400", async () => {
    expect((await get("")).status).toBe(400);
    expect((await get("?level=abc")).status).toBe(400);
    expect((await get("?level=0")).status).toBe(400);
  });
});

describe("POST /api/game", () => {
  afterEach(() => {
    delete process.env.ADMIN_TEST_COMMAND;
  });

  it("키가 없으면 401", async () => {
    expect((await post("누군가")).status).toBe(401);
  });

  it("관리자 검수 명령이면 표본 장비 중 스타포스 가능한 것만 돌려준다", async () => {
    process.env.ADMIN_TEST_COMMAND = "zz9";
    const response = await post("zz9");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items.map((i: { slot: string }) => i.slot)).toEqual(["무기", "모자", "장갑", "신발"]);
    expect(data.items[0]).toMatchObject({ level: 200, star: 17, maxStar: 30 });
  });
});
