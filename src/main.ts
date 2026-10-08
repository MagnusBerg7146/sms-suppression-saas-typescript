import { infrai } from "./infrai.js";
import { decideSend, sendRequestSchema } from "./suppression.js";

const parsed = sendRequestSchema.parse({
  tenantId: process.env.DEMO_TENANT ?? "acme",
  accountId: process.env.DEMO_ACCOUNT ?? "acct-42",
  phone: process.env.DEMO_PHONE ?? "+14155550123",
  message: "Your Acme workspace is ready.",
  optedOut: process.env.DEMO_OPTED_OUT === "true",
  suspended: false
});

const decision = decideSend(parsed);
if (!decision.allowed) {
  console.log(`SMS suppressed for ${parsed.accountId}: ${decision.reason}`);
} else {
  const result = await infrai.sms.batch.send(
    { messages: [{ to: parsed.phone, message: parsed.message }] },
    `tenant-${parsed.tenantId}-${parsed.accountId}`
  );
  console.log("SMS accepted:", result);
}
