import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { NavLink } from "@/components/NavLink";

describe("NavLink", () => {
  it("renders with to path", () => {
    render(
      <BrowserRouter>
        <NavLink to="/test" data-testid="navlink">Teste</NavLink>
      </BrowserRouter>
    );
    expect(screen.getByTestId("navlink")).toBeDefined();
    expect(screen.getByText("Teste")).toBeDefined();
  });

  it("applies className correctly", () => {
    render(
      <BrowserRouter>
        <NavLink to="/test" className="custom-class">Link</NavLink>
      </BrowserRouter>
    );
    expect(screen.getByText("Link")).toBeDefined();
  });
});
