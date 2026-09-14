import type { Risk, Step } from "./types";

export type Policy = { origins: string[]; actions: Step["action"][]; maxSteps: number; allowRisk: Risk[] };

export const defaultPolicy: Policy = {
  origins: ["http://127.0.0.1:3000"],
  actions: ["goto", "fill", "click", "extract", "wait"],
  maxSteps: 12,
  allowRisk: ["safe"],
};

export function assertAllowed(step: Step, policy: Policy, renderedValue?: string) {
  if (!policy.actions.includes(step.action)) throw new Error(`POLICY_ACTION_BLOCKED:${step.action}`);
  if (!policy.allowRisk.includes(step.risk)) throw new Error(`POLICY_RISK_BLOCKED:${step.risk}`);
  if (step.action === "goto") {
    const url = new URL(renderedValue || "");
    if (!policy.origins.includes(url.origin)) throw new Error(`POLICY_ORIGIN_BLOCKED:${url.origin}`);
  }
}

export function redact(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replace(/\b\d{9}\b/g, "[REDACTED_SSN]")
      .replace(/(?:sk|key|token)-[A-Za-z0-9_-]{12,}/gi, "[REDACTED_SECRET]");
  }
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, /secret|token|password/i.test(k) ? "[REDACTED]" : redact(v)]));
  return value;
}
