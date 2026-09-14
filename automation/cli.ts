import { readFile } from "node:fs/promises";
import { discover } from "./discovery";
import { replay } from "./replay";
import { humanHandoff } from "./handoff";
import type { Capability } from "./types";

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const value = (flag: string, fallback?: string) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : fallback; };
  if (command === "discover") {
    const goal = value("--goal", "look up member 12345 and read their current savings balance")!;
    console.log(JSON.stringify(await discover(goal, value("--target") || undefined), null, 2));
  } else if (command === "replay") {
    const file = value("--artifact", "evidence/member-balance.capability.json")!;
    const capability = JSON.parse(await readFile(file, "utf8")) as Capability;
    const interactive = args.includes("--interactive");
    console.log(JSON.stringify(await replay(capability, { memberId: value("--member-id", "12345")! }, { headless: !(args.includes("--headed") || interactive), interactive }), null, 2));
  } else if (command === "handoff") {
    console.log(JSON.stringify(await humanHandoff(value("--target", "http://127.0.0.1:3000/legacy")!, value("--reason", "Operator confirmation required")!), null, 2));
  } else {
    console.error("Usage: npm run automation -- discover|replay|handoff [options]"); process.exitCode = 2;
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
