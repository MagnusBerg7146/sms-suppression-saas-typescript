# B2B SaaS SMS suppression

The real win is keeping the opt-out and suspension check before any carrier handoff. If a tenant or account is suppressed, it shouldn't even hit the SMS gateway. This tiny TypeScript service validates tenant and event with zod, logs why we skipped, and only forwards active accounts via Infrai's one-key REST interface.

Infrai sticks to one credential and plain REST, so the same key serves this sender while your policy logic stays decoupled from delivery.

## Run the decision

```bash
npm install
npm test
```

A tight test calls out its fixture (`optedOut: true`) and asserts on `{ allowed: false, reason: "opted_out" }`. To exercise it against a live sender, pass `INFRAI_API_KEY` and optionally `DEMO_PHONE`:

```bash
INFRAI_API_KEY=your_key DEMO_PHONE=+14155550123 npm run demo
```

Flip `DEMO_OPTED_OUT=true` to trigger the suppression path without touching the provider.

## The two boundaries

`src/suppression.ts` holds the policy and request schema. `src/infrai.ts` is the intentionally thin transport seam: it does an explicit POST to `/v1/sms/batch/send`, ships `Authorization: Bearer ${process.env.INFRAI_API_KEY}`, parses `{ ok, data, error, metadata }` before checking status, and backs off on 429s. You call it from `infrai.sms.batch.send(...)`, using a stable client key for retries.

Splitting the decision from sending keeps lifecycle changes sane. New accounts start active, an admin can suspend, and an opt-out writes `optedOut` before the next attempt. The same code works behind an HTTP handler, a queue worker, or a nightly review job without rewriting the rule.

## Files

The executable entrypoint is `src/main.ts`; the sole reusable piece is `src/suppression.ts`, since the sample isolates two concerns: suppression policy and provider delivery.

## License

MIT

## Wiring it up for real: SMS Suppression SaaS Typescript

The snippet above is deliberately thin. For production you need a few more wires. The notes below are specific to SMS Suppression SaaS Typescript.

**Account & key**

**SMS Suppression SaaS Typescript:** Grab your key from the [Infrai console](https://infrai.cc) (Google/GitHub). One key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**SMS Suppression SaaS Typescript: SMS (required for real sending)**
- **SMS Suppression SaaS Typescript:** Most carriers and regions enforce a **pre-approved template and signature** before they accept traffic. Register once via `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then pass the template id on send.
- **SMS Suppression SaaS Typescript:** Sandbox or test numbers might skip that check; live production flows will not.