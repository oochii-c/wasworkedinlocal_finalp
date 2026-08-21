import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { YearFortuneDetail } from "./YearFortuneDetail";
import { sampleChart } from "@/saju/mock/sampleChart";
import { ganZhiToHanja } from "@/saju/ganzhi";
import { getMonthInGanZhi } from "@/saju/mock/monthGanzhi";

describe("YearFortuneDetail", () => {
  it("renders all five sections for a given chart and year", () => {
    render(<YearFortuneDetail chart={sampleChart} year={2026} summary="테스트 총평입니다." />);
    expect(screen.getByText("2026년 丙午")).toBeInTheDocument();
    expect(screen.getByLabelText("영역별 별점")).toBeInTheDocument();
    expect(screen.getByLabelText("월별 흐름")).toBeInTheDocument();
    expect(screen.getByLabelText("좋은/주의 시기")).toBeInTheDocument();
    expect(screen.getByText("테스트 총평입니다.")).toBeInTheDocument();
  });

  it("shows the correctly derived monthly ganzhi in the popup when clicked", async () => {
    const user = userEvent.setup();
    render(<YearFortuneDetail chart={sampleChart} year={2026} summary="테스트 총평입니다." />);
    await user.click(screen.getByLabelText("월별 간지 보기"));
    const popup = screen.getByRole("list");
    expect(popup).toHaveTextContent(`1월 ${ganZhiToHanja(getMonthInGanZhi(2026, 1))}`);
    expect(popup).toHaveTextContent(`12월 ${ganZhiToHanja(getMonthInGanZhi(2026, 12))}`);
  });
});
