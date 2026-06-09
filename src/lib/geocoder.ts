import type { JsonItinerary, JsonStop } from '../../agent-format/src/types.js';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

export interface GeocodeResult {
  stopId: string;
  name: string;
  coords?: { lat: number; lng: number; source: string; geocoded_at: string };
  error?: string;
}

export async function geocodeStops(data: JsonItinerary, onProgress?: (result: GeocodeResult) => void): Promise<void> {
  const stops: (JsonStop & { index: number })[] = (data.stops || [])
    .map((s, i) => ({ ...s, index: i }))
    .filter(s => !s.coords && !!s.name);

  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    const query = s.addr ? `${s.name}, ${s.addr}` : s.name;

    try {
      const url = `${NOMINATIM}?q=${encodeURIComponent(query)}&format=json&limit=1`;
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'open-itin-validator/0.2 (open-itin-demo)' }
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const results = await resp.json();
      if (results.length > 0) {
        const coords = {
          lat: parseFloat(results[0].lat),
          lng: parseFloat(results[0].lon),
          source: 'nominatim',
          geocoded_at: new Date().toISOString()
        };
        data.stops[s.index].coords = coords;
        onProgress?.({ stopId: s.id, name: s.name, coords });
      } else {
        onProgress?.({ stopId: s.id, name: s.name, error: 'no results' });
      }
    } catch (e) {
      onProgress?.({ stopId: s.id, name: s.name, error: (e as Error).message });
    }

    if (i < stops.length - 1) {
      await new Promise(r => setTimeout(r, 1200));
    }
  }
}
