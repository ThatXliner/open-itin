#!/usr/bin/env bun

import { readFileSync, writeFileSync } from "node:fs";
import { parse, format } from "./kdl.js";
import { toJSON, fromJSON } from "./convert.js";
import { compareStrings } from "./tokens.js";
import type { JsonItinerary } from "./types.js";

const args = process.argv.slice(2);
const cmd = args[0];
const file = args[1];

function usage(): never {
  console.log(`Open Itinerary KDL — CLI

Usage: bun cli.ts <command> <file>

Commands:
  parse <file>       Parse .oitinerary.kdl → print AST
  to-json <file>     Convert .oitinerary.kdl → JSON
  from-json <file>   Convert JSON → .oitinerary.kdl
  tokens <file>      Compare token counts (KDL vs JSON)
  validate <file>    Parse and report errors`);
  process.exit(1);
}

if (!cmd || !file) usage();

const input = readFileSync(file, "utf-8");

switch (cmd) {
  case "parse": {
    const it = parse(input);
    console.log(JSON.stringify(it, null, 2));
    break;
  }

  case "to-json": {
    const it = parse(input);
    const json = toJSON(it);
    const outFile = file.replace(/\.kdl$/, "").replace(/\.oitinerary$/, "") + ".json";
    writeFileSync(outFile, JSON.stringify(json, null, 2) + "\n");
    console.log(`Wrote ${outFile}`);
    break;
  }

  case "from-json": {
    const json: JsonItinerary = JSON.parse(input);
    const it = fromJSON(json);
    const outFile = file.replace(/\.json$/, "") + ".oitinerary.kdl";
    writeFileSync(outFile, format(it));
    console.log(`Wrote ${outFile}`);
    break;
  }

  case "tokens": {
    let jsonStr: string, kdlStr: string;
    if (file.endsWith(".kdl")) {
      const it = parse(input);
      kdlStr = format(it);
      jsonStr = JSON.stringify(toJSON(it), null, 2);
    } else {
      const json: JsonItinerary = JSON.parse(input);
      jsonStr = JSON.stringify(json, null, 2);
      const it = fromJSON(json);
      kdlStr = format(it);
    }

    const c = compareStrings(jsonStr, kdlStr);
    console.log(`JSON tokens:  ${c.jsonTokens}`);
    console.log(`KDL tokens:   ${c.agentTokens}`);
    console.log(`Savings:      ${c.savings} tokens (${c.savingsPct.toFixed(1)}%)`);
    break;
  }

  case "validate": {
    try {
      parse(input);
      console.log("OK");
    } catch (e: any) {
      console.error(e.message);
      if (e.name === "ParseError") process.exit(1);
      throw e;
    }
    break;
  }

  default:
    console.error(`Unknown command: ${cmd}`);
    usage();
}
