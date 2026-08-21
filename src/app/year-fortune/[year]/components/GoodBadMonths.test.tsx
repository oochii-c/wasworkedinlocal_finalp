import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GoodBadMonths } from "./GoodBadMonths";

describe("GoodBadMonths", () => {
  it("shows the good-month range and its caption", () => {
    const scores = [1, 2, 3, 5, 3, 2, 1, 2, 3, 2, 1, 2];
    render(<GoodBadMonths monthlyScores={scores} />);
    expect(screen.getByText("좋은 시기", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("4월")).toBeInTheDocument();
    expect(screen.getByText("재물·직업 피크. 큰 결정하기 좋음")).toBeInTheDocument();
  });

  it("shows the caution-month range and its caption", () => {
    const scores = [1, 2, 3, 5, 3, 2, 1, 2, 3, 2, 1, 2];
    render(<GoodBadMonths monthlyScores={scores} />);
    expect(screen.getByText("주의 시기", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("1~2월 · 6~8월 · 10~12월")).toBeInTheDocument();
    expect(screen.getByText("충돌·지출 조심. 중요 계약 보류 권장")).toBeInTheDocument();
  });
});
