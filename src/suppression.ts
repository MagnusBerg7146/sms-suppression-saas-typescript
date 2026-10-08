import { z } from "zod";

export const sendRequestSchema = z.object({
  tenantId: z.string().min(1),
  accountId: z.string().min(1),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
  message: z.string().min(1).max(500),
  optedOut: z.boolean().default(false),
  suspended: z.boolean().default(false)
});

export type SendRequest = z.infer<typeof sendRequestSchema>;
export type Decision = { allowed: true } | { allowed: false; reason: "opted_out" | "suspended" };

export function decideSend(input: SendRequest): Decision {
  if (input.suspended) return { allowed: false, reason: "suspended" };
  if (input.optedOut) return { allowed: false, reason: "opted_out" };
  return { allowed: true };
}
