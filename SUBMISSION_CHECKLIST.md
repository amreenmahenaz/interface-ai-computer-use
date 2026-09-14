# Submission checklist

## Required before sending

- [x] `/README.md` contains setup and exact discovery/replay commands.
- [x] `/REPORT.md` uses all seven required headings.
- [x] `/evidence/` contains a typed capability, discovery log, replay-success log, not-found outcome log, and screenshot.
- [x] Deterministic replay returns typed success, business outcome, intervention, or failure results.
- [x] Safety policy restricts origin, action types, step count, and risk class.
- [x] Interactive replay can transfer the existing live browser session to a human and resume.
- [ ] Replace the offline-fixture discovery log with a genuine OpenAI-backed discovery run.
- [ ] Confirm no secrets or unrelated personal files are staged.
- [ ] Commit the intended source and evidence.
- [ ] Push to a **public GitHub repository**.
- [ ] Run the demo once from a fresh clone.

## Final verification

```bash
npm install
npx playwright install chromium
npm run test:automation
npm run build
npm run dev
```

In a second terminal:

```bash
OPENAI_API_KEY="..." npm run automation -- discover \
  --goal "look up member 12345 and read their current savings balance"

npm run automation -- replay \
  --artifact evidence/member-balance.capability.json --member-id 12345

npm run automation -- replay \
  --artifact evidence/member-balance.capability.json --member-id 99999
```

Verify that the newest discovery JSONL contains `"type":"model_decision"` and `"provider":"openai"`, not `fixture_decision`.

## Email

Send from the address used to apply, to `assignments@interface.ai`. Put the public repository URL on its own line and do not attach a ZIP.

```text
Subject: Computer-Use Automation Take-Home Submission

Hello interface.ai Engineering Team,

Here is my take-home project submission:

https://github.com/YOUR-USERNAME/YOUR-REPOSITORY

Best,
Mahenaz
```
