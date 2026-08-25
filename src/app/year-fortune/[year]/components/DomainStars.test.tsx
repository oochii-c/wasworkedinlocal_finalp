import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DomainStars } from "./DomainStars";
import { getDomainInterpretation } from "@/saju/mock/insights";
import { sampleChart } from "@/saju/mock/sampleChart";

const scores = { 총운: 3, 애정: 4, 재물: 2, 직업학업: 5, 건강: 3, 인간관계: 4 };
const year = 2026;

describe("DomainStars", () => {
  it("renders all 6 domain labels", () => {
    render(<DomainStars scores={scores} chart={sampleChart} year={year} />);
    for (const label of ["총운", "애정", "재물", "직업학업", "건강", "인간관계"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders a one-line caption per domain, matching the domain's score tier", () => {
    render(<DomainStars scores={scores} chart={sampleChart} year={year} />);
    expect(screen.getByText("무난한 흐름")).toBeInTheDocument();
    expect(screen.getByText("상반기 인연")).toBeInTheDocument();
    expect(screen.getByText("지출 관리 필요")).toBeInTheDocument();
  });

  it("hides every domain's AI explanation popup by default", () => {
    render(<DomainStars scores={scores} chart={sampleChart} year={year} />);
    expect(
      screen.queryByText(getDomainInterpretation("재물", sampleChart, year))
    ).not.toBeInTheDocument();
  });

  it("shows only that domain's AI explanation when its info button is clicked", async () => {
    const user = userEvent.setup();
    render(<DomainStars scores={scores} chart={sampleChart} year={year} />);
    await user.click(screen.getByLabelText("재물 설명 보기"));
    expect(
      screen.getByText(getDomainInterpretation("재물", sampleChart, year))
    ).toBeInTheDocument();
    expect(
      screen.queryByText(getDomainInterpretation("애정", sampleChart, year))
    ).not.toBeInTheDocument();
  });

  it("toggles a domain's AI explanation off when its info button is clicked again", async () => {
    const user = userEvent.setup();
    render(<DomainStars scores={scores} chart={sampleChart} year={year} />);
    const button = screen.getByLabelText("재물 설명 보기");
    await user.click(button);
    await user.click(button);
    expect(
      screen.queryByText(getDomainInterpretation("재물", sampleChart, year))
    ).not.toBeInTheDocument();
  });
});
