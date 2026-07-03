import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    const result = cn("class1", "class2");
    expect(result).toBe("class1 class2");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", true && "visible");
    expect(result).toBe("base visible");
  });

  it("removes conflicting tailwind classes", () => {
    const result = cn("px-4", "px-2");
    expect(result).toBe("px-2");
  });

  it("handles empty inputs", () => {
    const result = cn();
    expect(result).toBe("");
  });
});
