import { describe, it, expect } from "vitest";
import { computeDomainScores, computeOverallScore, computeMonthlyScores, DOMAINS } from "./scoring";
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

describe("computeDomainScores", () => {
  it("returns a score between 1 and 5 for every domain", () => {
    const scores = computeDomainScores(testChart, 2026);
    for (const domain of DOMAINS) {
      expect(scores[domain]).toBeGreaterThanOrEqual(1);
      expect(scores[domain]).toBeLessThanOrEqual(5);
    }
  });

  it("is deterministic for the same chart and year", () => {
    const first = computeDomainScores(testChart, 2026);
    const second = computeDomainScores(testChart, 2026);
    expect(first).toEqual(second);
  });
});

describe("computeOverallScore", () => {
  it("averages and rounds the domain scores, clamped to 1-5", () => {
    expect(
      computeOverallScore({ 총운: 5, 애정: 5, 재물: 5, 직업학업: 5, 건강: 5, 인간관계: 5 })
    ).toBe(5);
    expect(
      computeOverallScore({ 총운: 1, 애정: 1, 재물: 1, 직업학업: 1, 건강: 1, 인간관계: 1 })
    ).toBe(1);
  });
});

describe("computeMonthlyScores", () => {
  it("returns 12 scores between 1 and 5", () => {
    const scores = computeMonthlyScores(testChart, 2026);
    expect(scores).toHaveLength(12);
    for (const score of scores) {
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(5);
    }
  });
});
