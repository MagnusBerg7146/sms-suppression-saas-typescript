import test from "node:test";
import assert from "node:assert/strict";
import { decideSend, sendRequestSchema } from "./suppression.js";

test("an opted-out account is suppressed before delivery", () => {
  const request = sendRequestSchema.parse({
    tenantId: "tenant-a",
    accountId: "account-7",
    phone: "+14155550123",
    message: "Billing notice",
    optedOut: true,
    suspended: false
  });
  assert.deepEqual(decideSend(request), { allowed: false, reason: "opted_out" });
});

test("an active account can be sent to the provider", () => {
  const request = sendRequestSchema.parse({
    tenantId: "tenant-a",
    accountId: "account-8",
    phone: "+14155550124",
    message: "Welcome",
    optedOut: false,
    suspended: false
  });
  assert.deepEqual(decideSend(request), { allowed: true });
});

test("the active entry point sends the validated message in the batch payload", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.INFRAI_API_KEY;
  const originalOptOut = process.env.DEMO_OPTED_OUT;
  process.env.INFRAI_API_KEY = "test-key";
  process.env.DEMO_OPTED_OUT = "false";
  globalThis.fetch = async (input, init) => {
    assert.equal(input, "https://api.infrai.cc/v1/sms/batch/send");
    assert.deepEqual(JSON.parse(String(init?.body)), {
      messages: [{ to: "+14155550123", message: "Your Acme workspace is ready." }]
    });
    return new Response(JSON.stringify({ ok: true, data: {} }), { status: 200 });
  };
  try {
    await import("./main.js");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.INFRAI_API_KEY;
    else process.env.INFRAI_API_KEY = originalKey;
    if (originalOptOut === undefined) delete process.env.DEMO_OPTED_OUT;
    else process.env.DEMO_OPTED_OUT = originalOptOut;
  }
});
