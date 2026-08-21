import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GoodBadMonths } from "./GoodBadMonths";

describe("GoodBadMonths", () => {
  it("picks the highest-scoring month as the recommended month", () => {
    const scores = [1, 2, 3, 5, 3, 2, 1, 2, 3, 2, 1, 2];
    render(<GoodBadMonths monthlyScores={scores} />);
    expect(screen.getByText("4월")).toBeInTheDocument();
  });

  it("shows both the 추천 and 주의 badges", () => {
    const scores = [1, 2, 3, 5, 3, 2, 1, 2, 3, 2, 1, 2];
    render(<GoodBadMonths monthlyScores={scores} />);
    expect(screen.getByText("추천")).toBeInTheDocument();
    expect(screen.getByText("주의")).toBeInTheDocument();
  });
});
