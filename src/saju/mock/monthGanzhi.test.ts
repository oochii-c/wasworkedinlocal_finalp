import { describe, it, expect } from "vitest";
import { getMonthInGanZhi } from "./monthGanzhi";

describe("getMonthInGanZhi", () => {
  it("is deterministic for the same year and month", () => {
    const first = getMonthInGanZhi(2026, 3);
    const second = getMonthInGanZhi(2026, 3);
    expect(first).toEqual(second);
  });

  it("throws for a month outside 1-12", () => {
    expect(() => getMonthInGanZhi(2026, 13)).toThrow();
  });
});
