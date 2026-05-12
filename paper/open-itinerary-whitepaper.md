# Open Itinerary: An Open Format for AI-Generated Travel Plans

**v0.2 — May 2026**

---

## Abstract

AI agents increasingly generate travel plans, but every agent outputs a different JSON shape—or worse, unstructured prose. No app can reliably consume these outputs, and no standard exists for what a "stop" is, how alternatives are represented, or how to hand an itinerary from one tool to another. Open Itinerary is a JSON Schema that solves this coordination problem. Three design insights distinguish it: every stop declares a `goal` (the *why* behind visiting), coordinates are treated as a geocoder cache rather than agent-authored truth, and field names are deliberately shortened to reduce LLM output token costs by 25–35% versus verbose alternatives. A companion geocoder adds real coordinates post-generation, and a custom serialization format (Phase 2) targets a further 40% token reduction over JSON. The schema, examples, geocoder, and a live validator are available at `github.com/ThatXliner/open-itin`.

---

## 1. Introduction

In 2026, AI agents plan trips. Claude, ChatGPT, Gemini—they all produce itineraries on demand. But the output is a mess. Some agents emit prose with times and addresses scattered through paragraphs. Others emit ad-hoc JSON with field names invented on the spot (`locationName` vs `place_name` vs `title`). Every developer building a travel app that consumes AI output writes a custom parser. Every AI tool developer reinvents the schema.

This is the same coordination problem that iCalendar solved for events in 1998. Before iCalendar, every calendar app had its own format. After iCalendar, Outlook, Google Calendar, and Apple Calendar could exchange events without friction. Travel plans need the same thing: a boring, useful, open format that everyone can agree on.

Existing standards don't fill the gap:

- **Schema.org `Trip`** is a vocabulary for web pages, not an interchange format. It describes trips to search engines, not to apps.
- **iCalendar (RFC 5545)** models events with fixed start/end times, not multi-day journeys with flexible durations and alternatives.
- **GTFS** is transit-specific—stops, routes, and schedules for buses and trains, not hotels, restaurants, and scenic viewpoints.
- **Google Maps API JSON** is proprietary, deeply nested, and not designed for AI agent output.

Open Itinerary is designed for a specific job: be the thing AI agents output, and the thing travel apps consume. A JSON Schema. A single file. No library, no SDK, no lock-in.

---

## 2. Design Principles

### 2.1 Explicit intent via `goal`

Every stop in an Open Itinerary must declare *why* you're going there. This is the `goal` field—a short, human-readable phrase like "See the sea otters and kelp forest" or "Overnight stay—creekside rooms in the heart of Big Sur." It is the single most important design decision in the format and serves three purposes:

1. **For AI agents**: It acts as a forcing function. The model must articulate intent, which improves the quality of the generated itinerary—you can't just list places, you have to say why each one matters.
2. **For consuming apps**: It provides a display-ready purpose string that works without further parsing. A map view can show the goal as a subtitle. A timeline can display it as the primary description.
3. **For travelers**: It communicates what matters about each stop. A traveler reading the itinerary can decide whether a stop aligns with their interests without researching it externally.

### 2.2 Validation

Today, the data model ships with a JSON Schema for validation. Any JSON Schema validator in any language can check an Open Itinerary document—adoption requires nothing more than pointing a validator at the schema URI. Every document declares its `$schema` and `version` so consuming apps can detect version changes.

JSON Schema is an implementation detail, not the format itself. The data model—stops with goals, routes between them, days with ordered items, flex blocks—exists independently of how it is serialized or validated. A future Phase 2 format will use a custom serialization with the same underlying model.

### 2.3 Token efficiency is a first-class concern

When an AI agent outputs JSON, every character is a token that costs money. Field name length alone can add 25–35% to the output token count when comparing Open Itinerary's short names to typical verbose alternatives:

| Open Itinerary | Verbose equivalent | Token savings |
|---|---|---|
| `tz` | `timezone` | 0% (same token count for 2-char vs 8-char) |
| `dur` | `estimatedDuration` | 25% |
| `cat` | `category` | 0% (both 1 token) |
| `alts` | `alternatives` | 0% (both 1 token) |
| `cur` | `currency` | 0% |
| `dist` | `distanceKilometers` | 50% |
| `dep` | `departureTime` | 25% |
| `arr` | `arrivalTime` | 25% |
| `addr` | `streetAddress` | 25% |
| `goal` | `purposeOfVisit` | 40% |

The overall field name savings is approximately 18% (37 vs 45 tokens for the same set of 12 field names, counted with OpenAI's `cl100k_base` tokenizer). The structural savings—flat catalogs instead of deep nesting, references instead of duplication—compound this.

### 2.4 Flat catalogs over deep nesting

Stops and routes live in top-level arrays (`stops`, `routes`) and are referenced by `id` from each day's `items`. This has three benefits:

1. **No duplication**: A stop that appears in multiple days (e.g., a hotel you return to) is defined once and referenced by id.
2. **Better LLM output**: Language models handle flat lists of typed objects more reliably than deeply nested JSON. Each stop is a self-contained block with all its fields at one level.
3. **Smaller payloads**: Referencing `{"type": "stop", "ref": "hotel-shibuya"}` costs ~10 tokens versus repeating the full stop definition (~50+ tokens).

### 2.5 Addresses over coordinates

Language models do not have a geospatial model. They cannot compute coordinates. When asked for lat/lng, they confidently emit numbers that are in the right region but wrong by kilometers—a silent failure mode that is hard to detect without plotting every point on a map.

Open Itinerary makes `name` (the place name) and `addr` (the street address) the authoritative location identifier. The `coords` field is defined as a geocoder cache: always produced by a geocoding service, never authored by a human or an AI agent. The schema description explicitly says: "Populated by the geocoder—do NOT set this when generating the itinerary."

A companion Python script (`geocode.py`) processes any `.oitinerary.json` file through Nominatim (OpenStreetMap), adding coordinates with provenance metadata:

```json
"coords": {
  "lat": 36.6183,
  "lng": -121.9017,
  "source": "nominatim",
  "geocoded_at": "2026-05-11T10:00:00Z"
}
```

If the name or address changes, the coordinates are discarded and re-geocoded. The `source` field and `geocoded_at` timestamp make cache invalidation explicit.

### 2.6 Duration ranges over fixed times

Travel is uncertain. Traffic varies. A museum might be more interesting than expected. Open Itinerary uses duration ranges (`dur: {min: 1.5, max: 2.5}`, in hours) rather than fixed start/end times. This acknowledges that most itinerary items are flexible. Fixed departure and arrival times (`dep`, `arr`, as ISO 8601 strings) are available for the cases where they matter: flights, train departures, dinner reservations.


## 3. Entity Model

Open Itinerary defines six core entity types:

### Trip (top-level document)

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `$schema` | Yes | string | Schema URI (const) |
| `version` | Yes | string | `"0.2"` |
| `name` | Yes | string | Trip name |
| `stops` | Yes | Stop[] | Stop catalog |
| `days` | Yes | Day[] | Ordered days |
| `summary` | No | string | 1–3 sentence overview |
| `tags` | No | string[] | Discovery labels |
| `tz` | No | string | Default IANA timezone |
| `cur` | No | string | Default ISO 4217 currency |
| `routes` | No | Route[] | Route catalog |
| `generated_by` | No | string | Producing agent/app |
| `created_at` | No | datetime | Generation timestamp |

### Stop

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `id` | Yes | string | Unique within document |
| `name` | Yes | string | Display name (authoritative) |
| `goal` | Yes | string | Why you're stopping here |
| `cat` | No | enum | accommodation, food, drink, attraction, nature, viewpoint, transport, rest, shopping, activity, other |
| `addr` | No | string | Address for geocoding |
| `coords` | No | Coords | Geocoder cache |
| `place_id` | No | string | Namespaced external ID |
| `tz` | No | string | Timezone override |
| `dur` | No | Duration | `{min, max}` in hours |
| `cost` | No | Cost | `{amt, cur}` |
| `dep` | No | string | Departure time (ISO 8601) |
| `arr` | No | string | Arrival time (ISO 8601) |
| `url` | No | uri | Info/booking link |
| `note` | No | string | Tips and caveats |
| `alts` | No | Alt[] | Alternatives to this stop |

### Route

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `id` | Yes | string | Unique within document |
| `from` | Yes | string | Origin stop id |
| `to` | Yes | string | Destination stop id |
| `mode` | Yes | enum | drive, fly, train, bus, walk, bike, transit, ferry, other |
| `dur` | No | Duration | Travel time range |
| `dist` | No | number | Distance in km |
| `dep` | No | string | Departure time |
| `arr` | No | string | Arrival time |
| `cost` | No | Cost | Fare/toll estimate |
| `url` | No | uri | Directions/booking |
| `note` | No | string | Route notes |

### Day

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `date` | Yes | string | ISO 8601 date |
| `tz` | No | string | Timezone override |
| `items` | No | DayItem[] | Ordered timeline |
| `note` | No | string | Day note |

### DayItem (discriminated union)

- **stop** — `{type: "stop", ref: "stop-id"}`. References a Stop from the catalog.
- **route** — `{type: "route", ref: "route-id"}`. References a Route from the catalog.
- **note** — `{type: "note", txt: "Freeform text"}`. Inline note within the day's timeline.
- **flex** — `{type: "flex", pick: N, opts: [DayItem, ...]}`. A set of alternatives where the traveler chooses N.

### Alt (alternative)

A lighter version of Stop for the `alts` array. Required fields: `name`, `goal`. Optional: `cat`, `addr`, `dur`, `note`. No `id`, no nested `alts`, no `coords` (geocoded alongside the parent stop).

---

## 4. The Coordinate Problem

### 4.1 Hallucination as a systematic failure

When asked for the coordinates of "Monterey Bay Aquarium," a language model might output `{lat: 36.6183, lng: -121.9017}`. These numbers look plausible—they're in the right region, the right format, the right number of decimal places. But they might be off by 500 meters, or point to the parking lot instead of the entrance, or be the coordinates of a different aquarium entirely.

This is not a bug in any specific model. It is a fundamental limitation: language models predict tokens, not locations. They have no geospatial reasoning. The coordinates they output are a statistical best-guess based on training data, not a computed result.

For a travel app rendering a map pin, a 500-meter error is invisible on a zoomed-out view but catastrophic when the user is walking and following directions to the wrong building.

### 4.2 The cache pattern

Open Itinerary's solution is architectural rather than technical: separate *naming* from *locating*.

The agent outputs what it knows: the name of the place and its street address. These are facts the model is likely to have in its training data and can verify against its own output ("does 'Monterey Bay Aquarium' at '886 Cannery Row, Monterey, CA 93940' sound right?").

A geocoder—deterministic, verifiable, using real map data—converts the address to coordinates as a post-processing step. The coordinates include:

- **`source`**: Which geocoding provider produced them (`nominatim`, `google`, `mapbox`, etc.)
- **`geocoded_at`**: When they were produced (for cache invalidation)

If the address changes, the coordinates are stale and must be regenerated. If the geocoder returns no result, the coordinates are absent rather than guessed. This is *fail-safe*: no pin is better than a wrong pin.

The companion `geocode.py` script implements this pattern using Nominatim (OpenStreetMap), respecting the 1 req/sec rate limit, and supporting a `--dry-run` mode for preview.

### 4.3 `place_id` for disambiguation

For cases where text geocoding is ambiguous (multiple places with the same name), Open Itinerary supports a `place_id` field with a namespace prefix:

- `gplaces:ChIJ...` — Google Places ID
- `osm:node/12345` — OpenStreetMap node ID

This allows apps with access to a specific mapping provider to resolve locations with zero ambiguity.

---

## 5. Token Efficiency Analysis

We compared four representations of the same 3-day road trip (San Francisco to Los Angeles, 5 stops, 2 routes, 3 days) using OpenAI's `cl100k_base` tokenizer:

| Format | Tokens | vs. Plain English |
|--------|--------|-------------------|
| Plain English (typical AI output) | 234 | 1.00× (baseline) |
| Open Itinerary v0.2 (JSON) | 846 | 3.62× |
| Open Itinerary as YAML | 761 | 3.25× |
| Agent-optimized format (Phase 2) | 501 | 2.14× |

### 5.1 Interpretation

Plain English is the most token-efficient format—and the least structured. A human can read it, but an app cannot parse it reliably. Every tool consuming plain English itineraries must run an LLM to extract entities, adding latency, cost, and error.

Structured JSON costs 3.6× more tokens than plain English. This is the price of machine readability: every field name gets quoted, every object gets braces, every array gets brackets. The YAML variant saves about 10% over JSON by eliminating some delimiters but retains the same field names.

The agent-optimized format (Phase 2) cuts the overhead nearly in half: 2.1× baseline versus JSON's 3.6×. It achieves this by eliminating quotes around keys, using indentation instead of braces, and employing positional fields (`coord 37.8 -122.5` instead of `{"lat": 37.8, "lng": -122.5}`).

The key insight: **structure costs tokens, but the cost can be reduced**. At scale—millions of itinerary generations—the difference between 846 and 501 tokens per output is meaningful in both cost and latency.

---

## 6. Comparison with Existing Formats

| | Open Itinerary | Schema.org Trip | iCalendar (RFC 5545) | GTFS | Ad-hoc JSON |
|---|---|---|---|---|---|
| **Purpose** | AI agent → app | Web page markup | Calendar events | Transit schedules | Anything |
| **Structured** | Yes | Yes | Yes | Yes | Sometimes |
| **Token-efficient** | Yes | No | No | N/A | Varies |
| **goal field** | Yes | No | No | No | Sometimes |
| **Coords safety** | Geocoder cache | N/A | Geo property | N/A | No |
| **Duration ranges** | Yes | No | No | No | Rarely |
| **Time zones** | Yes | No | Yes | Yes | Rarely |
| **Explicit routes** | Yes | No | No | Yes | Sometimes |
| **Alternatives** | Yes | No | No | No | Rarely |
| **Flex blocks** | Yes | No | No | No | No |
| **Provenance** | `generated_by`, `created_at` | No | `DTSTAMP` | No | Rarely |
| **MIME type** | `application/vnd.open-itinerary+json` | N/A | `text/calendar` | N/A | N/A |
| **File extension** | `.oitinerary.json` | N/A | `.ics` | `.txt` | `.json` |

### 6.1 Schema.org Trip

Schema.org's `Trip` type is part of a broader vocabulary for marking up web pages. It models a trip as a list of `TouristAttraction`, `City`, or `Hotel` items with geo-coordinates. It lacks: a concept of days, routing between stops, alternatives, duration estimates, and intent/purpose. It is designed for search engines to understand that a page *describes* a trip, not for apps to *execute* one.

### 6.2 iCalendar

iCalendar models events with fixed start/end times, recurrence rules, and alarms. A trip could theoretically be represented as a series of `VEVENT` items, but: there is no concept of "travel between events," no alternatives, no flexible durations, and the format is verbose (property lines with structured values). iCalendar is excellent for "Meeting at 2pm in Conference Room B" and poor for "Spend 1–2 hours at this museum, then drive 45 minutes to the hotel."

### 6.3 GTFS

GTFS (General Transit Feed Specification) models transit networks: stops, routes, trips, and schedules. It is the right format for "the #38 bus departs at 10:15am from Stop ID 1234" but the wrong format for "grab lunch at a seafood shack in Monterey." GTFS trips are transit-specific and have no concept of tourist activities, accommodations, or flexible alternatives.

---

## 7. Extensibility

### 7.1 Unknown fields

Open Itinerary does not use `additionalProperties: false` on the top-level object. This means apps can add custom fields without breaking validation. By convention, non-standard extensions should use an `x-` prefix:

```json
{
  "x-booking-ref": "BK-12345",
  "x-party-size": 4
}
```

Future versions of the schema may promote widely-adopted extension fields into the standard.

### 7.2 Versioning

Every document declares its schema version. Breaking changes—field renames, type changes, new required fields—will increment the minor version (0.2 → 0.3). The `$schema` URI pins the exact version. Consuming apps check the version field and can reject or upgrade unknown versions.

### 7.3 Future extension namespaces

Several domains are explicitly out of scope for v0.2 but could be added as optional namespaces in future versions:

- **Booking**: confirmation numbers, provider references, cancellation policies
- **Accessibility**: wheelchair access, hearing loops, sensory-friendly hours
- **Real-time**: live traffic, delay estimates, gate changes
- **Multi-traveler**: per-person preferences, split payments, group coordination
- **Budget**: total trip budget with per-category breakdowns

---

## 8. Future Work

### 8.1 Agent-optimized format (Phase 2)

JSON is universal but verbose. A custom line-delimited, indentation-based format could reduce token counts by ~40% versus JSON while maintaining the same structural guarantees. See `notes/agent-optimized-format.md` for a detailed sketch. The JSON Schema remains the canonical spec; the custom format is a serialization alternative.

### 8.2 Reference libraries

First-class parser libraries in Python, TypeScript, and Go, providing:

- Parse + validate (thin wrapper around JSON Schema validation)
- Normalize (resolve references, fill defaults)
- Export (GeoJSON, iCalendar, GPX, Markdown)

### 8.3 Export adapters

Direct export to mapping and calendar applications:

- **Google Maps / Apple Maps**: Generate a route URL with all stops
- **iCalendar**: Export each day's items as `VEVENT` blocks
- **GPX**: Export route geometry for GPS devices

### 8.4 Ecosystem

The format becomes useful when at least one AI tool outputs it and at least one app consumes it. Early targets:

- **AI tools**: Add Open Itinerary as a function-calling schema in Claude, ChatGPT, and Gemini
- **Travel apps**: Accept `.oitinerary.json` as an import format alongside manual entry
- **Mapping tools**: Render an Open Itinerary as a map layer with day-by-day toggles

---

## 9. Conclusion

Open Itinerary is a small spec with a specific job. It does not handle booking, real-time tracking, or payment splitting. It handles one thing: being the structured output format that AI agents emit and travel apps consume.

The three design insights that distinguish it—the `goal` field, coordinate caching, and token efficiency—each address a real failure mode in AI-generated travel plans. Without a goal, itineraries are lists of places without purpose. Without coordinate caching, they are maps with silently wrong pins. Without token efficiency, they cost more to generate than they should.

The schema is the product. The geocoder makes it operational. The v0.2 spec, examples, validator, and live website are available at `github.com/ThatXliner/open-itin`.

---

## References

1. Desruisseaux, B. (Ed.). (2009). *Internet Calendaring and Scheduling Core Object Specification (iCalendar)*. RFC 5545. IETF.
2. Google Transit. (2024). *GTFS Static Overview*. https://gtfs.org/
3. Schema.org. (2024). *Trip — Schema.org Type*. https://schema.org/Trip
4. OpenStreetMap Foundation. (2024). *Nominatim Usage Policy*. https://operations.osmfoundation.org/policies/nominatim/
5. Wright, A., Andrews, H., & Hutton, B. (2019). *JSON Schema: A Media Type for Describing JSON Documents*. draft-handrews-json-schema-02. IETF.
