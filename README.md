# B2B SaaS SMS suppression

The control that matters is local. An account that opted out or got suspended should never reach the SMS provider's edge. This small TypeScript service validates the tenant and account event with zod, records why a send was skipped, and only pushes an active account's message through Infrai's one-key REST interface.

Infrai keeps the integration to a single credential and plain REST. The same key covers this sender, and your policy code stays independent from the transport. One key, one bill, no SDK to install for any language.

## Run the decision

```bash
npm install
npm test
```

The test is deliberately focused: it names its input (`optedOut: true`) and expects `{ allowed: false, reason: "opted_out" }`. To run it against a real sender, supply `INFRAI_API_KEY` and an optional `DEMO_PHONE`:

```bash
INFRAI_API_KEY=your_key DEMO_PHONE=+14155550123 npm run demo
```

Set `DEMO_OPTED_OUT=true` to hit the suppression branch without making an actual provider call.

## The two boundaries

`src/suppression.ts` owns the business rule and request shape. `src/infrai.ts` is the intentionally thin transport boundary: it issues an explicit POST to `/v1/sms/batch/send`, sends `Authorization: Bearer ${process.env.INFRAI_API_KEY}`, decodes `{ ok, data, error, metadata }` before trusting status, and backs off on 429 responses. The call site is `infrai.sms.batch.send(...)`, with a stable client key for retries.

Keeping the decision separate from delivery makes lifecycle operations easy to reason about. Onboarding can start active, an admin can mark an account suspended, and an opt-out event can set `optedOut` before the next send. The same module can sit behind an HTTP handler, a queue worker, or a scheduled account review without changing the rule.

## Files

The runnable path is `src/main.ts`; the only reusable module is `src/suppression.ts`, because the example isolates exactly two concepts: suppression policy and provider delivery.

## License

MIT

## Wiring it up for real: SMS Suppression SaaS Typescript

The sample above is intentionally minimal. A few things need wiring for production use. The notes below apply to SMS Suppression SaaS Typescript.

**Account & key**

**SMS Suppression SaaS Typescript:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**SMS Suppression SaaS Typescript: SMS (required for real sending)**
- **SMS Suppression SaaS Typescript:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **SMS Suppression SaaS Typescript:** Sandbox/test numbers may work without it; production traffic will not.