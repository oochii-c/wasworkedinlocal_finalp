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
      <MonthlyFlow monthlyScores={Array(12).fill(3)} monthlyGanZhi={monthlyGanZhi} />
    );
    expect(screen.getByText("1월")).toBeInTheDocument();
    expect(screen.getByText("12월")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("shows the 12-month ganzhi popup when the info button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MonthlyFlow monthlyScores={Array(12).fill(3)} monthlyGanZhi={monthlyGanZhi} />
    );
    await user.click(screen.getByLabelText("월별 간지 보기"));
    const popup = screen.getByRole("list");
    expect(popup).toHaveTextContent("1월 甲子");
    expect(popup).toHaveTextContent("12월 甲子");
  });
});
