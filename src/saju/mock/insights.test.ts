import { describe, it, expect } from "vitest";
import {
  getDomainCaption,
  getGoodMonths,
  getCautionMonths,
  formatMonthRanges,
} from "./insights";

describe("getDomainCaption", () => {
  it("returns the high-tier caption for a score of 4 or 5", () => {
    expect(getDomainCaption("총운", 4)).toBe("변화 속 성장");
    expect(getDomainCaption("총운", 5)).toBe("변화 속 성장");
  });

  it("returns the mid-tier caption for a score of 3", () => {
    expect(getDomainCaption("애정", 3)).toBe("잔잔한 흐름");
  });

  it("returns the low-tier caption for a score of 1 or 2", () => {
    expect(getDomainCaption("건강", 1)).toBe("휴식 필요");
    expect(getDomainCaption("건강", 2)).toBe("휴식 필요");
  });
});

describe("getGoodMonths / getCautionMonths", () => {
  it("picks months scoring 4 or above as good, 2 or below as caution", () => {
    const scores = [5, 4, 3, 2, 1, 3, 3, 3, 3, 3, 5, 4];
    expect(getGoodMonths(scores)).toEqual([1, 2, 11, 12]);
    expect(getCautionMonths(scores)).toEqual([4, 5]);
  });

  it("returns an empty array when nothing qualifies", () => {
    const scores = Array(12).fill(3);
    expect(getGoodMonths(scores)).toEqual([]);
    expect(getCautionMonths(scores)).toEqual([]);
  });
});

describe("formatMonthRanges", () => {
  it("joins a consecutive run with a tilde", () => {
    expect(formatMonthRanges([3, 4, 5])).toBe("3~5월");
  });

  it("separates non-consecutive months with a middle dot", () => {
    expect(formatMonthRanges([3, 4, 5, 11])).toBe("3~5월 · 11월");
  });

  it("renders a single month without a tilde", () => {
    expect(formatMonthRanges([7])).toBe("7월");
  });

  it("returns a placeholder for an empty list", () => {
    expect(formatMonthRanges([])).toBe("-");
  });
});
