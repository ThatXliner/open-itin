import { describe, it, expect } from "vitest";
import { parseISO8601, parseDuration, formatDuration, toISO8601 } from "../../src/durations.js";

describe("parseISO8601", () => {
  it("parses hours", () => {
    expect(parseISO8601("PT2H")).toBe(2);
    expect(parseISO8601("PT1H")).toBe(1);
  });

  it("parses minutes", () => {
    expect(parseISO8601("PT30M")).toBe(0.5);
    expect(parseISO8601("PT15M")).toBe(0.25);
    expect(parseISO8601("PT45M")).toBe(0.75);
  });

  it("parses hours and minutes", () => {
    expect(parseISO8601("PT1H30M")).toBe(1.5);
    expect(parseISO8601("PT2H15M")).toBe(2.25);
    expect(parseISO8601("PT1H45M")).toBe(1.75);
  });

  it("returns 0 for PT0H or PT0M", () => {
    expect(parseISO8601("PT0H")).toBe(0);
    expect(parseISO8601("PT0M")).toBe(0);
  });

  it("throws on invalid format", () => {
    expect(() => parseISO8601("2h")).toThrow();
    expect(() => parseISO8601("P2D")).toThrow();
    expect(() => parseISO8601("")).toThrow();
  });
});

describe("parseDuration", () => {
  it("parses single duration as min=max", () => {
    expect(parseDuration("PT2H")).toEqual({ min: 2, max: 2 });
  });

  it("parses range", () => {
    expect(parseDuration("PT1H30M PT2H30M")).toEqual({ min: 1.5, max: 2.5 });
  });
});

describe("toISO8601", () => {
  it("formats whole hours", () => {
    expect(toISO8601(2)).toBe("PT2H");
    expect(toISO8601(1)).toBe("PT1H");
  });

  it("formats minutes only", () => {
    expect(toISO8601(0.5)).toBe("PT30M");
    expect(toISO8601(0.25)).toBe("PT15M");
  });

  it("formats hours and minutes", () => {
    expect(toISO8601(1.5)).toBe("PT1H30M");
    expect(toISO8601(2.75)).toBe("PT2H45M");
  });

  it("throws on negative", () => {
    expect(() => toISO8601(-1)).toThrow();
  });
});

describe("formatDuration", () => {
  it("collapses when min equals max", () => {
    expect(formatDuration(2, 2)).toBe("PT2H");
  });

  it("emits range when different", () => {
    expect(formatDuration(1.5, 2.5)).toBe("PT1H30M PT2H30M");
  });
});
