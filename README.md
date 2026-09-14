
# Legacy UI Capability Recorder

A focused computer-use automation system for the interface.ai engineering take-home. An LLM-driven discovery loop operates a deliberately legacy-styled member-servicing UI, saves a typed capability, and a separate deterministic executor replays it without a model. The original crypto dashboard remains available at `/`.

## Setup and run

Requires Node 20+.

```bash
npm install
npx playwright install chromium
npm run dev
```

In a second terminal, run the exact demo path:

```bash
# Real model discovery (recommended)
OPENAI_API_KEY=... npm run automation -- discover --goal "look up member 12345 and read their current savings balance"

# Deterministic replay: no model call
npm run automation -- replay --artifact evidence/member-balance.capability.json --member-id 12345

# Expected business outcome, not a crash
npm run automation -- replay --artifact evidence/member-balance.capability.json --member-id 99999

# Same-session human control transfer (opens a browser)
npm run automation -- handoff --reason "confirmation required"

# A risky replay step can transfer its own live session to the operator
npm run automation -- replay --artifact path/to/risky-capability.json --member-id 12345 --interactive
```

Without an API key, discovery uses a deterministic fixture planner through the same observe/decide/act boundary. It is for local evaluation and is not claimed as LLM evidence. Set `OPENAI_MODEL` to override `gpt-5-mini`.

The demo application is at `http://127.0.0.1:3000/legacy`. It uses labels and roles but intentionally has table layout, no test IDs, and delayed host results. Only synthetic records `12345` and `54321` exist.

## Architecture map

- `automation/discovery.ts`: bounded observe → decide → policy check → act loop.
- `automation/types.ts`: capability and discriminated run-result contracts.
- `automation/replay.ts`: deterministic execution, outcomes, checkpoints, failure evidence.
- `automation/surface.ts`: driver seam; artifacts do not contain Playwright code.
- `automation/policy.ts`: origin/action/risk allowlist and recursive redaction.
- `automation/handoff.ts`: shared-session ownership transfer and resume signal.
- `evidence/`: saved artifact, JSONL logs, and screenshots from executed runs.

## Verification

```bash
npm run test:automation
npm run build
```

Artifacts default to `draft`; production would require review and promotion to `approved`. The demo executor permits only safe actions and localhost. Secrets and full SSNs are redacted, while sensitive values are omitted from logs. See [REPORT.md](REPORT.md) for decisions and limits.

