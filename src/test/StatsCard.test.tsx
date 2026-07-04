import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatsCard from "@/components/StatsCard";

describe("StatsCard", () => {
  it("renders with title and value", () => {
    render(
      <StatsCard title="Ocorrências" value="42" variant="default" />
    );
    expect(screen.getByText("Ocorrências")).toBeDefined();
    expect(screen.getByText("42")).toBeDefined();
  });

  it("renders with change indicator when provided", () => {
    render(
      <StatsCard title="Teste" value="10" change="+5" variant="default" />
    );
    expect(screen.getByText("+5")).toBeDefined();
  });

  it("renders danger variant correctly", () => {
    render(
      <StatsCard title="Alertas" value="3" variant="danger" />
    );
    expect(screen.getByText("Alertas")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
  });
});
