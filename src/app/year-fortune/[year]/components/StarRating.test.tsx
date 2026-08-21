import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StarRating } from "./StarRating";

describe("StarRating", () => {
  it("renders 3 filled and 2 empty stars for a score of 3", () => {
    render(<StarRating score={3} />);
    expect(screen.getByLabelText("3점 / 5점")).toHaveTextContent("★★★☆☆");
  });

  it("clamps scores above 5 down to 5 stars", () => {
    render(<StarRating score={9} />);
    expect(screen.getByLabelText("5점 / 5점")).toHaveTextContent("★★★★★");
  });
});
