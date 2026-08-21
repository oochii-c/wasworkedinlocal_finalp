import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { YearNav } from "./YearNav";

describe("YearNav", () => {
  afterEach(() => cleanup());

  it("shows the year, hanja ganzhi, and overall star rating", () => {
    render(
      <YearNav
        year={2026}
        yearGanZhi={{ gan: "병", ji: "오" }}
        overallScore={4}
        canGoPrev={true}
        canGoNext={true}
      />
    );
    expect(screen.getByText("2026년 丙午")).toBeInTheDocument();
    expect(screen.getByLabelText("4점 / 5점")).toBeInTheDocument();
  });

  it("hides the previous-year link when canGoPrev is false", () => {
    render(
      <YearNav
        year={2026}
        yearGanZhi={{ gan: "병", ji: "오" }}
        overallScore={4}
        canGoPrev={false}
        canGoNext={true}
      />
    );
    expect(screen.queryByLabelText("이전 해")).not.toBeInTheDocument();
  });
});
