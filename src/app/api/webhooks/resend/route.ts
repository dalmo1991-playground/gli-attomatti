import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { constantTimeCompare } from "@/lib/security";
import { recordResendBounce } from "@/lib/email/bounces";

export const dynamic = "force-dynamic";

function verifySvixSignature(
  rawBody: string,
  headers: Headers,
  secretRaw: string
): boolean {
  const svixId = headers.get("svix-id")?.trim();
  const svixTimestamp = headers.get("svix-timestamp")?.trim();
  const svixSignature = headers.get("svix-signature")?.trim();

  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  // Reject stale timestamps (> 5 minutes) to prevent replay attacks
  const tsNum = Number(svixTimestamp);
  if (!Number.isFinite(tsNum) || Math.abs(Date.now() / 1000 - tsNum) > 300) {
    return false;
  }

  const secretBase64 = secretRaw.startsWith("whsec_")
    ? secretRaw.slice("whsec_".length)
    : secretRaw;
  const keyBytes = Buffer.from(secretBase64, "base64");

  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expectedSig = crypto
    .createHmac("sha256", keyBytes)
    .update(signedContent)
    .digest("base64");

  const candidates = svixSignature.split(" ");
  for (const candidate of candidates) {
    const [version, sig] = candidate.split(",");
    if (version === "v1" && sig && constantTimeCompare(sig, expectedSig)) {
      return true;
    }
  }

  return false;
}

/**
 * POST /api/webhooks/resend
 * Receives Resend webhook events (email.bounced, email.complained) and queues them
 * in Upstash Redis for the unified daily summary email.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "RESEND_WEBHOOK_SECRET non configurato sul server." },
      { status: 500 }
    );
  }

  const rawBody = await req.text();
  if (!verifySvixSignature(rawBody, req.headers, webhookSecret)) {
    return NextResponse.json(
      { error: "Firma webhook Svix/Resend non valida." },
      { status: 401 }
    );
  }

  interface ResendWebhookPayload {
    type?: string;
    created_at?: string;
    data?: {
      to?: string | string[];
      subject?: string;
      created_at?: string;
      email_id?: string;
      bounce?: {
        message?: string;
        subType?: string;
        type?: string;
      };
    };
  }

  let payload: ResendWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as ResendWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Payload JSON non valido." }, { status: 400 });
  }

  const eventType = payload?.type;
  if (eventType !== "email.bounced" && eventType !== "email.complained") {
    return NextResponse.json({ received: true, ignored: true, type: eventType });
  }

  const data = payload?.data || {};
  const toList: string[] = Array.isArray(data.to)
    ? data.to
    : typeof data.to === "string"
      ? [data.to]
      : [];

  const subject = typeof data.subject === "string" ? data.subject : "Nessun oggetto";
  const reason =
    data.bounce?.message ||
    data.bounce?.subType ||
    data.bounce?.type ||
    (eventType === "email.complained" ? "Segnalazione spam / complaint" : "Email rimbalzata");
  const timestamp = payload?.created_at || data.created_at || new Date().toISOString();
  const emailId = typeof data.email_id === "string" ? data.email_id : undefined;

  let recorded = 0;
  for (const recipient of toList) {
    if (!recipient) continue;
    const ok = await recordResendBounce({
      id: `${emailId || Date.now()}-${recipient}`,
      email: recipient,
      subject,
      eventType,
      reason: String(reason),
      timestamp,
      emailId
    });
    if (ok) recorded += 1;
  }

  return NextResponse.json({ received: true, type: eventType, recorded });
}
