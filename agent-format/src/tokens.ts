import { getEncoding } from "js-tiktoken";
import type { Itinerary } from "./types.js";
import { format } from "./kdl.js";
import { toJSON } from "./convert.js";

const enc = getEncoding("cl100k_base");

export function countTokens(text: string): number {
  return enc.encode(text).length;
}

export interface TokenComparison {
  jsonTokens: number;
  agentTokens: number;
  savings: number;   // absolute savings
  savingsPct: number; // percentage (0-100)
  breakdown: TokenBreakdown;
}

export interface TokenBreakdown {
  jsonKeys: number;
  jsonBraces: number;
  jsonQuotes: number;
  jsonColonsCommas: number;
  jsonWhitespace: number;
}

export function compare(it: Itinerary): TokenComparison {
  const jsonText = JSON.stringify(toJSON(it), null, 2);
  const agentText = format(it);

  const jsonTokens = countTokens(jsonText);
  const agentTokens = countTokens(agentText);
  const savings = jsonTokens - agentTokens;
  const savingsPct = jsonTokens > 0 ? (savings / jsonTokens) * 100 : 0;

  // Estimate breakdown of JSON overhead
  const breakdown = breakdownOverhead(jsonText);

  return { jsonTokens, agentTokens, savings, savingsPct, breakdown };
}

function breakdownOverhead(json: string): TokenBreakdown {
  // Count structural characters
  let jsonKeys = 0, jsonBraces = 0, jsonQuotes = 0, jsonColonsCommas = 0, jsonWhitespace = 0;

  for (const ch of json) {
    if (ch === '"') jsonQuotes++;
    else if (ch === "{" || ch === "}" || ch === "[" || ch === "]") jsonBraces++;
    else if (ch === ":" || ch === ",") jsonColonsCommas++;
    else if (ch === " " || ch === "\n" || ch === "\t") jsonWhitespace++;
  }

  // Estimate key tokens: each key is roughly 1-2 tokens, quotes were counted separately
  const keyMatches = json.match(/"([a-z_$]+)":/g);
  if (keyMatches) {
    for (const m of keyMatches) {
      const key = m.replace(/[":]/g, "");
      jsonKeys += enc.encode(key).length;
    }
  }

  return { jsonKeys, jsonBraces, jsonQuotes, jsonColonsCommas, jsonWhitespace };
}

/** Standalone comparison of two text strings (for CLI use). */
export function compareStrings(jsonStr: string, agentStr: string): { jsonTokens: number; agentTokens: number; savings: number; savingsPct: number } {
  const jsonTokens = countTokens(jsonStr);
  const agentTokens = countTokens(agentStr);
  const savings = jsonTokens - agentTokens;
  const savingsPct = jsonTokens > 0 ? (savings / jsonTokens) * 100 : 0;
  return { jsonTokens, agentTokens, savings, savingsPct };
}
