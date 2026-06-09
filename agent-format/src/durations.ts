/**
 * ISO 8601 duration parsing and conversion.
 * The agent format uses ISO 8601 durations (PT2H, PT1H30M).
 * The JSON schema uses { min, max } in decimal hours.
 */

const DUR_RE = /^P(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/;

/** Parse an ISO 8601 duration string to decimal hours. */
export function parseISO8601(dur: string): number {
  const m = dur.match(DUR_RE);
  if (!m) throw new Error(`Invalid ISO 8601 duration: ${dur}`);
  const hours = parseInt(m[1] ?? "0", 10);
  const minutes = parseInt(m[2] ?? "0", 10);
  return hours + minutes / 60;
}

/**
 * Parse a duration string from the agent format.
 * Supports single ("PT2H") and range ("PT1H30M PT2H30M") forms.
 */
export function parseDuration(raw: string): { min: number; max: number } {
  const parts = raw.trim().split(/\s+/);
  if (parts.length === 1) {
    const h = parseISO8601(parts[0]!);
    return { min: h, max: h };
  }
  if (parts.length === 2) {
    return { min: parseISO8601(parts[0]!), max: parseISO8601(parts[1]!) };
  }
  throw new Error(`Invalid duration: ${raw}`);
}

/** Convert decimal hours to an ISO 8601 duration string. */
export function toISO8601(hours: number): string {
  if (hours < 0) throw new Error(`Negative duration: ${hours}`);
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `PT${h}H`;
  if (h === 0) return `PT${m}M`;
  return `PT${h}H${m}M`;
}

/**
 * Serialize a min/max duration to the agent format.
 * Collapses to a single value when min === max.
 */
export function formatDuration(min: number, max: number): string {
  if (min === max) return toISO8601(min);
  return `${toISO8601(min)} ${toISO8601(max)}`;
}
