# Open Itinerary

**A minimal open format for AI-generated travel itineraries.**

JSON + schema. No new syntax. Works with every JSON tool you already have.

---

## The problem

Ask five AI agents to plan a road trip. Get five completely different JSON shapes — or worse, prose. There's no standard for what a "stop" is, how alternatives are represented, or how to hand an itinerary off from one app to another without writing a custom parser.

Open Itinerary fixes the coordination problem. It's to travel plans what iCalendar is to events: boring, useful, and open.

---

## What it is

A published JSON Schema + a `$schema` pointer in every document. That's it.

```json
{
  "$schema": "https://openitinerary.org/schema/v0.1/itinerary.schema.json",
  "version": "0.1",
  "title": "Pacific Coast Highway: SF to LA",
  "duration_days": 3,
  "stops": [
    {
      "id": "stop-1",
      "day": 1,
      "location": {
        "name": "Bixby Creek Bridge, Big Sur"
      },
      "goal": "The iconic Big Sur viewpoint — pull over here, full stop",
      "category": "viewpoint",
      "duration": { "min_hours": 0.25, "max_hours": 1 },
      "alternatives": [
        {
          "location": { "name": "McWay Falls, Julia Pfeiffer Burns State Park" },
          "goal": "Waterfall onto the beach — quieter and equally worth it",
          "category": "nature"
        }
      ]
    }
  ]
}
```

After generation, run the geocoder (see below) and coordinates are added automatically:

```json
"location": {
  "name": "Bixby Creek Bridge, Big Sur",
  "coords": {
    "lat": 36.3714,
    "lng": -121.9018,
    "source": "nominatim",
    "geocoded_at": "2025-05-11T10:00:00Z"
  }
}
```

Files use the extension `.oitinerary.json` and the MIME type `application/vnd.open-itinerary+json`.

---

## Key design decisions

**Order implies sequence, not schedule.** Stops are ordered in the array. No timestamps. A `day` field lets you group stops without committing to clock times.

**Every stop has a `goal`.** The single most important field. It answers *why* you're stopping, not just *where*. This gives AI agents a forcing function to be explicit about intent, and gives apps a human-readable string that works without further parsing.

**Alternatives are first-class.** Real travel involves choices. Each stop has an `alternatives` array — same shape, no nesting — for other restaurants, hotels, or sights worth considering.

**`name` is the source of truth, `coords` is a cache.** AI-hallucinated coordinates are a silent and common failure mode — the model will confidently emit a lat/lng that's in the right region but wrong by kilometers. Open Itinerary solves this by making `name` (and optionally `address`) the authoritative identifier. Coordinates live in a `coords` sub-object that is always produced by a geocoder, never by an agent. If `name` changes, discard `coords` and re-geocode.

**`place_id` is namespaced.** To avoid coupling to a single mapping provider:
```
"place_id": "gplaces:ChIJN1t_tDeuEmsRUsoyG83frY4"
"place_id": "osm:node/271027695"
```

---

## Schema

The full JSON Schema is in [`open-itinerary.schema.json`](./open-itinerary.schema.json).

### Top-level fields

| Field | Required | Type | Description |
|---|---|---|---|
| `$schema` | ✅ | string | Schema URI |
| `version` | ✅ | string | `"0.1"` |
| `title` | ✅ | string | Trip name |
| `stops` | ✅ | Stop[] | Ordered stops |
| `summary` | — | string | 1–3 sentence overview |
| `tags` | — | string[] | Labels for filtering |
| `duration_days` | — | integer | Suggested trip length |
| `travel_modes` | — | enum[] | driving, flying, walking, … |
| `generated_by` | — | string | Producing agent or app |
| `created_at` | — | date-time | ISO 8601 timestamp |

### Stop fields

| Field | Required | Type | Description |
|---|---|---|---|
| `id` | ✅ | string | Unique within document |
| `location` | ✅ | Location | See below |
| `goal` | ✅ | string | Why you're stopping here |
| `category` | — | enum | accommodation, food, drink, attraction, nature, viewpoint, … |
| `duration` | — | object | `min_hours` / `max_hours` |
| `day` | — | integer | Suggested day (1-indexed) |
| `notes` | — | string | Markdown tips or caveats |
| `alternatives` | — | Alternative[] | Other options for this stop |

### Location fields

| Field | Required | Type | Description |
|---|---|---|---|
| `name` | ✅ | string | Authoritative place name — what a human would search for |
| `address` | — | string | Street address or locality, used as a geocoding hint |
| `place_id` | — | string | Namespaced external ID (`gplaces:…`, `osm:node/…`) |
| `coords` | — | Coords | Geocoder output — never set by hand or by an agent |

### Coords fields

| Field | Required | Type | Description |
|---|---|---|---|
| `lat` | ✅ | number | Latitude, WGS84 |
| `lng` | ✅ | number | Longitude, WGS84 |
| `source` | ✅ | enum | nominatim, photon, google, mapbox, here, manual |
| `geocoded_at` | — | date-time | When geocoding was performed |

---

## Geocoder

`open-itinerary-geocode.js` reads an `.oitinerary.json` file, queries Nominatim (OpenStreetMap) for every stop and alternative, and writes the result into `location.coords`. It unconditionally overwrites any existing coords — name is always truth.

```bash
node open-itinerary-geocode.js my-trip.oitinerary.json
node open-itinerary-geocode.js my-trip.oitinerary.json --dry-run
```

Nominatim is free and requires no API key. The script enforces the 1 req/sec rate limit automatically. For higher volume, swap in Photon (`https://photon.komoot.io/api`) as a drop-in alternative by changing `NOMINATIM_URL` in the script.

---

## Prompting agents to output Open Itinerary

Add this to your system prompt:

```
Output the itinerary as a valid Open Itinerary JSON document conforming to:
https://openitinerary.org/schema/v0.1/itinerary.schema.json

Rules:
- Every stop must have an `id`, `location.name`, and `goal`
- Do NOT include coords — the geocoder will add them as a post-processing step
- Add at least one `alternative` for any food, drink, or accommodation stop
- Use the `day` field to group stops by day
- Output only the JSON — no prose, no markdown fences
```

Schema-constrained generation is measurably more consistent than "just output JSON" — the model has a spec to satisfy, which reduces hallucinated fields and missing required data.

---

## Example

A full 3-day PCH road trip in Open Itinerary format: [`example-pch.oitinerary.json`](./example-pch.oitinerary.json)

---

## Status

This is v0.1 — a schema, a geocoder, and an example. The immediate next steps are:

- [ ] Validator (TypeScript + CLI)
- [ ] TypeScript type definitions generated from schema
- [ ] Python library
- [ ] `openitinerary.org` with schema hosting and docs

Breaking changes will increment the minor version (0.2, 0.3, …) until a stable 1.0 is declared. The `$schema` URI pins the version, so consuming apps can detect and handle changes.

---

## What's out of scope for v0.1

Exact departure/arrival times, turn-by-turn routing, pricing, booking data, multi-traveler fields. These may appear in future versions or optional extension namespaces.

---

## Contributing

Open Itinerary is in early design. The most useful contributions right now are real-world test cases: itineraries that the current schema can't represent well. Open an issue with the use case and we'll figure out if it warrants a schema change.

---

## License

Schema and tooling: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) — no rights reserved. Use it, fork it, build on it.
