import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DomainStars } from "./DomainStars";

describe("DomainStars", () => {
  it("renders all 6 domain labels", () => {
    render(
      <DomainStars scores={{ 총운: 3, 애정: 4, 재물: 2, 직업학업: 5, 건강: 3, 인간관계: 4 }} />
    );
    for (const label of ["총운", "애정", "재물", "직업학업", "건강", "인간관계"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders a one-line caption per domain, matching the domain's score tier", () => {
    render(
      <DomainStars scores={{ 총운: 3, 애정: 4, 재물: 2, 직업학업: 5, 건강: 3, 인간관계: 4 }} />
    );
    expect(screen.getByText("무난한 흐름")).toBeInTheDocument();
    expect(screen.getByText("상반기 인연")).toBeInTheDocument();
    expect(screen.getByText("지출 관리 필요")).toBeInTheDocument();
  });
});
