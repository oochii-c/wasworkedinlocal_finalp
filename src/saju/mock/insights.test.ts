import { describe, it, expect } from "vitest";
import {
  getDomainCaption,
  getDomainInterpretation,
  getMonthInterpretation,
  getGoodMonths,
  getCautionMonths,
  formatMonthRanges,
} from "./insights";
import { SajuExtended } from "../types";

const testChart: SajuExtended = {
  birthDate: "1998-04-12",
  calendarType: "solar",
  gender: "F",
  pillars: {
    year: { gan: "무", ji: "인" },
    month: { gan: "을", ji: "묘" },
    day: { gan: "경", ji: "진" },
    hour: { gan: "병", ji: "술" },
  },
  dayMaster: "경",
  ohaeng: { 목: 2, 화: 1, 토: 2, 금: 2, 수: 1 },
};

describe("getDomainInterpretation", () => {
  // 2026년 세운(丙午)의 오행은 화. 애정 영역의 오행도 화이므로 관계는 "same".
  it("explains a domain whose element matches this year's element as reinforcing", () => {
    expect(getDomainInterpretation("애정", testChart, 2026)).toBe(
      "올해 세운의 기운이 애정 영역에 그대로 겹쳐 자신감 있게 밀어붙이기 좋은 해입니다."
    );
  });

  // 화가 금을 극하므로(재물의 오행은 금), 관계는 "controls".
  it("explains a domain this year's element controls as a strain", () => {
    expect(getDomainInterpretation("재물", testChart, 2026)).toBe(
      "올해 세운의 기운이 강해 재물 영역에 부담이 실리기 쉬우니 무리하지 않는 게 좋습니다."
    );
  });

  it("uses the day master's element as the target for 총운", () => {
    // 일간 경(금)을 화가 극하므로 관계는 "controls".
    expect(getDomainInterpretation("총운", testChart, 2026)).toBe(
      "올해 세운의 기운이 강해 총운에 부담이 실리기 쉬우니 무리하지 않는 게 좋습니다."
    );
  });

  it("notes when the chart's ohaeng for the target element is abundant (3+)", () => {
    const richChart = { ...testChart, ohaeng: { ...testChart.ohaeng, 화: 3 } };
    expect(getDomainInterpretation("애정", richChart, 2026)).toBe(
      "올해 세운의 기운이 애정 영역에 그대로 겹쳐 자신감 있게 밀어붙이기 좋은 해입니다." +
        " 사주 원국에 관련 오행이 풍부해 그 효과가 한층 강하게 작용합니다."
    );
  });

  it("notes when the chart's ohaeng for the target element is absent (0)", () => {
    const emptyChart = { ...testChart, ohaeng: { ...testChart.ohaeng, 화: 0 } };
    expect(getDomainInterpretation("애정", emptyChart, 2026)).toBe(
      "올해 세운의 기운이 애정 영역에 그대로 겹쳐 자신감 있게 밀어붙이기 좋은 해입니다." +
        " 다만 사주 원국에 해당 오행이 없어 그 영향력은 다소 약해집니다."
    );
  });
});

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
