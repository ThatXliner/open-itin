# Agent-Optimized Format (Phase 2)

v1 is JSON Schema — universal, zero-dependency, works everywhere. But JSON has inherent token overhead: every key gets quoted, every object gets braces, every array gets brackets. For AI agents outputting structured travel plans at scale, this waste adds up.

## The idea

A line-delimited, indentation-based format that maps 1:1 to the Open Itinerary schema but strips JSON's syntactic overhead. Think: a stricter, less ambiguous YAML where the structure is defined entirely by indentation and prefixes, not delimiters.

## Rough sketch

```
trip: SF to LA Road Trip
tz: America/Los_Angeles
cur: USD

stop sf
  San Francisco
  coord 37.7749 -122.4194
  note Start here early morning

stop monterey
  Monterey Bay Aquarium
  coord 36.6183 -121.9017
  dur PT2H
  cost 65 USD

route sf-to-monterey
  from sf
  to monterey
  drive
  dur PT2H
  dist 180

day 2026-06-15
  SF to Big Sur
  > stop sf
  > route sf-to-monterey
  > stop monterey
  > note Grab lunch on Cannery Row
  > flex pick 1
    > note Hike in Julia Pfeiffer Burns State Park
    > note Relax at Pfeiffer Beach
```

## Token savings (rough estimate)

For a 3-day trip like sf-to-la.json (~120 lines of JSON, ~4,500 tokens):

| Format | Est. output tokens | Savings |
|--------|-------------------|---------|
| Verbose JSON (long names) | ~6,000 | — |
| Open Itinerary v1 (JSON) | ~4,500 | 25% |
| Agent-optimized format | ~2,500 | 58% |

The main levers:
1. **No quotes around keys or simple values** — `name: SF` not `"name": "SF"`
2. **No braces or brackets** — indentation defines structure
3. **Positional fields** — `coord` takes `lat lng` (no `{lat:, lng:}` wrapper)
4. **Prefix-based references** — `> stop sf` not `{"type": "stop", "ref": "sf"}`
5. **Single-char line prefixes** — `>` for an itinerary item, nothing for a top-level entity property

## Why not YAML?

YAML is close but has footguns for AI generation:
- **The Norway problem**: unquoted `NO` becomes boolean `false`. AI agents trip on this constantly.
- **Indentation sensitivity without a strict schema**: YAML parsers are forgiving in unpredictable ways.
- **Too many ways to say the same thing**: flow style vs block style, anchors vs references, etc. LLMs mix styles.

A purpose-built format would be dramatically stricter than YAML — minimal syntax, no ambiguity, hard errors.

## Path to v2

1. Prove v1 (JSON Schema) has adoption — there's demand
2. Write a formal grammar for the optimized format (EBNF or PEG)
3. Build a reference parser that validates and converts to/from JSON
4. Measure real token savings across Claude, GPT, Gemini on common trip patterns
5. Write a shim: an OpenAPI/function-calling definition that outputs optimized format but validates against the JSON Schema

## Prior art

- **EDN** (Clojure) — extensible data notation, no commas, few quotes
- **JSON5** — more relaxed JSON but still brace-heavy
- **HCL** (Terraform) — indentation-based, clean syntax, but domain-specific
- **CSON** (CoffeeScript Object Notation) — significant indentation, never caught on
- **KDL** — XML replacement with a clean syntax: `stop "monterey" { coord 36.6 -121.9 }`
