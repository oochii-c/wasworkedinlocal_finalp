import { describe, it, expect } from "vitest";
import {
  getDomainCaption,
  getMonthInterpretation,
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

describe("getMonthInterpretation", () => {
  it("explains a month that generates the day master as supportive", () => {
    expect(getMonthInterpretation("갑", "병")).toBe(
      "이 달의 기운이 일간에 힘을 보태줘서 하는 일이 순조롭게 풀립니다"
    );
  });

  it("explains a month with the same element as the day master", () => {
    expect(getMonthInterpretation("갑", "을")).toBe(
      "일간과 같은 기운이 겹쳐 자신감 있게 밀어붙이기 좋습니다"
    );
  });

  it("explains a month the day master controls", () => {
    expect(getMonthInterpretation("을", "경")).toBe(
      "일간이 이 달의 기운을 다스릴 수 있어 유리하게 활용할 수 있습니다"
    );
  });

  it("explains a month the day master generates (draining)", () => {
    expect(getMonthInterpretation("병", "갑")).toBe(
      "일간이 기운을 많이 내주는 달이라 체력과 감정 관리가 필요합니다"
    );
  });

  it("explains a month that controls the day master (pressure)", () => {
    expect(getMonthInterpretation("갑", "무")).toBe(
      "이 달의 기운이 강해 일간이 눌리기 쉬우니 무리하지 않는 게 좋습니다"
    );
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
