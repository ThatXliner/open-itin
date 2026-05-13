import type { JsonItinerary } from '../../agent-format/src/types.js';
import { parse, ParseError } from '../../agent-format/src/kdl.js';
import { toJSON } from '../../agent-format/src/convert.js';

export function detectFormat(input: string): 'json' | 'kdl' | 'unknown' {
  const trimmed = input.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  if (/^itinerary\s/.test(trimmed)) return 'kdl';
  return 'unknown';
}

export function parseInput(input: string): JsonItinerary {
  const fmt = detectFormat(input);
  if (fmt === 'json') return JSON.parse(input) as JsonItinerary;
  if (fmt === 'kdl') {
    const itinerary = parse(input);
    return toJSON(itinerary) as unknown as JsonItinerary;
  }
  throw new Error('Unrecognized format. Paste JSON (starting with {) or KDL (starting with "itinerary").');
}

export { ParseError };
