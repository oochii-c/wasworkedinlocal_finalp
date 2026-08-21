import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AiSummary } from "./AiSummary";

describe("AiSummary", () => {
  it("renders the provided summary text", () => {
    render(<AiSummary summary="테스트 총평 문장입니다." />);
    expect(screen.getByText("테스트 총평 문장입니다.")).toBeInTheDocument();
  });
});
