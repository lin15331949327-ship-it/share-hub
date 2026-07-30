import { describe, it, expect } from "vitest";
import { hash, compare } from "../hash";

describe("hash", () => {
  it("produces salt:hash format", async () => {
    const h = await hash("password123");
    expect(h).toMatch(/^[a-f0-9-]{36}:[a-f0-9]{64}$/);
  });
});

describe("compare", () => {
  it("returns true for matching password", async () => {
    const h = await hash("mypassword");
    expect(await compare("mypassword", h)).toBe(true);
  });

  it("returns false for wrong password", async () => {
    const h = await hash("correct");
    expect(await compare("wrong", h)).toBe(false);
  });

  it("handles malformed stored hash gracefully", async () => {
    expect(await compare("anything", "badhash")).toBe(false);
  });
});
