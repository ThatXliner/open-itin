import { describe, it, expect } from "vitest";
import { countTokens, compareStrings } from "../../src/tokens.js";

describe("token counting", () => {
  it("counts tokens in a simple string", () => {
    const n = countTokens("hello world");
    expect(n).toBeGreaterThan(0);
  });

  it("JSON is consistently larger than agent format", () => {
    const json = JSON.stringify({
      $schema: "https://example.com/schema.json",
      version: "0.2",
      name: "Test Trip",
      stops: [{ id: "s1", name: "SF", goal: "Start" }],
      days: [{ date: "2026-06-15", items: [{ type: "stop", ref: "s1" }] }],
    }, null, 2);

    const agent = `trip: Test Trip

stop s1
  SF
  goal Start

day 2026-06-15
  > stop s1
`;

    const c = compareStrings(json, agent);
    expect(c.savings).toBeGreaterThan(0);
    expect(c.savingsPct).toBeGreaterThan(10);
  });
});
