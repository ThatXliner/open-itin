import type { JsonStop } from '../../agent-format/src/types.js';

export const catColors: Record<string, string> = {
  accommodation: '#f59e0b', food: '#ef4444', drink: '#8b5cf6',
  attraction: '#3b82f6', nature: '#10b981', viewpoint: '#06b6d4',
  transport: '#6b7280', rest: '#f97316', shopping: '#ec4899',
  activity: '#14b8a6', other: '#9ca3af'
};

export const catLabels: Record<string, string> = {
  accommodation: 'Hotel', food: 'Food', drink: 'Drink', attraction: 'Attraction',
  nature: 'Nature', viewpoint: 'Viewpoint', transport: 'Transit', rest: 'Rest',
  shopping: 'Shopping', activity: 'Activity', other: 'Other'
};

export const modeLabels: Record<string, string> = {
  drive: 'Drive', fly: 'Fly', train: 'Train', bus: 'Bus', walk: 'Walk',
  bike: 'Bike', transit: 'Transit', ferry: 'Ferry', other: 'Other'
};

export function stopName(stop: JsonStop): string {
  return stop.name || stop.id || 'Unknown';
}

export function durStr(d: { min?: number; max?: number } | undefined): string {
  if (!d) return '';
  const parts: string[] = [];
  if (d.min !== undefined) parts.push(`${d.min}h`);
  if (d.max !== undefined && d.max !== d.min) parts.push(`–${d.max}h`);
  return parts.join('');
}
