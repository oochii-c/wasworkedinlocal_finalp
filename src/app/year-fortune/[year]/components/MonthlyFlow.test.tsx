import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MonthlyFlow } from "./MonthlyFlow";

const monthlyGanZhi = Array.from({ length: 12 }, () => ({
  gan: "갑" as const,
  ji: "자" as const,
}));

describe("MonthlyFlow", () => {
  it("renders 12 month labels and hides the popup by default", () => {
    render(
      <MonthlyFlow
        monthlyScores={Array(12).fill(3)}
        monthlyGanZhi={monthlyGanZhi}
        dayMaster="병"
      />
    );
    expect(screen.getByText("1월")).toBeInTheDocument();
    expect(screen.getByText("12월")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("shows a legend explaining the scoring basis and bar colors", () => {
    render(
      <MonthlyFlow
        monthlyScores={Array(12).fill(3)}
        monthlyGanZhi={monthlyGanZhi}
        dayMaster="병"
      />
    );
    expect(screen.getByText("근거: 월운 간지 × 일간 상생상극 점수")).toBeInTheDocument();
    expect(screen.getByText("좋은 달")).toBeInTheDocument();
    expect(screen.getByText("주의 달")).toBeInTheDocument();
  });

  it("shows the 12-month ganzhi popup when the info button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MonthlyFlow
        monthlyScores={Array(12).fill(3)}
        monthlyGanZhi={monthlyGanZhi}
        dayMaster="병"
      />
    );
    await user.click(screen.getByLabelText("월별 간지 보기"));
    const popup = screen.getByRole("list");
    expect(popup).toHaveTextContent("1월 甲子");
    expect(popup).toHaveTextContent("12월 甲子");
  });

  it("shows a per-month interpretation based on that month's element relation to the day master", async () => {
    const user = userEvent.setup();
    // 갑(목)이 병(화)을 생하므로, 일간 병(화) 기준으로는 "일간에 힘을 보태는" 관계다.
    render(
      <MonthlyFlow
        monthlyScores={Array(12).fill(3)}
        monthlyGanZhi={monthlyGanZhi}
        dayMaster="병"
      />
    );
    await user.click(screen.getByLabelText("월별 간지 보기"));
    const popup = screen.getByRole("list");
    expect(popup).toHaveTextContent(
      "이 달의 기운이 일간에 힘을 보태줘서 하는 일이 순조롭게 풀립니다"
    );
  });
});
