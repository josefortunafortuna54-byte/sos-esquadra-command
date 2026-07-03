import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const ThrowError = () => {
  throw new Error("Test error");
};

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Content")).toBeDefined();
  });

  it("catches errors and shows fallback", () => {
    const original = console.error;
    console.error = () => {};

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText("Erro inesperado")).toBeDefined();
    expect(screen.getByText("Test error")).toBeDefined();

    console.error = original;
  });

  it("uses custom fallback when provided", () => {
    const original = console.error;
    console.error = () => {};

    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom fallback")).toBeDefined();

    console.error = original;
  });
});
