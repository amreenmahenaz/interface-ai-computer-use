import { mkdir, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { RunLogger } from "./logger";
import { WebSurface } from "./surface";

export async function transferToHuman(surface: WebSurface, log: RunLogger, context: { runId: string; reason: string; capability?: string; stepId?: string }) {
  const interventionId = `int-${Date.now()}`;
  await mkdir("evidence/interventions", { recursive: true });
  await surface.screenshot(`evidence/interventions/${interventionId}.png`);
  await writeFile(`evidence/interventions/${interventionId}.json`, JSON.stringify({ interventionId, ...context, controlOwner: "human", url: surface.page!.url(), createdAt: new Date().toISOString() }, null, 2));
  await log.event("intervention_requested", { interventionId, reason: context.reason, capability: context.capability, stepId: context.stepId });
  await log.event("control_transferred", { from: "automation", to: "human", interventionId });
  const prompt = createInterface({ input: stdin, output: stdout });
  await prompt.question("Operator has control of the live browser. Complete the step, then press Enter to return control. "); prompt.close();
  await log.event("human_action_summary", { note: "Operator interacted directly with shared Playwright session", url: surface.page!.url() });
  await log.event("control_transferred", { from: "human", to: "automation", interventionId });
  const observation = await surface.observe();
  return { status: "resumed", interventionId, observation };
}

export async function humanHandoff(url: string, reason: string) {
  const runId = `handoff-${Date.now()}`; const log = new RunLogger(runId);
  const surface = await new WebSurface().start(false);
  try { await surface.page!.goto(url); return await transferToHuman(surface, log, { runId, reason }); }
  finally { await surface.close(); }
}
