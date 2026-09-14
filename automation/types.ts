export type PrimitiveType = "string" | "number" | "boolean";
export type Risk = "safe" | "risky" | "irreversible";

export type Locator = {
  role?: string;
  name?: string;
  label?: string;
  text?: string;
  css?: string;
  fallbacks?: Locator[];
};

export type Step = {
  id: string;
  action: "goto" | "fill" | "click" | "extract" | "wait";
  target?: Locator;
  value?: string;
  output?: string;
  risk: Risk;
  retries?: number;
  expect?: { kind: "visible" | "url" | "text"; target?: Locator; value?: string };
};

export type Capability = {
  schemaVersion: "1.0";
  id: string;
  name: string;
  description: string;
  app: { family: string; version: string; entrypoint: string };
  approval: "draft" | "approved";
  inputs: Record<string, { type: PrimitiveType; required: boolean; sensitive?: boolean; pattern?: string }>;
  outputs: Record<string, { type: PrimitiveType; sensitive?: boolean }>;
  steps: Step[];
  checkpoint: { kind: "visible" | "url" | "text"; target?: Locator; value?: string };
  outcomes: Array<{ code: string; target: Locator; message: string }>;
};

export type RunResult =
  | { status: "success"; outputs: Record<string, unknown>; runId: string }
  | { status: "business_outcome"; code: string; message: string; runId: string }
  | { status: "intervention_required"; interventionId: string; reason: string; runId: string }
  | { status: "failure"; code: string; stepId?: string; expected?: string; observed?: string; evidence?: string; runId: string };

export type Event = { at: string; runId: string; type: string; stepId?: string; detail: Record<string, unknown> };
