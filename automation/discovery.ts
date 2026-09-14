import OpenAI from "openai";
import { mkdir, writeFile } from "node:fs/promises";
import type { Capability, Step } from "./types";
import { RunLogger } from "./logger";
import { defaultPolicy, assertAllowed } from "./policy";
import { WebSurface } from "./surface";

type Decision = Pick<Step, "action" | "target" | "value" | "risk"> & { done?: boolean; rationale: string };

async function decide(goal: string, observation: string, history: Decision[]): Promise<Decision> {
  if (!process.env.OPENAI_API_KEY) {
    if (!history.length) return { action: "fill", target: { label: "Member number" }, value: goal.match(/\d{5}/)?.[0] || "12345", risk: "safe", rationale: "Enter the member identifier from the goal." };
    if (history.length === 1) return { action: "click", target: { role: "button", name: "Find member" }, risk: "safe", rationale: "Submit the lookup form." };
    return { action: "extract", target: { label: "Savings balance" }, risk: "safe", done: true, rationale: "The requested balance is visible." };
  }
  const client = new OpenAI();
  const response = await client.responses.create({ model: process.env.OPENAI_MODEL || "gpt-5-mini", input: `You operate a bank demo UI. Goal: ${goal}\nAccessibility snapshot:\n${observation}\nHistory:${JSON.stringify(history)}\nReturn one safe action as JSON with action(fill|click|extract), target(label or role+name), optional value, risk=safe, rationale, and done.` });
  return JSON.parse(response.output_text) as Decision;
}

export async function discover(goal: string, target = "http://127.0.0.1:3000/legacy", artifactFile = "evidence/member-balance.capability.json") {
  const runId = `discovery-${new Date().toISOString().replace(/[:.]/g, "-")}`; const log = new RunLogger(runId); const surface = await new WebSurface().start(true);
  const steps: Step[] = [{ id: "open", action: "goto", value: target, risk: "safe" }]; const history: Decision[] = [];
  const deadline = Date.now() + 30_000; let finished = false;
  try {
    assertAllowed(steps[0], defaultPolicy, target); await surface.page!.goto(target); await log.event("step_completed", { action: "goto" }, "open");
    for (let i = 0; i < 6; i++) {
      if (Date.now() > deadline) throw new Error("DISCOVERY_TIMEOUT");
      const observation = await surface.observe(); const decision = await decide(goal, observation, history); history.push(decision);
      await log.event(process.env.OPENAI_API_KEY ? "model_decision" : "fixture_decision", { rationale: decision.rationale, action: decision.action, observationLength: observation.length, provider: process.env.OPENAI_API_KEY ? "openai" : "offline-fixture" }, `discover-${i + 1}`);
      const step: Step = { id: `step-${i + 1}`, action: decision.action, target: decision.target, value: decision.value === (goal.match(/\d{5}/)?.[0] || "12345") ? "{{memberId}}" : decision.value, output: decision.action === "extract" ? "savingsBalance" : undefined, risk: decision.risk };
      assertAllowed(step, defaultPolicy); const locator = step.target ? await surface.locate(step.target) : undefined;
      if (step.action === "fill") await locator!.fill(decision.value || "");
      if (step.action === "click") await locator!.click();
      if (step.action === "extract") await locator!.textContent();
      steps.push(step); await log.event("step_completed", { action: step.action }, step.id);
      if (decision.done) { finished = true; break; }
    }
    const capability: Capability = { schemaVersion: "1.0", id: "legacy.member.read-savings", name: "Read member savings balance", description: "Looks up a member and returns the displayed savings balance.", app: { family: "legacy-credit-union-demo", version: "1.x", entrypoint: target }, approval: "draft", inputs: { memberId: { type: "string", required: true, sensitive: true, pattern: "^\\d{5}$" } }, outputs: { savingsBalance: { type: "string", sensitive: true } }, steps, checkpoint: { kind: "visible", target: { label: "Savings balance" } }, outcomes: [{ code: "MEMBER_NOT_FOUND", target: { text: "No member found" }, message: "No member exists for the supplied identifier." }] };
    if (!finished) throw new Error("DISCOVERY_MAX_STEPS");
    if (!steps.some(step => step.action === "extract" && step.output === "savingsBalance")) throw new Error("DISCOVERY_OUTPUT_NOT_CAPTURED");
    const checkpoint = await surface.locate(capability.checkpoint.target!);
    if (!(await checkpoint.isVisible())) throw new Error("DISCOVERY_CHECKPOINT_FAILED");
    await log.event("checkpoint_verified", { kind: capability.checkpoint.kind });
    await mkdir("evidence", { recursive: true }); await writeFile(artifactFile, JSON.stringify(capability, null, 2)); await surface.screenshot("evidence/discovery-success.png"); await log.event("artifact_saved", { artifactFile });
    return { capability, runId };
  } finally { await surface.close(); }
}
