import { describe, it, expect } from "vitest";
import { getYearGanZhi, getMonthInGanZhi, getOhaengRelation, getElementRelation, ganZhiToHanja } from "./ganzhi";

describe("getYearGanZhi", () => {
  it("returns 병오 for 2026", () => {
    expect(getYearGanZhi(2026)).toEqual({ gan: "병", ji: "오" });
  });

  it("returns 갑자 for 1984", () => {
    expect(getYearGanZhi(1984)).toEqual({ gan: "갑", ji: "자" });
  });
});

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

describe("getOhaengRelation", () => {
  it("returns same for identical elements", () => {
    expect(getOhaengRelation("목", "목")).toBe("same");
  });

  it("returns generates when a generates b", () => {
    expect(getOhaengRelation("목", "화")).toBe("generates");
  });

  it("returns generated_by when b generates a", () => {
    expect(getOhaengRelation("화", "목")).toBe("generated_by");
  });

  it("returns controls when a controls b", () => {
    expect(getOhaengRelation("목", "토")).toBe("controls");
  });

  it("returns controlled_by when b controls a", () => {
    expect(getOhaengRelation("토", "목")).toBe("controlled_by");
  });
});

describe("getElementRelation", () => {
  it("derives the relation from each gan's element (금 controls 목)", () => {
    expect(getElementRelation("경", "을")).toBe("controls");
  });
});

describe("ganZhiToHanja", () => {
  it("converts 병오 to 丙午", () => {
    expect(ganZhiToHanja({ gan: "병", ji: "오" })).toBe("丙午");
  });
});
