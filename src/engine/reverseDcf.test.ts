import { describe, it, expect } from "vitest";
import { placeholder } from "./reverseDcf";

describe("reverseDcf", () => {
  it("placeholder returns true", () => {
    expect(placeholder()).toBe(true);
  });
});
