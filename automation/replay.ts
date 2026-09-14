import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Capability, RunResult, Step } from "./types";
import { defaultPolicy, assertAllowed, type Policy } from "./policy";
import { RunLogger } from "./logger";
import { render, validateInputs } from "./template";
import { WebSurface } from "./surface";
import { transferToHuman } from "./handoff";

const id = () => `replay-${new Date().toISOString().replace(/[:.]/g, "-")}`;

export async function replay(capability: Capability, inputs: Record<string, unknown>, options: { policy?: Policy; headless?: boolean; interactive?: boolean } = {}): Promise<RunResult> {
  const runId = id(); const log = new RunLogger(runId); const surface = new WebSurface();
  let current: Step | undefined;
  try {
    validateInputs(capability.inputs, inputs);
    if (capability.steps.length > (options.policy || defaultPolicy).maxSteps) throw new Error("POLICY_MAX_STEPS");
    await surface.start(options.headless ?? true);
    await log.event("run_started", { capability: capability.id, inputs: Object.keys(inputs) });
    const outputs: Record<string, unknown> = {};
    for (current of capability.steps) {
      const value = render(current.value, inputs);
      try { assertAllowed(current, options.policy || defaultPolicy, value); }
      catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        if (!reason.startsWith("POLICY_RISK_BLOCKED") || !options.interactive) throw error;
        await transferToHuman(surface, log, { runId, reason, capability: capability.id, stepId: current.id });
        await log.event("step_completed_by_human", { action: current.action }, current.id);
        continue;
      }
      await log.event("step_started", { action: current.action, risk: current.risk, target: current.target }, current.id);
      for (const outcome of capability.outcomes) {
        if (await surface.locate(outcome.target).then(x => x.isVisible()).catch(() => false)) {
          await log.event("business_outcome", { code: outcome.code }, current.id);
          return { status: "business_outcome", code: outcome.code, message: outcome.message, runId };
        }
      }
      const target = current.target ? await surface.locate(current.target) : undefined;
      if (current.action === "goto") await surface.page!.goto(value, { waitUntil: "domcontentloaded" });
      if (current.action === "fill") await target!.fill(value);
      if (current.action === "click") await target!.click();
      if (current.action === "wait") await surface.page!.waitForTimeout(Number(value));
      if (current.action === "extract") outputs[current.output!] = (await target!.textContent())?.trim() || "";
      if (current.expect?.kind === "visible") await (await surface.locate(current.expect.target!)).waitFor({ state: "visible" });
      await log.event("step_completed", { action: current.action }, current.id);
    }
    const checkpoint = capability.checkpoint;
    if (checkpoint.kind === "visible" && !(await surface.locate(checkpoint.target!).then(x => x.isVisible()))) throw new Error("CHECKPOINT_FAILED");
    await log.event("run_succeeded", { outputNames: Object.keys(outputs) });
    return { status: "success", outputs, runId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await mkdir("evidence/failures", { recursive: true });
    const evidence = path.join("evidence/failures", `${runId}.png`);
    await surface.screenshot(evidence).catch(() => undefined);
    await log.event("run_failed", { error: message, evidence }, current?.id);
    const policyBlock = message.startsWith("POLICY_RISK_BLOCKED");
    if (policyBlock) {
      const interventionId = `int-${runId}`;
      await mkdir("evidence/interventions", { recursive: true });
      await import("node:fs/promises").then(fs => fs.writeFile(path.join("evidence/interventions", `${interventionId}.json`), JSON.stringify({ interventionId, runId, capability: capability.id, stepId: current?.id, reason: message, controlOwner: "human_pending", evidence }, null, 2)));
      await log.event("intervention_requested", { interventionId, reason: message }, current?.id);
      return { status: "intervention_required", interventionId, reason: message, runId };
    }
    return { status: "failure", code: message.split(":")[0], stepId: current?.id, expected: current?.expect?.kind, observed: message, evidence, runId };
  } finally { await surface.close(); }
}
