import { parse as parseKDL, format as formatKDL } from "kdljs";
import type {
  Itinerary, Stop, Route, Day, DayItem, Alt, Coords, Cost,
  Category, Mode,
} from "./types.js";

// ── Parse: KDL string → Itinerary ─────────────────────────

interface KNode {
  name: string;
  properties: Record<string, string | number | boolean | null>;
  values: (string | number | boolean | null)[];
  children: KNode[];
}

export function parse(input: string): Itinerary {
  const doc = parseKDL(input);

  if (doc.errors.length > 0) {
    const e = doc.errors[0]!;
    const line = e.token?.startLine ?? 1;
    throw new ParseError(line, e.message || "KDL parse error");
  }

  if (!doc.output || doc.output.length === 0) {
    throw new ParseError(1, "Empty document");
  }

  const root = doc.output[0]! as unknown as KNode;
  if (root.name !== "itinerary") {
    throw new ParseError(1, `Expected root node "itinerary", got "${root.name}"`);
  }

  return parseItinerary(root);
}

function parseItinerary(node: KNode): Itinerary {
  const name = strVal(node, 0, "name");
  const it: Itinerary = { name, stops: [], routes: [], days: [] };

  for (const child of node.children) {
    switch (child.name) {
      case "summary":       it.summary = strVal(child, 0, "summary"); break;
      case "tz":            it.tz = strVal(child, 0, "tz"); break;
      case "cur":           it.cur = strVal(child, 0, "cur"); break;
      case "tags":          it.tags = strVal(child, 0, "tags").split(",").map(t => t.trim()).filter(Boolean); break;
      case "generated_by":  it.generated_by = strVal(child, 0, "generated_by"); break;
      case "created_at":    it.created_at = strVal(child, 0, "created_at"); break;
      case "stop":          it.stops.push(parseStop(child)); break;
      case "route":         it.routes.push(parseRoute(child)); break;
      case "day":           it.days.push(parseDay(child)); break;
    }
  }

  return it;
}

function parseStop(node: KNode): Stop {
  const id = strVal(node, 0, "id");
  const stop: Stop = { id, name: "", goal: "" };

  for (const child of node.children) {
    switch (child.name) {
      case "name":       stop.name = strVal(child, 0, "name"); break;
      case "goal":       stop.goal = strVal(child, 0, "goal"); break;
      case "cat":        stop.cat = strVal(child, 0, "cat") as Category; break;
      case "addr":       stop.addr = strVal(child, 0, "addr"); break;
      case "coord":      stop.coords = parseCoords(child); break;
      case "place_id":   stop.place_id = strVal(child, 0, "place_id"); break;
      case "tz":         stop.tz = strVal(child, 0, "tz"); break;
      case "dur":        stop.dur = parseDurStr(child); break;
      case "cost":       stop.cost = parseCost(child); break;
      case "dep":        stop.dep = strVal(child, 0, "dep"); break;
      case "arr":        stop.arr = strVal(child, 0, "arr"); break;
      case "url":        stop.url = strVal(child, 0, "url"); break;
      case "note":       stop.note = strVal(child, 0, "note"); break;
      case "alt":        (stop.alts ??= []).push(parseAlt(child)); break;
    }
  }

  if (!stop.name) throw new ParseError(1, `Stop "${id}" is missing a name`);
  if (!stop.goal) throw new ParseError(1, `Stop "${id}" is missing a goal`);
  return stop;
}

function parseAlt(node: KNode): Alt {
  const alt: Alt = { name: "", goal: "" };
  for (const child of node.children) {
    switch (child.name) {
      case "name": alt.name = strVal(child, 0, "name"); break;
      case "goal": alt.goal = strVal(child, 0, "goal"); break;
      case "cat":  alt.cat = strVal(child, 0, "cat") as Category; break;
      case "addr": alt.addr = strVal(child, 0, "addr"); break;
      case "dur":  alt.dur = parseDurStr(child); break;
      case "note": alt.note = strVal(child, 0, "note"); break;
    }
  }
  if (!alt.name) throw new ParseError(1, "Alt is missing a name");
  if (!alt.goal) throw new ParseError(1, "Alt is missing a goal");
  return alt;
}

function parseRoute(node: KNode): Route {
  const id = strVal(node, 0, "id");
  const route: Route = { id, from: "", to: "", mode: "drive" };

  for (const child of node.children) {
    switch (child.name) {
      case "from": route.from = strVal(child, 0, "from"); break;
      case "to":   route.to = strVal(child, 0, "to"); break;
      case "mode": route.mode = strVal(child, 0, "mode") as Mode; break;
      case "dur":  route.dur = parseDurStr(child); break;
      case "dist": route.dist = numVal(child, 0); break;
      case "dep":  route.dep = strVal(child, 0, "dep"); break;
      case "arr":  route.arr = strVal(child, 0, "arr"); break;
      case "cost": route.cost = parseCost(child); break;
      case "url":  route.url = strVal(child, 0, "url"); break;
      case "note": route.note = strVal(child, 0, "note"); break;
    }
  }

  return route;
}

function parseDay(node: KNode): Day {
  const date = node.properties["date"] as string;
  if (!date) throw new ParseError(1, "Day is missing date=");
  const day: Day = { date, items: [] };

  for (const child of node.children) {
    switch (child.name) {
      case "note": day.note = strVal(child, 0, "note"); break;
      case "tz":   day.tz = strVal(child, 0, "tz"); break;
      case "item": day.items!.push(parseDayItem(child)); break;
      case "flex": day.items!.push(parseFlex(child)); break;
    }
  }

  return day;
}

function parseDayItem(node: KNode): DayItem {
  const type = node.properties["type"] as string;
  if (!type) throw new ParseError(1, "Day item is missing type=");

  switch (type) {
    case "stop": return { type: "stop", ref: node.properties["ref"] as string || "" };
    case "route": return { type: "route", ref: node.properties["ref"] as string || "" };
    case "note": return { type: "note", txt: node.properties["txt"] as string || "" };
    default: throw new ParseError(1, `Unknown day item type: "${type}"`);
  }
}

function parseFlex(node: KNode): FlexBlock {
  const pick = (node.properties["pick"] as number) ?? 1;
  const opts: DayItem[] = [];

  for (const child of node.children) {
    if (child.name !== "option") continue;
    const type = child.properties["type"] as string;
    switch (type) {
      case "stop":  opts.push({ type: "stop", ref: child.properties["ref"] as string || "" }); break;
      case "route": opts.push({ type: "route", ref: child.properties["ref"] as string || "" }); break;
      case "note":  opts.push({ type: "note", txt: child.properties["txt"] as string || "" }); break;
    }
  }

  return { type: "flex", pick, opts };
}

function parseCoords(node: KNode): Coords {
  return { lat: numVal(node, 0), lng: numVal(node, 1) };
}

function parseCost(node: KNode): Cost {
  const cost: Cost = { amt: node.properties["amt"] as number ?? 0 };
  if (node.properties["cur"]) cost.cur = node.properties["cur"] as string;
  return cost;
}

function parseDurStr(node: KNode): string {
  const min = node.properties["min"] as number | undefined;
  const max = node.properties["max"] as number | undefined;
  if (min !== undefined) {
    const maxVal = max ?? min;
    const a = decimalToISO(min);
    const b = decimalToISO(maxVal);
    return min === maxVal ? a : `${a} ${b}`;
  }
  return strVal(node, 0, "dur");
}

function strVal(node: KNode, idx: number, label: string): string {
  const v = node.values[idx];
  if (v == null) throw new ParseError(1, `${label}: expected a string value at position ${idx}`);
  return String(v);
}

function numVal(node: KNode, idx: number): number {
  const v = node.values[idx];
  if (v == null) throw new ParseError(1, `Expected a number value at position ${idx}`);
  return Number(v);
}

interface FlexBlock {
  type: "flex";
  pick: number;
  opts: DayItem[];
}

// ── Format: Itinerary → KDL string ────────────────────────

export function format(it: Itinerary): string {
  const children: string[] = [];

  if (it.summary) children.push(kv("summary", it.summary));
  if (it.tz) children.push(kv("tz", it.tz));
  if (it.cur) children.push(kv("cur", it.cur));
  if (it.tags?.length) children.push(kv("tags", it.tags.join(", ")));
  if (it.generated_by) children.push(kv("generated_by", it.generated_by));
  if (it.created_at) children.push(kv("created_at", it.created_at));

  for (const stop of it.stops) children.push(formatStop(stop));
  for (const route of it.routes) children.push(formatRoute(route));
  for (const day of it.days) children.push(formatDay(day));

  return `itinerary "${escapeStr(it.name)}" {\n${children.join("\n")}\n}\n`;
}

function formatStop(stop: Stop): string {
  const c: string[] = [];
  c.push(kv("name", stop.name));
  c.push(kv("goal", stop.goal));
  if (stop.cat) c.push(kv("cat", stop.cat));
  if (stop.addr) c.push(kv("addr", stop.addr));
  if (stop.coords) c.push(`  coord ${stop.coords.lat} ${stop.coords.lng}`);
  if (stop.place_id) c.push(kv("place_id", stop.place_id));
  if (stop.tz) c.push(kv("tz", stop.tz));
  if (stop.dur) c.push(formatDur(stop.dur));
  if (stop.cost) c.push(formatCost(stop.cost));
  if (stop.dep) c.push(kv("dep", stop.dep));
  if (stop.arr) c.push(kv("arr", stop.arr));
  if (stop.url) c.push(kv("url", stop.url));
  if (stop.note) c.push(kv("note", stop.note));
  if (stop.alts) {
    for (const alt of stop.alts) c.push(formatAlt(alt));
  }
  return `  stop "${stop.id}" {\n${c.join("\n")}\n  }`;
}

function formatAlt(alt: Alt): string {
  const c: string[] = [];
  c.push(`    name "${escapeStr(alt.name)}"`);
  c.push(`    goal "${escapeStr(alt.goal)}"`);
  if (alt.cat) c.push(`    cat "${alt.cat}"`);
  if (alt.addr) c.push(`    addr "${escapeStr(alt.addr)}"`);
  if (alt.dur) c.push(`    ${formatDur(alt.dur).trim()}`);
  if (alt.note) c.push(`    note "${escapeStr(alt.note)}"`);
  return `    alt {\n${c.join("\n")}\n    }`;
}

function formatRoute(route: Route): string {
  const c: string[] = [];
  c.push(kv("from", route.from));
  c.push(kv("to", route.to));
  c.push(kv("mode", route.mode));
  if (route.dur) c.push(formatDur(route.dur));
  if (route.dist !== undefined) c.push(`    dist ${route.dist}`);
  if (route.dep) c.push(kv("dep", route.dep));
  if (route.arr) c.push(kv("arr", route.arr));
  if (route.cost) c.push(formatCost(route.cost));
  if (route.url) c.push(kv("url", route.url));
  if (route.note) c.push(kv("note", route.note));
  return `  route "${route.id}" {\n${c.join("\n")}\n  }`;
}

function formatDay(day: Day): string {
  const c: string[] = [];
  if (day.note) c.push(kv("note", day.note));
  if (day.tz) c.push(kv("tz", day.tz));
  if (day.items) {
    for (const item of day.items) c.push(formatDayItem(item));
  }
  return `  day date="${day.date}" {\n${c.join("\n")}\n  }`;
}

function formatDayItem(item: DayItem): string {
  switch (item.type) {
    case "stop": return `    item type="stop" ref="${item.ref}"`;
    case "route": return `    item type="route" ref="${item.ref}"`;
    case "note": return `    item type="note" txt="${escapeStr(item.txt)}"`;
    case "flex": {
      const opts = item.opts.map(opt => {
        switch (opt.type) {
          case "stop": return `      option type="stop" ref="${opt.ref}"`;
          case "route": return `      option type="route" ref="${opt.ref}"`;
          case "note": return `      option type="note" txt="${escapeStr(opt.txt)}"`;
        }
      }).join("\n");
      return `    flex pick=${item.pick} {\n${opts}\n    }`;
    }
  }
}

function formatDur(dur: string): string {
  const parts = dur.trim().split(/\s+/);
  if (parts.length === 1) {
    const h = parseDurHours(parts[0]!);
    return `    dur min=${h} max=${h}`;
  }
  return `    dur min=${parseDurHours(parts[0]!)} max=${parseDurHours(parts[1]!)}`;
}

function parseDurHours(dur: string): number {
  const m = dur.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!m) return 0;
  return parseInt(m[1] ?? "0", 10) + parseInt(m[2] ?? "0", 10) / 60;
}

function decimalToISO(h: number): string {
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  if (minutes === 0) return `PT${hours}H`;
  if (hours === 0) return `PT${minutes}M`;
  return `PT${hours}H${minutes}M`;
}

function formatCost(cost: Cost): string {
  const cur = cost.cur ? ` cur="${cost.cur}"` : "";
  return `    cost amt=${cost.amt}${cur}`;
}

function kv(key: string, value: string): string {
  return `  ${key} "${escapeStr(value)}"`;
}

function escapeStr(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// ── Error ─────────────────────────────────────────────────

export class ParseError extends Error {
  constructor(line: number, message: string) {
    super(`Line ${line}: ${message}`);
    this.name = "ParseError";
  }
}
