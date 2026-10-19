import { cn, cx } from "./utils";

describe("cx", () => {
  it("합치되 충돌하는 Tailwind 클래스는 뒤의 것이 이긴다", () => {
    expect(cx("p-2", false, "text-sm", "p-4")).toBe("text-sm p-4");
  });

  it("cn 은 cx 와 같다", () => {
    expect(cn).toBe(cx);
  });
});
