---
name: oitinerary
description: Generate travel itineraries in the Open Itinerary format. Use when the user asks to plan a trip, create an itinerary, or generate a .oitinerary.kdl file.
---

# Open Itinerary Generator

You generate travel itineraries in the **Open Itinerary** format (file extension: `.oitinerary.kdl`)

## Workflow

When asked to create an itinerary, follow this process:

### 1. Gather requirements

You need the destination(s) and the trip length (dates or a number of days). Ask if the request lacks either. Infer the rest from the request: starting point, budget level, interests, pace, dietary needs. Where it says nothing, choose a sensible default and list your assumptions in the summary.

### 2. Research

Research the stops first: 3-8 per day, each with the fields the Stop reference below lists, costs in local currency, and 1-3 alternatives for major stops. Routes and the day plan both need the stop ids, so plan the routes between consecutive stops next, then lay out each day in a logical order, with inline notes for meals and transitions and flex blocks where the traveler might want a choice.

Use subagents where the work splits independently, such as researching the stops for several days or regions at once. Ask each one to return data in the format below, not prose.

### 3. Write and validate

Assemble the full itinerary (see Format Reference below) and write it to `examples/<slug>.oitinerary.kdl`. Then validate it from the repository root:

```bash
bun run agent-format/src/cli.ts validate examples/<slug>.oitinerary.kdl
```

It prints `OK` on success. On an error, fix the file and run it again. Finish with a human-readable summary of the trip.

## Open Itinerary format Reference

It's an open format based off of KDL.

### Top-level

```kdl
itinerary "<name>" {
  summary "<one-sentence description>"
  tz "<IANA timezone>"           // e.g. "America/Los_Angeles"
  cur "<ISO 4217>"                // e.g. "USD"
  tags "<tag1>, <tag2>"          // comma-separated
  generated_by "<model-name>"
  created_at "<ISO 8601>"
  {stop}                         // 1+ stops
  {route}                        // 0+ routes
  {day}                          // 1+ days
}
```

### Stop

```kdl
stop "<id>" {
  name "<display name>"
  goal "<purpose — one sentence>"
  cat "<category>"               // optional
  addr "<address>"               // optional
  coord <lat> <lng>              // optional, 2 positional values
  place_id "<ns:id>"             // optional, e.g. "gplaces:ChIJ..."
  tz "<IANA>"                    // optional
  dur min=<hours> max=<hours>    // optional, decimal hours
  cost amt=<number> cur="<ISO 4217>"  // optional
  dep "<HH:MM>"                  // optional
  arr "<HH:MM>"                  // optional
  url "<url>"                    // optional
  note "<text>"                  // optional
  {alt}                          // optional
}
```

**Categories**: `accommodation | food | drink | attraction | nature | viewpoint | transport | rest | shopping | activity | other`

### Alt (alternative)

```kdl
alt {
  name "<name>"
  goal "<purpose>"
  cat "<category>"               // optional
  addr "<address>"               // optional
  dur min=<hours> max=<hours>    // optional
  note "<text>"                  // optional
}
```

### Route

```kdl
route "<id>" {
  from "<stop-id>"
  to "<stop-id>"
  mode "<mode>"
  dur min=<hours> max=<hours>    // optional
  dist <km>                      // optional
  dep "<HH:MM>"                  // optional
  arr "<HH:MM>"                  // optional
  cost amt=<number> cur="<ISO 4217>"  // optional
  url "<url>"                    // optional
  note "<text>"                  // optional
}
```

**Modes**: `drive | fly | train | bus | walk | bike | transit | ferry | other`

### Day

```kdl
day date="<YYYY-MM-DD>" {
  note "<text>"                  // optional
  tz "<IANA>"                    // optional
  {item}                         // timeline items
  {flex}                         // flex blocks
}
```

### Day items

```kdl
item type="stop" ref="<stop-id>"
item type="route" ref="<route-id>"
item type="note" txt="<text>"
```

### Flex block (choose N from options)

```kdl
flex pick=<n> {
  option type="stop" ref="<id>"
  option type="route" ref="<id>"
  option type="note" txt="<text>"
}
```

## Quality rules

- Every stop must have: `name`, `goal`, and a practical `note`
- Every route must have: `mode` and `note` (traffic tips, scenic options, logistics)
- Routes must reference stops that exist — `from` and `to` must match `stop` ids
- Day items must reference stops/routes that are defined
- Durations use decimal hours: `min=1.5 max=2.5` (not minutes)
- Stop/route IDs use kebab-case: `"golden-gate-bridge"`, not `"goldenGateBridge"`
- Notes should be concrete and useful, not generic ("Book online to skip the line" not "Popular attraction")
- Include at least one `flex` block per day for optional choices
- For each major stop, include 1-3 `alt` blocks as alternatives

## Example subagent prompts

When spawning the **Stops agent**:

> Research stops for a {N}-day trip to {destination}. For each day, find 3-6 stops covering accommodation, food, attractions, and viewpoints. Return as a structured list with: id (kebab-case), name, goal, category, address, duration (min/max hours), cost (amt + cur), url, and a practical one-sentence note. For 2-3 major stops per day, include 1-3 alternatives. Categories must be one of: accommodation, food, drink, attraction, nature, viewpoint, transport, rest, shopping, activity, other.

When spawning the **Routes agent**:

> Given these stops: [list stop ids], plan routes between consecutive stops. For each leg: id (kebab-case from-to), from/to (stop ids), mode, duration (min/max hours), distance (km), and a practical one-sentence note about the route.

When spawning the **Days agent**:

> Given these stops and routes, assemble a day-by-day timeline. Each day must have: items (stops and routes in order), 1-2 inline notes for meals/tips, and at least one flex block with 2-3 options. Morning starts around 8-9am, evening ends by 10pm.

## Token efficiency

The KDL format saves 60-80% tokens vs JSON. The `agent-format/src/cli.ts tokens` command shows exact savings:

```bash
cd agent-format && bun run src/cli.ts tokens <file>
```
