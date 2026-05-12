import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { toJSON, fromJSON } from "../../src/convert.js";
import { parse, format } from "../../src/kdl.js";
import type { JsonItinerary } from "../../src/types.js";

const examplesDir = resolve(import.meta.dirname, "../../../examples");

describe("converter roundtrip with real examples", () => {
  it("sf-to-la.json: JSON → KDL → JSON preserves data", () => {
    const jsonPath = resolve(examplesDir, "sf-to-la.json");
    const original: JsonItinerary = JSON.parse(readFileSync(jsonPath, "utf-8"));

    const it = fromJSON(original);
    const kdlText = format(it);
    const reparsed = parse(kdlText);
    const roundtripped = toJSON(reparsed);

    expect(roundtripped.name).toBe(original.name);
    expect(roundtripped.summary).toBe(original.summary);
    expect(roundtripped.tz).toBe(original.tz);
    expect(roundtripped.cur).toBe(original.cur);
    expect(roundtripped.tags).toEqual(original.tags);
    expect(roundtripped.generated_by).toBe(original.generated_by);
    expect(roundtripped.stops.length).toBe(original.stops.length);

    for (let i = 0; i < original.stops.length; i++) {
      const a = roundtripped.stops[i]!;
      const b = original.stops[i]!;
      expect(a.id).toBe(b.id);
      expect(a.name).toBe(b.name);
      expect(a.goal).toBe(b.goal);
      if (b.dur) expect(Math.abs((a.dur?.min ?? 0) - (b.dur?.min ?? 0))).toBeLessThan(0.02);
    }

    expect(roundtripped.routes!.length).toBe(original.routes!.length);
    expect(roundtripped.days.length).toBe(original.days.length);
    for (let i = 0; i < original.days.length; i++) {
      expect(roundtripped.days[i]!.date).toBe(original.days[i]!.date);
      expect(roundtripped.days[i]!.items?.length).toBe(original.days[i]!.items?.length);
    }
  });

  it("tokyo-weekend.json: JSON → KDL → JSON preserves data", () => {
    const jsonPath = resolve(examplesDir, "tokyo-weekend.json");
    const original: JsonItinerary = JSON.parse(readFileSync(jsonPath, "utf-8"));

    const it = fromJSON(original);
    const kdlText = format(it);
    const reparsed = parse(kdlText);
    const roundtripped = toJSON(reparsed);

    expect(roundtripped.name).toBe(original.name);
    expect(roundtripped.stops.length).toBe(original.stops.length);
    expect(roundtripped.routes!.length).toBe(original.routes!.length);
    expect(roundtripped.days.length).toBe(original.days.length);
  });
});
