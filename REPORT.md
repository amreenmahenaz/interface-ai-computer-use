# 1. Architecture

The system has four narrow parts: a `Surface` adapter observes and acts; a discovery policy chooses one action from an accessibility snapshot; a recorder converts successful actions into a model-independent capability; and a replay executor interprets that capability. Policy checks and structured evidence wrap both paths. Discovery is replaceable, while reviewed capabilities remain stable.

The local Next.js route is a safe proxy for a core-banking screen: table-based, delayed, and without test IDs. Playwright provides a real browser session and accessibility-first targeting. Discovery is bounded to six steps. With `OPENAI_API_KEY`, the model receives the goal, snapshot, and compact history and returns one decision. The offline planner lets reviewers run mechanics without paid services; it is not represented as a genuine model run.

# 2. Artifact schema

`Capability` declares schema version, identity, vendor family/version, typed inputs and outputs, approval state, ordered typed steps, known business outcomes, and a checkpoint. Values such as `{{memberId}}` are late-bound. Locators prefer accessibility role/name or label, may carry ordered fallbacks, and allow CSS only as a last resort. The artifact says what control is intended; the surface adapter decides how to resolve it.

Sensitive fields are metadata for a future vault/tokenization layer. Production loading should validate JSON against a generated schema and reject unknown major versions.

# 3. Determinism & error handling

Replay never calls the decision policy. It validates inputs, renders parameters, policy-checks every action, resolves candidates in fixed order, uses Playwright actionability, extracts outputs, and verifies the checkpoint. Its result is `success`, `business_outcome`, `intervention_required`, or `failure`. “No member found” is a business outcome. Invalid invocation data fails before browser launch. Risk blocks become interventions. Other errors report step, expectation, observation, and screenshot.

Retries are represented but deliberately not executed: blind retry can duplicate side effects. Production retry policy would permit only idempotent reads and recognized transient states. Dialog, timeout, permission, and session-expiry detectors would be vendor-profile rules evaluated between steps, parallel to the demonstrated not-found detector.

# 4. Heterogeneity & multi-tenant

The seam is `Surface`: web maps abstract locators to Playwright; desktop adapters could map role/name to Windows UI Automation or macOS Accessibility; vision could map them to grounded regions. The capability vocabulary remains stable.

Capabilities should belong to a vendor family and compatible version range, with tenant overlays for route, vocabulary, and locator overrides. Selection would fingerprint shell text, landmarks, and application version, run a read-only canary, and refuse unattended use below a confidence threshold. Telemetry by capability/vendor/overlay detects drift. Signed narrow overlays preserve local differences without hundreds of copied flows.

# 5. Escalation & handoff

A policy block or unrecoverable state returns an intervention with run, step, reason, state evidence, and screenshot. `replay --interactive` demonstrates the seam with a real headed browser: the replay pauses at a risky step, ownership changes to `human`, the operator acts in that same page/context, Enter signals resume, and ownership returns to automation. Transfers, intervention context, and the post-human URL are logged. The standalone `handoff` command exercises the same ownership primitive for demonstration.

In deployment, the browser context would live in a session worker with a short-lived authenticated operator link. A compare-and-swap lease would ensure one controller acts. Human input events would be captured by the gateway, not inferred from the page.

# 6. Safety

Default policy allows only localhost, five actions, twelve steps, and `safe` actions. The visible destructive “Close account” control is unusable unless policy changes. Irreversible actions should require an expiring human approval bound to artifact hash and invocation inputs.

Logs retain parameter names, rationales, controls, and output names—not sensitive values. Redaction catches secret keys, tokens, and nine-digit SSNs. Production still needs encryption, tenant retention, audited vault references, regional controls, and screenshot redaction; screenshots must be treated as sensitive evidence.

# 7. Cuts

This slice omits queues, authentication, a polished operator console, desktop/vision implementations, artifact signing, migrations, and automated overlays. Conservative retry execution is deferred. Next: schema validation plus signed approvals, vendor exception rules, screenshot redaction, and a leased session worker. Then test a second branded variant and repeated canaries to measure stability.
