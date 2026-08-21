import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AiSummary } from "./AiSummary";

describe("AiSummary", () => {
  it("renders the provided summary text", () => {
    render(<AiSummary summary="테스트 총평 문장입니다." />);
    expect(screen.getByText("테스트 총평 문장입니다.")).toBeInTheDocument();
  });

  it("renders a citation line prefixed with 근거: when provided", () => {
    render(<AiSummary summary="테스트 총평 문장입니다." citation="세운 丙午 × 일간 庚金" />);
    expect(screen.getByText("근거: 세운 丙午 × 일간 庚金")).toBeInTheDocument();
  });

  it("renders no citation line when the prop is omitted", () => {
    render(<AiSummary summary="테스트 총평 문장입니다." />);
    expect(screen.queryByText(/^근거:/)).not.toBeInTheDocument();
  });
});
