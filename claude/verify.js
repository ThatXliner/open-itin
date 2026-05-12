#!/usr/bin/env node
/**
 * open-itinerary-geocode.js
 *
 * Geocodes every location in an .oitinerary.json file using Nominatim (OpenStreetMap)
 * and writes the result into location.coords.
 *
 * `name` (and optionally `address`) is the source of truth.
 * `coords` is always treated as a derived cache — this script unconditionally overwrites it.
 *
 * Usage:
 *   node open-itinerary-geocode.js <file.oitinerary.json>
 *   node open-itinerary-geocode.js <file.oitinerary.json> --dry-run
 *
 * Nominatim usage policy: 1 request/second max, no bulk usage.
 * This script enforces a 1.1s delay between requests automatically.
 */

const fs = require("fs");
const path = require("path");

// ------- config -------
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT =
  "OpenItineraryGeocoder/0.1 (https://github.com/openitinerary/openitinerary)";
const DELAY_MS = 1100; // Nominatim rate limit: 1 req/sec
// ----------------------

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const filePath = args.find((a) => !a.startsWith("--"));

if (!filePath) {
  console.error(
    "Usage: node open-itinerary-geocode.js <file.oitinerary.json> [--dry-run]",
  );
  process.exit(1);
}

const absPath = path.resolve(filePath);
if (!fs.existsSync(absPath)) {
  console.error(`File not found: ${absPath}`);
  process.exit(1);
}

// ---- Nominatim geocode ----
async function geocode(query) {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok)
    throw new Error(`Nominatim error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  if (!data.length) return null;
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---- Process a single location object (mutates in place) ----
async function processLocation(location, label) {
  const query = location.address
    ? `${location.name}, ${location.address}`
    : location.name;

  let result;
  try {
    result = await geocode(query);
  } catch (err) {
    console.warn(`  ⚠  ${label}: geocode failed — ${err.message}`);
    return;
  }

  if (!result) {
    console.warn(`  ⚠  ${label}: no result for "${query}"`);
    return;
  }

  console.log(`  ✓  ${label}: (${result.lat}, ${result.lng})`);

  if (!dryRun) {
    location.coords = {
      lat: result.lat,
      lng: result.lng,
      source: "nominatim",
      geocoded_at: new Date().toISOString(),
    };
  }
}

// ---- Collect all locations from the document ----
function collectLocations(itinerary) {
  const tasks = [];
  for (const stop of itinerary.stops) {
    tasks.push({
      location: stop.location,
      label: stop.id || stop.location.name,
    });
    if (stop.alternatives) {
      for (let i = 0; i < stop.alternatives.length; i++) {
        const alt = stop.alternatives[i];
        tasks.push({
          location: alt.location,
          label: `${stop.id || stop.location.name} › alt[${i}] ${alt.location.name}`,
        });
      }
    }
  }
  return tasks;
}

// ---- Main ----
async function main() {
  const raw = fs.readFileSync(absPath, "utf8");
  const itinerary = JSON.parse(raw);

  if (!itinerary.stops || !Array.isArray(itinerary.stops)) {
    console.error("No stops array found in file.");
    process.exit(1);
  }

  console.log(`\nOpen Itinerary Geocoder${dryRun ? " [DRY RUN]" : ""}`);
  console.log(`File:  ${absPath}`);
  console.log(`Stops: ${itinerary.stops.length}\n`);

  const tasks = collectLocations(itinerary);
  console.log(
    `Geocoding ${tasks.length} location(s) (1 req/sec per Nominatim policy)...\n`,
  );

  for (let i = 0; i < tasks.length; i++) {
    const { location, label } = tasks[i];
    await processLocation(location, label);
    if (i < tasks.length - 1) await sleep(DELAY_MS);
  }

  if (!dryRun) {
    fs.writeFileSync(absPath, JSON.stringify(itinerary, null, 2), "utf8");
    console.log(`\nSaved: ${absPath}`);
  } else {
    console.log("\n[Dry run — file not modified]");
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
