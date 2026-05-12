import { describe, it, expect } from "vitest";
import { parse } from "../../src/kdl.js";

describe("KDL parser", () => {
  it("parses minimal itinerary", () => {
    const input = `itinerary "Test Trip" {
  stop "s1" {
    name "San Francisco"
    goal "Start here"
  }
  day date="2026-06-15" {
    item type="stop" ref="s1"
  }
}`;

    const it = parse(input);
    expect(it.name).toBe("Test Trip");
    expect(it.stops).toHaveLength(1);
    expect(it.stops[0]!.name).toBe("San Francisco");
    expect(it.stops[0]!.goal).toBe("Start here");
    expect(it.days).toHaveLength(1);
    expect(it.days[0]!.date).toBe("2026-06-15");
    expect(it.days[0]!.items![0]!).toEqual({ type: "stop", ref: "s1" });
  });

  it("parses full trip metadata", () => {
    const input = `itinerary "Full Trip" {
  summary "A great trip"
  tz "America/New_York"
  cur "USD"
  tags "beach, relax"
  generated_by "test-agent"
  created_at "2026-05-11T10:00:00Z"
  stop "s1" {
    name "Place"
    goal "Visit"
  }
}`;

    const it = parse(input);
    expect(it.summary).toBe("A great trip");
    expect(it.tz).toBe("America/New_York");
    expect(it.cur).toBe("USD");
    expect(it.tags).toEqual(["beach", "relax"]);
    expect(it.generated_by).toBe("test-agent");
    expect(it.created_at).toBe("2026-05-11T10:00:00Z");
  });

  it("parses stop with all properties", () => {
    const input = `itinerary "Test" {
  stop "full" {
    name "The Full Stop"
    goal "Do everything"
    cat "attraction"
    addr "123 Main St, City, CA 94102"
    coord 37.7749 -122.4194
    place_id "gplaces:ChIJ123"
    tz "America/Los_Angeles"
    dur min=2 max=2
    cost amt=25 cur="USD"
    dep "14:00"
    arr "16:00"
    url "https://example.com"
    note "Get there early"
  }
}`;

    const it = parse(input);
    const s = it.stops[0]!;
    expect(s.name).toBe("The Full Stop");
    expect(s.goal).toBe("Do everything");
    expect(s.cat).toBe("attraction");
    expect(s.addr).toBe("123 Main St, City, CA 94102");
    expect(s.coords).toEqual({ lat: 37.7749, lng: -122.4194 });
    expect(s.place_id).toBe("gplaces:ChIJ123");
    expect(s.tz).toBe("America/Los_Angeles");
    expect(s.dur).toBe("PT2H");
    expect(s.cost).toEqual({ amt: 25, cur: "USD" });
    expect(s.dep).toBe("14:00");
    expect(s.arr).toBe("16:00");
    expect(s.url).toBe("https://example.com");
    expect(s.note).toBe("Get there early");
  });

  it("parses fractional durations", () => {
    const input = `itinerary "Test" {
  stop "s1" {
    name "Place"
    goal "Visit"
    dur min=1.75 max=2.5
  }
}`;
    const it = parse(input);
    expect(it.stops[0]!.dur).toBe("PT1H45M PT2H30M");
  });

  it("parses stop with alternatives", () => {
    const input = `itinerary "Test" {
  stop "main" {
    name "Main Place"
    goal "Main goal"
    alt {
      name "Alt Place"
      goal "Alt goal"
      cat "nature"
      dur min=1 max=1
      note "Alt note"
    }
  }
}`;

    const it = parse(input);
    const s = it.stops[0]!;
    expect(s.alts).toHaveLength(1);
    expect(s.alts![0]!.name).toBe("Alt Place");
    expect(s.alts![0]!.goal).toBe("Alt goal");
    expect(s.alts![0]!.cat).toBe("nature");
    expect(s.alts![0]!.dur).toBe("PT1H");
    expect(s.alts![0]!.note).toBe("Alt note");
  });

  it("parses route", () => {
    const input = `itinerary "Test" {
  route "r1" {
    from "a"
    to "b"
    mode "drive"
    dur min=2 max=2
    dist 180
    note "Scenic drive"
  }
}`;

    const it = parse(input);
    const r = it.routes[0]!;
    expect(r.id).toBe("r1");
    expect(r.from).toBe("a");
    expect(r.to).toBe("b");
    expect(r.mode).toBe("drive");
    expect(r.dur).toBe("PT2H");
    expect(r.dist).toBe(180);
    expect(r.note).toBe("Scenic drive");
  });

  it("parses day with all item types including flex", () => {
    const input = `itinerary "Test" {
  day date="2026-06-15" {
    note "A great day"
    item type="stop" ref="s1"
    item type="route" ref="r1"
    item type="note" txt="Lunch break"
    flex pick=2 {
      option type="stop" ref="s2"
      option type="note" txt="Option B"
    }
  }
}`;

    const it = parse(input);
    const d = it.days[0]!;
    expect(d.note).toBe("A great day");
    expect(d.items).toHaveLength(4);
    expect(d.items![0]!).toEqual({ type: "stop", ref: "s1" });
    expect(d.items![1]!).toEqual({ type: "route", ref: "r1" });
    expect(d.items![2]!).toEqual({ type: "note", txt: "Lunch break" });
    const flex = d.items![3]!;
    expect(flex.type).toBe("flex");
    if (flex.type === "flex") {
      expect(flex.pick).toBe(2);
      expect(flex.opts).toHaveLength(2);
    }
  });

  it("parses multi-word names with special chars", () => {
    const input = `itinerary "Test" {
  stop "s1" {
    name "Monterey Bay Aquarium — the best"
    goal "See the sea otters & kelp forest"
    note "Book online to skip the line"
  }
}`;

    const it = parse(input);
    const s = it.stops[0]!;
    expect(s.name).toBe("Monterey Bay Aquarium — the best");
    expect(s.goal).toBe("See the sea otters & kelp forest");
    expect(s.note).toBe("Book online to skip the line");
  });

  it("throws on missing itinerary name", () => {
    expect(() => parse(`itinerary "" { }`)).not.toThrow();
  });

  it("throws on missing stop goal", () => {
    const input = `itinerary "Test" {
  stop "s1" {
    name "Place"
  }
}`;
    expect(() => parse(input)).toThrow("goal");
  });

  it("throws on missing day date", () => {
    const input = `itinerary "Test" {
  day {
    note "No date"
  }
}`;
    expect(() => parse(input)).toThrow("date");
  });

  it("throws on unknown day item type", () => {
    const input = `itinerary "Test" {
  day date="2026-06-15" {
    item type="unknown" ref="x"
  }
}`;
    expect(() => parse(input)).toThrow("Unknown day item type");
  });
});
