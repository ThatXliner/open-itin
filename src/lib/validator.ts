import type { JsonItinerary, JsonDayItem } from '../../agent-format/src/types.js';

interface SchemaMeta {
  required: string[];
  properties: {
    $schema: { const: string };
    [key: string]: unknown;
  };
}

const SCHEMA_META: SchemaMeta = {
  required: ['$schema', 'version', 'name', 'stops', 'days'],
  properties: {
    $schema: { const: 'https://raw.githubusercontent.com/ThatXliner/open-itin/main/open-itin.schema.json' }
  }
};

export function validate(itinerary: JsonItinerary): string[] {
  const errors: string[] = [];

  for (const field of SCHEMA_META.required) {
    if (!(field in itinerary)) errors.push(`Missing required top-level field: "${field}"`);
  }

  if (!itinerary.stops || !Array.isArray(itinerary.stops)) {
    errors.push('"stops" must be an array with at least 1 stop');
  } else if (itinerary.stops.length === 0) {
    errors.push('"stops" must have at least 1 stop');
  } else {
    itinerary.stops.forEach((stop, i) => {
      const label = `stops[${i}] "${stop.name || stop.id || '?'}"`;
      if (!stop.id) errors.push(`${label}: missing required field "id"`);
      if (!stop.name) errors.push(`${label}: missing required field "name"`);
      if (!stop.goal) errors.push(`${label}: missing required field "goal"`);
      if (stop.dur) {
        if (typeof stop.dur !== 'object' || Array.isArray(stop.dur))
          errors.push(`${label}: "dur" must be an object with min/max`);
        else {
          if (stop.dur.min !== undefined && typeof stop.dur.min !== 'number')
            errors.push(`${label}: dur.min must be a number`);
          if (stop.dur.max !== undefined && typeof stop.dur.max !== 'number')
            errors.push(`${label}: dur.max must be a number`);
        }
      }
      if (stop.coords) {
        if (!stop.coords.source) errors.push(`${label}: coords.source is required`);
        if (typeof stop.coords.lat !== 'number') errors.push(`${label}: coords.lat must be a number`);
        if (typeof stop.coords.lng !== 'number') errors.push(`${label}: coords.lng must be a number`);
      }
      if (stop.alts) {
        if (!Array.isArray(stop.alts)) {
          errors.push(`${label}: "alts" must be an array`);
        } else {
          stop.alts.forEach((alt, j) => {
            if (!alt.name) errors.push(`${label} alts[${j}]: missing "name"`);
            if (!alt.goal) errors.push(`${label} alts[${j}]: missing "goal"`);
          });
        }
      }
    });
  }

  if (itinerary.routes && Array.isArray(itinerary.routes)) {
    itinerary.routes.forEach((route, i) => {
      const label = `routes[${i}] "${route.id || '?'}"`;
      if (!route.id) errors.push(`${label}: missing "id"`);
      if (!route.from) errors.push(`${label}: missing "from"`);
      if (!route.to) errors.push(`${label}: missing "to"`);
      if (!route.mode) errors.push(`${label}: missing "mode"`);
    });
  }

  if (!itinerary.days || !Array.isArray(itinerary.days)) {
    errors.push('"days" must be an array with at least 1 day');
  } else if (itinerary.days.length === 0) {
    errors.push('"days" must have at least 1 day');
  } else {
    itinerary.days.forEach((day, i) => {
      const label = `days[${i}] "${day.date || '?'}"`;
      if (!day.date) errors.push(`${label}: missing "date"`);
      if (day.items && Array.isArray(day.items)) {
        day.items.forEach((item: JsonDayItem, j: number) => {
          if (!item.type) errors.push(`${label} items[${j}]: missing "type"`);
          else if (item.type === 'stop' || item.type === 'route') {
            if (!(item as { ref?: string }).ref) errors.push(`${label} items[${j}]: "${item.type}" item missing "ref"`);
          } else if (item.type === 'note') {
            if (!(item as { txt?: string }).txt) errors.push(`${label} items[${j}]: "note" item missing "txt"`);
          } else if (item.type === 'flex') {
            if (!Array.isArray((item as { opts?: unknown[] }).opts)) errors.push(`${label} items[${j}]: "flex" item missing "opts" array`);
          } else {
            errors.push(`${label} items[${j}]: unknown type "${(item as { type: string }).type}"`);
          }
        });
      }
    });
  }

  if (itinerary.$schema && itinerary.$schema !== SCHEMA_META.properties.$schema.const) {
    errors.push(`"$schema" should be "${SCHEMA_META.properties.$schema.const}"`);
  }

  return errors;
}
