import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { NavLink } from "@/components/NavLink";

describe("NavLink", () => {
  it("renders with label", () => {
    render(
      <BrowserRouter>
        <NavLink to="/test" label="Teste" icon={<span>I</span>} />
      </BrowserRouter>
    );
    expect(screen.getByText("Teste")).toBeDefined();
  });

  it("renders with custom icon", () => {
    render(
      <BrowserRouter>
        <NavLink to="/test" label="Link" icon={<span data-testid="custom-icon">*</span>} />
      </BrowserRouter>
    );
    expect(screen.getByTestId("custom-icon")).toBeDefined();
  });
});
