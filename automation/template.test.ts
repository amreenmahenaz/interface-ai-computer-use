import assert from "node:assert/strict";
import test from "node:test";
import { redact } from "./policy";
import { render, validateInputs } from "./template";

test("renders typed parameters", () => assert.equal(render("member={{memberId}}", { memberId: "12345" }), "member=12345"));
test("rejects malformed member id", () => assert.throws(() => validateInputs({ memberId: { type: "string", required: true, pattern: "^\\d{5}$" } }, { memberId: "bad" }), /INVALID_INPUT/));
test("redacts regulated and secret-shaped data", () => assert.deepEqual(redact({ ssn: "123456789", token: "secret" }), { ssn: "[REDACTED_SSN]", token: "[REDACTED]" }));
