import type {
  Itinerary, Stop, Route, Day, DayItem, Alt, Coords, Cost,
  JsonItinerary, JsonStop, JsonRoute, JsonDay, JsonDayItem, JsonAlt,
  JsonDuration, JsonCoords, JsonFlexOption,
} from "./types.js";
import { parseDuration, formatDuration } from "./durations.js";

const SCHEMA_URI = "https://raw.githubusercontent.com/ThatXliner/open-itin/main/open-itin.schema.json";
const VERSION = "0.2";

// ── Agent format → JSON Schema ───────────────────────────────

export function toJSON(it: Itinerary): JsonItinerary {
  return {
    $schema: SCHEMA_URI,
    version: VERSION,
    name: it.name,
    summary: it.summary,
    tags: it.tags,
    tz: it.tz,
    cur: it.cur,
    generated_by: it.generated_by,
    created_at: it.created_at,
    stops: it.stops.map(stopToJSON),
    routes: it.routes.length > 0 ? it.routes.map(routeToJSON) : undefined,
    days: it.days.map(dayToJSON),
  };
}

function stopToJSON(stop: Stop): JsonStop {
  const out: JsonStop = {
    id: stop.id,
    name: stop.name,
    goal: stop.goal,
  };
  if (stop.cat) out.cat = stop.cat;
  if (stop.addr) out.addr = stop.addr;
  if (stop.coords) out.coords = coordsToJSON(stop.coords);
  if (stop.place_id) out.place_id = stop.place_id;
  if (stop.tz) out.tz = stop.tz;
  if (stop.dur) out.dur = durToJSON(stop.dur);
  if (stop.cost) out.cost = stop.cost; // Cost shape is identical
  if (stop.dep) out.dep = stop.dep;
  if (stop.arr) out.arr = stop.arr;
  if (stop.url) out.url = stop.url;
  if (stop.note) out.note = stop.note;
  if (stop.alts) out.alts = stop.alts.map(altToJSON);
  return out;
}

function altToJSON(alt: Alt): JsonAlt {
  const out: JsonAlt = { name: alt.name, goal: alt.goal };
  if (alt.cat) out.cat = alt.cat;
  if (alt.addr) out.addr = alt.addr;
  if (alt.dur) out.dur = durToJSON(alt.dur);
  if (alt.note) out.note = alt.note;
  return out;
}

function routeToJSON(route: Route): JsonRoute {
  const out: JsonRoute = {
    id: route.id,
    from: route.from,
    to: route.to,
    mode: route.mode,
  };
  if (route.dur) out.dur = durToJSON(route.dur);
  if (route.dist !== undefined) out.dist = route.dist;
  if (route.dep) out.dep = route.dep;
  if (route.arr) out.arr = route.arr;
  if (route.cost) out.cost = route.cost;
  if (route.url) out.url = route.url;
  if (route.note) out.note = route.note;
  return out;
}

function dayToJSON(day: Day): JsonDay {
  const out: JsonDay = { date: day.date };
  if (day.tz) out.tz = day.tz;
  if (day.note) out.note = day.note;
  if (day.items) out.items = day.items.map(dayItemToJSON);
  return out;
}

function dayItemToJSON(item: DayItem): JsonDayItem {
  switch (item.type) {
    case "stop": return { type: "stop", ref: item.ref };
    case "route": return { type: "route", ref: item.ref };
    case "note": return { type: "note", txt: item.txt };
    case "flex":
      return {
        type: "flex",
        pick: item.pick > 1 ? item.pick : undefined,
        opts: item.opts.map(opt => {
          switch (opt.type) {
            case "stop": return { type: "stop", ref: opt.ref } as JsonFlexOption;
            case "route": return { type: "route", ref: opt.ref } as JsonFlexOption;
            case "note": return { type: "note", txt: opt.txt } as JsonFlexOption;
          }
        }),
      };
  }
}

function coordsToJSON(coords: Coords): JsonCoords {
  return { lat: coords.lat, lng: coords.lng, source: "manual" };
}

function durToJSON(dur: string): JsonDuration {
  const { min, max } = parseDuration(dur);
  return { min, max };
}

// ── JSON Schema → Agent format ───────────────────────────────

export function fromJSON(json: JsonItinerary): Itinerary {
  return {
    name: json.name,
    summary: json.summary,
    tags: json.tags,
    tz: json.tz,
    cur: json.cur,
    generated_by: json.generated_by,
    created_at: json.created_at,
    stops: json.stops.map(stopFromJSON),
    routes: (json.routes ?? []).map(routeFromJSON),
    days: json.days.map(dayFromJSON),
  };
}

function stopFromJSON(s: JsonStop): Stop {
  const out: Stop = { id: s.id, name: s.name, goal: s.goal };
  if (s.cat) out.cat = s.cat;
  if (s.addr) out.addr = s.addr;
  if (s.coords) out.coords = coordsFromJSON(s.coords);
  if (s.place_id) out.place_id = s.place_id;
  if (s.tz) out.tz = s.tz;
  if (s.dur) out.dur = durFromJSON(s.dur);
  if (s.cost) out.cost = s.cost;
  if (s.dep) out.dep = s.dep;
  if (s.arr) out.arr = s.arr;
  if (s.url) out.url = s.url;
  if (s.note) out.note = s.note;
  if (s.alts) out.alts = s.alts.map(altFromJSON);
  return out;
}

function altFromJSON(a: JsonAlt): Alt {
  const out: Alt = { name: a.name, goal: a.goal };
  if (a.cat) out.cat = a.cat;
  if (a.addr) out.addr = a.addr;
  if (a.dur) out.dur = durFromJSON(a.dur);
  if (a.note) out.note = a.note;
  return out;
}

function routeFromJSON(r: JsonRoute): Route {
  const out: Route = { id: r.id, from: r.from, to: r.to, mode: r.mode };
  if (r.dur) out.dur = durFromJSON(r.dur);
  if (r.dist !== undefined) out.dist = r.dist;
  if (r.dep) out.dep = r.dep;
  if (r.arr) out.arr = r.arr;
  if (r.cost) out.cost = r.cost;
  if (r.url) out.url = r.url;
  if (r.note) out.note = r.note;
  return out;
}

function dayFromJSON(d: JsonDay): Day {
  const out: Day = { date: d.date };
  if (d.tz) out.tz = d.tz;
  if (d.note) out.note = d.note;
  if (d.items) out.items = d.items.map(dayItemFromJSON);
  return out;
}

function dayItemFromJSON(item: JsonDayItem): DayItem {
  switch (item.type) {
    case "stop": return { type: "stop", ref: item.ref };
    case "route": return { type: "route", ref: item.ref };
    case "note": return { type: "note", txt: item.txt };
    case "flex":
      return {
        type: "flex",
        pick: item.pick ?? 1,
        opts: item.opts.map(opt => {
          switch (opt.type) {
            case "stop": return { type: "stop", ref: opt.ref };
            case "route": return { type: "route", ref: opt.ref };
            case "note": return { type: "note", txt: opt.txt };
          }
        }),
      };
  }
}

function coordsFromJSON(c: JsonCoords): Coords {
  return { lat: c.lat, lng: c.lng };
}

function durFromJSON(d: JsonDuration): string {
  return formatDuration(d.min ?? 1, d.max ?? d.min ?? 1);
}
