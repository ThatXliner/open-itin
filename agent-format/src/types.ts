/** Category enum — matches JSON schema Stop.cat */
export type Category =
  | "accommodation" | "food" | "drink" | "attraction"
  | "nature" | "viewpoint" | "transport" | "rest"
  | "shopping" | "activity" | "other";

/** Transport mode — matches JSON schema Route.mode */
export type Mode =
  | "drive" | "fly" | "train" | "bus" | "walk"
  | "bike" | "transit" | "ferry" | "other";

export interface Coords {
  lat: number;
  lng: number;
}

export interface Cost {
  amt: number;
  cur?: string;
}

export interface Alt {
  name: string;
  goal: string;
  cat?: Category;
  addr?: string;
  dur?: string; // ISO 8601 duration
  note?: string;
}

export interface Stop {
  id: string;
  name: string;
  goal: string;
  cat?: Category;
  addr?: string;
  coords?: Coords;
  place_id?: string;
  tz?: string;
  dur?: string; // ISO 8601 duration or range "PT1H30M PT2H30M"
  cost?: Cost;
  dep?: string;
  arr?: string;
  url?: string;
  note?: string;
  alts?: Alt[];
}

export interface Route {
  id: string;
  from: string;
  to: string;
  mode: Mode;
  dur?: string;
  dist?: number;
  dep?: string;
  arr?: string;
  cost?: Cost;
  url?: string;
  note?: string;
}

export type DayItem =
  | StopRef
  | RouteRef
  | NoteItem
  | FlexBlock;

export interface StopRef {
  type: "stop";
  ref: string;
}

export interface RouteRef {
  type: "route";
  ref: string;
}

export interface NoteItem {
  type: "note";
  txt: string;
}

export interface FlexBlock {
  type: "flex";
  pick: number;
  opts: (StopRef | RouteRef | NoteItem)[];
}

export interface Day {
  date: string; // ISO 8601 date YYYY-MM-DD
  tz?: string;
  note?: string;
  items?: DayItem[];
}

export interface Itinerary {
  name: string;
  summary?: string;
  tags?: string[];
  tz?: string;
  cur?: string;
  generated_by?: string;
  created_at?: string;
  stops: Stop[];
  routes: Route[];
  days: Day[];
}

// ── JSON Schema types (for converter) ────────────────────────

export interface JsonCoords {
  lat: number;
  lng: number;
  source: string;
  geocoded_at?: string;
}

export interface JsonDuration {
  min?: number;
  max?: number;
}

export interface JsonCost {
  amt: number;
  cur?: string;
}

export interface JsonAlt {
  name: string;
  goal: string;
  cat?: Category;
  addr?: string;
  dur?: JsonDuration;
  note?: string;
}

export interface JsonStop {
  id: string;
  name: string;
  goal: string;
  cat?: Category;
  addr?: string;
  coords?: JsonCoords;
  place_id?: string;
  tz?: string;
  dur?: JsonDuration;
  cost?: JsonCost;
  dep?: string;
  arr?: string;
  url?: string;
  note?: string;
  alts?: JsonAlt[];
}

export interface JsonRoute {
  id: string;
  from: string;
  to: string;
  mode: Mode;
  dur?: JsonDuration;
  dist?: number;
  dep?: string;
  arr?: string;
  cost?: JsonCost;
  url?: string;
  note?: string;
}

export type JsonDayItem =
  | { type: "stop"; ref: string }
  | { type: "route"; ref: string }
  | { type: "note"; txt: string }
  | { type: "flex"; pick?: number; opts: JsonFlexOption[] };

export type JsonFlexOption =
  | { type: "stop"; ref: string }
  | { type: "route"; ref: string }
  | { type: "note"; txt: string };

export interface JsonDay {
  date: string;
  tz?: string;
  items?: JsonDayItem[];
  note?: string;
}

export interface JsonItinerary {
  $schema: string;
  version: string;
  name: string;
  summary?: string;
  tags?: string[];
  tz?: string;
  cur?: string;
  generated_by?: string;
  created_at?: string;
  stops: JsonStop[];
  routes?: JsonRoute[];
  days: JsonDay[];
}
