#!/usr/bin/env python3
"""
Open Itinerary Geocoder

Geocodes every location in a .oitinerary.json file using Nominatim (OpenStreetMap)
and writes coordinates into the `coords` field.

`name` (and optionally `addr`) is the source of truth.
`coords` is always treated as a derived cache — this script unconditionally overwrites it.

Usage:
  python geocode.py <file.oitinerary.json>
  python geocode.py <file.oitinerary.json> --dry-run

Nominatim usage policy: 1 request/second max, no bulk usage.
This script enforces a 1.2s delay between requests automatically.
"""

import json
import sys
import time
import urllib.request
import urllib.parse
from pathlib import Path

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "OpenItineraryGeocoder/0.2 (https://github.com/openitinerary/openitinerary)"
DELAY_S = 1.2


def geocode(query: str) -> dict | None:
    """Query Nominatim and return {lat, lng} or None."""
    params = urllib.parse.urlencode({"q": query, "format": "json", "limit": 1})
    url = f"{NOMINATIM_URL}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
    except Exception as e:
        print(f"  !  geocode failed: {e}")
        return None
    if not data:
        return None
    return {"lat": float(data[0]["lat"]), "lng": float(data[0]["lon"])}


def collect_locations(itinerary: dict) -> list[tuple[dict, str]]:
    """Return list of (location_dict, label) for geocoding."""
    tasks = []
    for stop in itinerary.get("stops", []):
        label = stop.get("id", stop.get("name", "?"))
        tasks.append((stop, label))
        for i, alt in enumerate(stop.get("alts", [])):
            tasks.append((alt, f"{label} > alt[{i}] {alt.get('name', '?')}"))
    return tasks


def process_location(loc: dict, label: str, dry_run: bool):
    """Geocode a single location dict, mutating in place if not dry run."""
    query = f"{loc.get('name', '')}, {loc.get('addr', '')}" if loc.get("addr") else loc.get("name", "")
    result = geocode(query)
    if result is None:
        print(f"  !  {label}: no result for \"{query}\"")
        return
    print(f"  OK {label}: ({result['lat']}, {result['lng']})")
    if not dry_run:
        loc["coords"] = {
            "lat": result["lat"],
            "lng": result["lng"],
            "source": "nominatim",
            "geocoded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry_run = "--dry-run" in sys.argv

    if not args:
        print("Usage: python geocode.py <file.oitinerary.json> [--dry-run]")
        sys.exit(1)

    path = Path(args[0])
    if not path.exists():
        print(f"File not found: {path}")
        sys.exit(1)

    itinerary = json.loads(path.read_text())

    if "stops" not in itinerary or not isinstance(itinerary["stops"], list):
        print("Error: no stops array found in file.")
        sys.exit(1)

    tasks = collect_locations(itinerary)

    print(f"\nOpen Itinerary Geocoder{' [DRY RUN]' if dry_run else ''}")
    print(f"File:  {path.resolve()}")
    print(f"Stops: {len(itinerary['stops'])}")
    print(f"\nGeocoding {len(tasks)} location(s) (1 req/1.2s per Nominatim policy)...\n")

    for i, (loc, label) in enumerate(tasks):
        process_location(loc, label, dry_run)
        if i < len(tasks) - 1:
            time.sleep(DELAY_S)

    if not dry_run:
        path.write_text(json.dumps(itinerary, indent=2, ensure_ascii=False) + "\n")
        print(f"\nSaved: {path}")
    else:
        print("\n[Dry run — file not modified]")

    print("Done.")


if __name__ == "__main__":
    main()
