import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { YearFortuneDetail } from "./YearFortuneDetail";
import { sampleChart } from "@/saju/mock/sampleChart";

describe("YearFortuneDetail", () => {
  it("renders all five sections for a given chart and year", () => {
    render(<YearFortuneDetail chart={sampleChart} year={2026} summary="테스트 총평입니다." />);
    expect(screen.getByText("2026년 丙午")).toBeInTheDocument();
    expect(screen.getByLabelText("영역별 별점")).toBeInTheDocument();
    expect(screen.getByLabelText("월별 흐름")).toBeInTheDocument();
    expect(screen.getByLabelText("좋은/주의 시기")).toBeInTheDocument();
    expect(screen.getByText("테스트 총평입니다.")).toBeInTheDocument();
  });
});
