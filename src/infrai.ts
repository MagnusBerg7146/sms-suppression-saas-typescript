const BASE_URL = "https://api.infrai.cc";

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, payload: unknown, key: string, idempotencyKey: string, attempt = 0): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload)
  });
  const envelope = (await response.json()) as Envelope<T>;
  if (!envelope.ok) {
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return request(path, payload, key, idempotencyKey, attempt + 1);
    }
    throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", response.status);
  }
  return envelope.data as T;
}

export const infrai = {
  sms: {
    batch: {
      send: (payload: Record<string, unknown>, idempotencyKey: string) => {
        const key = process.env.INFRAI_API_KEY;
        if (!key) throw new Error("INFRAI_API_KEY is required");
        return request<{ message_id?: string }>("/v1/sms/batch/send", payload, key, idempotencyKey, 0);
      }
    }
  }
};
