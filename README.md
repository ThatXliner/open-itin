# Open Itinerary

**An open, token-efficient JSON format for travel itineraries, designed for AI agents to output and apps to consume.**

---

## The problem

Ask five AI agents to plan a road trip and you get five completely different JSON shapes, or worse, prose. There is no standard for what a "stop" is, how alternatives are represented, or how to hand an itinerary off from one app to another without writing a custom parser. Existing formats do not help: Schema.org's `Trip` is too abstract for real itineraries, iCalendar was not designed for planning, and GTFS is transit-specific. Open Itinerary aims to be for travel plans what iCalendar is for events: boring, useful, and open.

---

## What it is

It is a data model for travel plans, with two equivalent serializations:

- **`.oitinerary.kdl`** — a token-efficient KDL format designed for AI agents to output. 60-80% fewer tokens than JSON.
- **`.oitinerary.json`** — JSON, validated by [JSON Schema](https://raw.githubusercontent.com/ThatXliner/open-itin/main/open-itin.schema.json), MIME `application/vnd.open-itinerary+json`. Use this for app consumption and validation.

Convert between them with the CLI:

```bash
cd agent-format
bun run src/cli.ts to-json examples/sf-to-la.oitinerary.kdl   # KDL → JSON
bun run src/cli.ts from-json trip.json                         # JSON → KDL
```

### Agent format (KDL)

```
itinerary "SF to LA Road Trip" {
  summary "A 3-day coastal road trip from San Francisco to Los Angeles via Highway 1."
  tz "America/Los_Angeles"
  cur "USD"
  tags "road-trip, coastal, california"
  generated_by "claude-sonnet-4"
  created_at "2026-05-11T10:00:00Z"
  stop "monterey" {
    name "Monterey Bay Aquarium"
    goal "See the sea otters and kelp forest"
    cat "attraction"
    addr "886 Cannery Row, Monterey, CA 93940"
    dur min=1.5 max=2.5
    cost amt=65
    alt {
      name "Monterey State Beach"
      goal "Free alternative — walk the beach instead"
      cat "nature"
    }
  }
  route "sf-to-monterey" {
    from "sf"
    to "monterey"
    mode "drive"
    dur min=1.75 max=2.5
    dist 180
  }
  day date="2026-06-15" {
    item type="stop" ref="monterey"
    flex pick=1 {
      option type="stop" ref="beach"
      option type="note" txt="Relax at the hotel pool"
    }
  }
}
```

### JSON format

```json
{
  "$schema": "https://raw.githubusercontent.com/ThatXliner/open-itin/main/open-itin.schema.json",
  "version": "0.2",
  "name": "SF to LA Road Trip",
  "summary": "A 3-day coastal road trip from San Francisco to Los Angeles via Highway 1.",
  "tags": ["road-trip", "coastal", "california"],
  "tz": "America/Los_Angeles",
  "cur": "USD",
  "stops": [
    {
      "id": "monterey",
      "name": "Monterey Bay Aquarium",
      "goal": "See the sea otters and kelp forest",
      "cat": "attraction",
      "addr": "886 Cannery Row, Monterey, CA 93940",
      "dur": { "min": 1.5, "max": 2.5 },
      "cost": { "amt": 65 },
      "alts": [
        {
          "name": "Monterey State Beach",
          "goal": "Free alternative — walk the beach instead",
          "cat": "nature"
        }
      ]
    }
  ],
  "routes": [
    {
      "id": "sf-to-monterey",
      "from": "sf",
      "to": "monterey",
      "mode": "drive",
      "dur": { "min": 1.75, "max": 2.5 },
      "dist": 180
    }
  ],
  "days": [
    {
      "date": "2026-06-15",
      "items": [
        { "type": "stop", "ref": "sf" },
        { "type": "route", "ref": "sf-to-monterey" },
        { "type": "stop", "ref": "monterey" },
        {
          "type": "flex",
          "pick": 1,
          "opts": [
            { "type": "stop", "ref": "beach" },
            { "type": "note", "txt": "Relax at the hotel pool" }
          ]
        }
      ]
    }
  ],
  "generated_by": "claude-sonnet-4",
  "created_at": "2026-05-11T10:00:00Z"
}
```

After running the geocoder, coordinates are added automatically:

```json
{
  "id": "monterey",
  "name": "Monterey Bay Aquarium",
  "addr": "886 Cannery Row, Monterey, CA 93940",
  "coords": {
    "lat": 36.6183,
    "lng": -121.9017,
    "source": "nominatim",
    "geocoded_at": "2026-05-11T10:00:00Z"
  }
}
```

---

## Key design decisions

**`name` is truth, `coords` is a cache.** AI agents hallucinate coordinates; they will confidently emit a latitude and longitude that is in the right region but wrong by kilometers. The schema makes `name` (and optionally `addr`) the authoritative location identifier. Coordinates live in a `coords` sub-object that is always produced by a geocoder, never by an agent. If the name changes, discard `coords` and re-geocode.

**Every stop has a `goal`.** The single most important field. It answers *why* you're stopping, not just *where*. This forces AI agents to be explicit about intent and gives consuming apps a human-readable string that works without further parsing.

**Token efficiency is a feature.** Short field names (`tz` not `timezone`, `dur` not `duration`, `cur` not `currency`, `cat` not `category`, `alts` not `alternatives`, `dep` not `departureTime`, `dist` not `distanceKm`) save 25-35% on output tokens vs verbose alternatives. When every token costs money in an LLM call, this matters.

**Flat structure with references.** Stops and routes live in top-level catalogs, referenced by `id` from each day. This avoids duplicating stop details and LLMs handle flat references better than deeply nested JSON.

**Alternatives are first-class.** Real travel involves choices. Stops have an `alts` array for "instead of this, consider that." Days have `flex` blocks for "choose N of these," and the decision is not made yet.

**Days are explicit containers with ordered items.** Rather than just a `day` number on each stop, days contain an ordered sequence of stops, routes, notes, and flex blocks. This preserves intra-day order and lets apps render a precise timeline.

**Duration ranges, not fixed times.** `dur: {min: 1.5, max: 2.5}` acknowledges that travel durations are estimates, and exact departure and arrival times are optional (`dep`, `arr`) for when they matter, such as flights or reservations.

---

## Concepts

| Entity | What it is | Required fields |
|--------|-----------|-----------------|
| **Trip** | The whole trip | `$schema`, `version`, `name`, `stops[]`, `days[]` |
| **Stop** | A place you spend time | `id`, `name`, `goal` |
| **Route** | Travel between two stops | `id`, `from`, `to`, `mode` |
| **Day** | One day of the trip | `date` |
| **DayItem** | An entry in a day's timeline | `type` ("stop", "route", "note", "flex") |
| **Flex** | "Choose N of these" block | `type`, `opts[]` |
| **Alt** | Alternative to a stop | `name`, `goal` |

### Full field reference

**Trip:** `$schema`, `version`, `name`, `summary`, `tags`, `tz`, `cur`, `stops[]`, `routes[]`, `days[]`, `generated_by`, `created_at`

**Stop:** `id`, `name`, `goal`, `cat`, `addr`, `coords`, `place_id`, `tz`, `dur`, `cost`, `dep`, `arr`, `url`, `note`, `alts[]`

**Route:** `id`, `from`, `to`, `mode`, `dur`, `dist`, `dep`, `arr`, `cost`, `url`, `note`

**Day:** `date`, `tz`, `items[]`, `note`

**Coords** (geocoder cache): `lat`, `lng`, `source`, `geocoded_at`

**Duration:** `min`, `max` (both in hours, both optional)

**Alt:** `name`, `goal`, `cat`, `addr`, `dur`, `note`

---

## Quick start

### Parse and convert

```bash
cd agent-format
bun install
bun run src/cli.ts parse examples/sf-to-la.oitinerary.kdl   # parse KDL → AST
bun run src/cli.ts to-json examples/sf-to-la.oitinerary.kdl  # KDL → JSON
bun run src/cli.ts from-json trip.json                       # JSON → KDL
bun run src/cli.ts tokens examples/sf-to-la.oitinerary.kdl   # compare token counts
bun run src/cli.ts validate examples/sf-to-la.oitinerary.kdl # validate
```

### Validate JSON

```bash
# Using Python
pip install jsonschema
python -c "
import json, jsonschema
with open('open-itin.schema.json') as f: schema = json.load(f)
with open('your-trip.json') as f: data = json.load(f)
jsonschema.validate(data, schema)
print('Valid')
"

# Or with any JSON Schema validator — ajv, everit, gojsonschema, etc.
```

### Geocode it

```bash
python geocode.py your-trip.json           # geocode in place
python geocode.py your-trip.json --dry-run  # preview only
```

### For AI tool developers

Use the KDL format for agent output — it's 60-80% more token-efficient than JSON and maps 1:1 to the data model. See [SKILL.md](./SKILL.md) for an example Claude Code agent skill that parallelizes itinerary generation across sub-agents.

#### Claude Code plugin

Install via plugin marketplace:

```bash
/plugin marketplace add ThatXliner/claude-plugins
/plugin install open-itin
```

Then use `/open-itin` to generate itineraries.

To use the JSON format, drop the schema into your function calling definition or system prompt:

```
Output the itinerary as a valid Open Itinerary JSON document conforming to:
https://raw.githubusercontent.com/ThatXliner/open-itin/main/open-itin.schema.json

Rules:
- Every stop must have an id, name, and goal
- Do NOT include coords — the geocoder will add them as a post-processing step
- Add at least one alternative for any food, drink, or accommodation stop
- Use the days array with items to preserve ordering within each day
- Use dur with min/max in hours, not fixed timestamps (unless it's a flight or reservation)
- Output only the JSON — no prose, no markdown fences
```

An [example Claude Code agent skill](./SKILL.md) shows how to parallelize itinerary generation across sub-agents: research stops, routes, and day plans concurrently, then assemble and validate the output.

### For app developers

Accept an Open Itinerary JSON as input. Parse it like any other JSON. The schema guarantees well-formed data. Geocode `addr` to get display coordinates. Render `days[].items` in order for a timeline view.

### For everyone else

See [examples/sf-to-la.oitinerary.kdl](./examples/sf-to-la.oitinerary.kdl) (3-day California road trip) and [examples/tokyo-weekend.oitinerary.kdl](./examples/tokyo-weekend.oitinerary.kdl) (2-day Tokyo sprint).

---

## Comparison

| Format | goal field | Coords safety | Token-efficient | Time zones | Explicit routes | Flex blocks |
|--------|-----------|--------------|-----------------|------------|-----------------|-------------|
| Open Itinerary v0.2 | Yes | Geocoder cache | Yes | Yes | Yes | Yes |
| Schema.org Trip | No | N/A | No | No | No | No |
| iCalendar | No | N/A | No | Yes | No | No |
| GTFS | No | N/A | N/A | Yes | Yes | No |
| Ad-hoc JSON | Sometimes | No | Sometimes | Rarely | Sometimes | Rarely |

---

## Geocoder

`geocode.py` reads a `.oitinerary.json` file, queries Nominatim (OpenStreetMap) for every stop and alternative, and writes coordinates into `location.coords`. It unconditionally overwrites any existing coords, because `name` is always truth.

```bash
python geocode.py my-trip.json
python geocode.py my-trip.json --dry-run
```

Nominatim is free and requires no API key. The script enforces a 1.2s rate limit automatically. For higher volume, swap in Photon (`https://photon.komoot.io/api`) as a drop-in alternative.

---

## What's out of scope for v0.2

Turn-by-turn routing, real-time status, booking data, split payments, multi-traveler fields, and accessibility metadata are all out of scope for v0.2; they may appear in future versions or optional extension namespaces.

---

## Future

- Reference parser libraries (Python, TypeScript, Go)
- Export adapters (Google Maps, Apple Maps, iCalendar, GPX)
- `openitinerary.org` with schema hosting and docs

---

## Status

**v0.2 alpha.** Breaking changes will increment the minor version, and the `$schema` URI pins the version so that consuming apps can detect and handle those changes.

## License

MIT
