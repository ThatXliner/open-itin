# Open Itinerary

**An open, token-efficient JSON format for travel itineraries — designed for AI agents to output and apps to consume.**

---

## The problem

Ask an AI to plan a trip and you get back a wall of text. Or maybe some ad-hoc JSON. Either way, no map app, calendar, or travel tool can read it. Every AI travel agent reinvents the same wheel with slightly different JSON shapes. Meanwhile, developers building travel apps have no standard input format to target.

Existing formats don't help: Schema.org's `Trip` is too abstract for real itineraries, iCalendar wasn't designed for planning, and GTFS is transit-specific.

## What it is

Open Itinerary is a [JSON Schema](./open-itin.schema.json) that describes a structured travel plan. A single file. No library required. Validate it with any JSON Schema validator in any language.

**The format IS the schema.**

```json
{
  "name": "SF to LA Road Trip",
  "tz": "America/Los_Angeles",
  "cur": "USD",
  "stops": [
    {
      "id": "monterey",
      "name": "Monterey Bay Aquarium",
      "cat": "attraction",
      "addr": "886 Cannery Row, Monterey, CA 93940",
      "dur": "PT2H",
      "cost": { "amt": 65, "cur": "USD" }
    }
  ],
  "routes": [
    {
      "id": "sf-to-monterey",
      "from": "sf",
      "to": "monterey",
      "mode": "drive",
      "dur": "PT2H",
      "dist": 180
    }
  ],
  "days": [
    {
      "date": "2026-06-15",
      "note": "SF to Big Sur",
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
  ]
}
```

## Why not just ad-hoc JSON?

**Token efficiency.** Short field names (`tz` not `timezone`, `dur` not `durationMinutes`, `addr` not `location`) save 30-40% on output tokens vs verbose alternatives. When every token costs money in an LLM call, this matters.

**Flat structure.** Stops and routes live in top-level catalogs, referenced by `id` from each day. This avoids duplicating stop details when a place appears in multiple days, and LLMs handle flat references better than deeply nested JSON.

**No hallucinated coordinates.** LLMs don't have a real geospatial model — they guess coordinates and get them wrong. Open Itinerary uses street addresses (`addr`) instead. The consuming app geocodes the address to accurate coordinates at runtime. The LLM outputs what it actually knows (the address) and stops there.

**Resolved ambiguity.** Trip planning has subtle edge cases: time zone boundaries, flexible blocks ("choose your own adventure"), multi-modal routes, optional activities. The schema handles these explicitly rather than forcing each agent to invent its own convention.

## Quick start

### Validate an itinerary

```bash
# Using ajv (Node)
npx ajv validate -s open-itin.schema.json -d your-trip.json

# Using Python
pip install jsonschema
python -c "
import json, jsonschema
with open('open-itin.schema.json') as f: schema = json.load(f)
with open('your-trip.json') as f: data = json.load(f)
jsonschema.validate(data, schema)
print('Valid')
"
```

### For AI tool developers

Drop the schema into your function calling definition:

```python
# OpenAI function calling
{
    "name": "create_itinerary",
    "description": "Output a structured travel itinerary",
    "parameters": { "$ref": "open-itin.schema.json" }  # point at the schema
}
```

Or paste it into your system prompt so the LLM knows the expected output format.

### For app developers

Accept an Open Itinerary JSON as input. Parse it like any other JSON. The schema guarantees well-formed data.

### For everyone else

Use the [examples](./examples/) to see what the format looks like in practice.

## Concepts

| Entity | What it is | Key fields |
|--------|-----------|------------|
| **Trip** | The whole trip | `name`, `tz`, `cur`, `stops[]`, `routes[]`, `days[]` |
| **Stop** | A place you spend time (hotel, restaurant, museum) | `id`, `name`, `cat`, `addr`, `dur`, `cost` |
| **Route** | Travel between two stops (drive, fly, walk) | `id`, `from`, `to`, `mode`, `dur`, `dist` |
| **Day** | One day of the trip | `date`, `tz`, `items[]` |
| **Note** | Freeform text within a day's timeline | `txt` |
| **Flex** | "Choose N of these" alternatives | `opts[]`, `pick` |

### Annotated example

See [examples/sf-to-la.json](./examples/sf-to-la.json) (3-day California road trip) and [examples/tokyo-weekend.json](./examples/tokyo-weekend.json) (2-day Tokyo sprint).

## Design principles

1. **The schema is the spec** — no separate document, no RFC. Comments (`$comment`) in the schema explain each field.
2. **Token efficiency is a feature** — short field names, flat structure, references over duplication.
3. **Time zones are first-class** — every trip, day, and stop can declare its own IANA timezone.
4. **Extensible** — unknown fields are ignored, so apps can add custom metadata without breaking validators.
5. **Zero dependencies** — a JSON Schema and some `.json` files. That's it.

## Comparison

| Format | Structured | Token-efficient | Time zones | Multi-modal | Flexible blocks |
|--------|-----------|-----------------|------------|-------------|-----------------|
| Open Itinerary | Yes | Yes | Yes | Yes | Yes |
| Schema.org Trip | Yes | No | No | No | No |
| iCalendar | Yes | No | Yes | No | No |
| GTFS | Yes | N/A | Yes | Yes | No |
| Ad-hoc JSON | Sort of | Varies | Rarely | Sometimes | Rarely |
| Just text | No | — | Sometimes | Sometimes | Sometimes |

## Status

**Alpha.** The schema is live, examples validate, and we're looking for early adopters. If you're building an AI travel tool or a travel app that could consume structured itineraries, open an issue and let's talk.

## Future

- **Phase 2: Agent-optimized format** — a line-delimited, indentation-based serialization that maps 1:1 to the schema but strips JSON's syntactic overhead (braces, quotes, commas). See [notes/agent-optimized-format.md](./notes/agent-optimized-format.md).
- Reference parser libraries (Python, TypeScript, Go)
- Export adapters (Google Maps, Apple Maps, iCalendar, GPX)

## License

MIT
