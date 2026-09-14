import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { Event } from "./types";
import { redact } from "./policy";

export class RunLogger {
  readonly file: string;
  constructor(private runId: string, directory = "evidence/runs") {
    this.file = path.join(directory, `${runId}.jsonl`);
  }
  async event(type: string, detail: Record<string, unknown> = {}, stepId?: string) {
    await mkdir(path.dirname(this.file), { recursive: true });
    const event: Event = { at: new Date().toISOString(), runId: this.runId, type, stepId, detail: redact(detail) as Record<string, unknown> };
    await appendFile(this.file, JSON.stringify(event) + "\n");
  }
}
