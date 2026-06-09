import { describe, it, expect } from "vitest";
import { parse, format } from "../../src/kdl.js";

describe("KDL roundtrip", () => {
  it("parse → format → parse produces equivalent AST", () => {
    const input = `itinerary "Test Trip" {
  summary "A good one"
  tz "America/Los_Angeles"
  cur "USD"
  tags "road-trip, coastal"
  stop "sf" {
    name "San Francisco"
    goal "Start the trip"
    cat "other"
    addr "San Francisco, CA 94102"
    coord 37.7749 -122.4194
    alt {
      name "Alt Place"
      goal "Alt goal"
      cat "nature"
    }
  }
  stop "la" {
    name "Los Angeles"
    goal "End the trip"
    dur min=2 max=2
  }
  route "sf-to-la" {
    from "sf"
    to "la"
    mode "drive"
    dur min=2 max=2
    dist 382
    note "Take I-5 S"
  }
  day date="2026-06-15" {
    note "SF to LA"
    item type="stop" ref="sf"
    item type="route" ref="sf-to-la"
    item type="stop" ref="la"
    flex pick=1 {
      option type="note" txt="Option A"
      option type="note" txt="Option B"
    }
  }
}`;

    const parsed = parse(input);
    const formatted = format(parsed);
    const reparsed = parse(formatted);

    expect(reparsed.name).toBe(parsed.name);
    expect(reparsed.summary).toBe(parsed.summary);
    expect(reparsed.tz).toBe(parsed.tz);
    expect(reparsed.cur).toBe(parsed.cur);
    expect(reparsed.tags).toEqual(parsed.tags);
    expect(reparsed.stops.length).toBe(parsed.stops.length);
    expect(reparsed.routes.length).toBe(parsed.routes.length);
    expect(reparsed.days.length).toBe(parsed.days.length);

    const s1 = reparsed.stops[0]!;
    const s1o = parsed.stops[0]!;
    expect(s1.id).toBe(s1o.id);
    expect(s1.name).toBe(s1o.name);
    expect(s1.goal).toBe(s1o.goal);
    expect(s1.cat).toBe(s1o.cat);
    expect(s1.addr).toBe(s1o.addr);
    expect(s1.coords).toEqual(s1o.coords);
    expect(s1.alts).toHaveLength(1);

    const d1 = reparsed.days[0]!;
    const d1o = parsed.days[0]!;
    expect(d1.items).toEqual(d1o.items);
  });
});
