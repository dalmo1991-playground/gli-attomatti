import { NextRequest } from "next/server";
import { constantTimeCompare, getClientIp, checkRateLimit } from "@/lib/security";

/**
 * Shared admin authorization for admin-only API routes.
 * Lives in lib/ (not in a route.ts file) because Next.js route modules may only export HTTP handlers.
 */
export function checkAdminAuth(req: NextRequest): { authorized: boolean; error?: string; status?: number } {
  // In local development, allow admin testing without requiring secrets
  if (process.env.NODE_ENV === "development") {
    return { authorized: true };
  }

  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(`admin-auth:${clientIp}`, 30, 60_000);
  if (!rateCheck.allowed) {
    return {
      authorized: false,
      status: 429,
      error: "Troppi tentativi di accesso. Riprova tra un minuto."
    };
  }

  const configuredSecret = (process.env.ADMIN_SECRET || process.env.EMAIL_API_SECRET || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();

  if (!configuredSecret) {
    return {
      authorized: false,
      status: 500,
      error:
        "ADMIN_SECRET non è configurato nelle variabili d'ambiente di Vercel per questo ambiente. " +
        "Vai su Vercel (Project Settings > Environment Variables) e assicurati che ADMIN_SECRET sia impostato."
    };
  }

  const url = new URL(req.url);
  const secret = (
    req.headers.get("x-admin-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    url.searchParams.get("secret") ||
    ""
  )
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();

  if (!secret) {
    return {
      authorized: false,
      status: 401,
      error:
        "Password Admin non inviata nella richiesta (header x-admin-secret mancante o vuoto). Inserisci la Password Admin nel pannello."
    };
  }

  if (!constantTimeCompare(secret, configuredSecret)) {
    return {
      authorized: false,
      status: 401,
      error:
        "Password Admin non valida. La password inserita non corrisponde a quella configurata in ADMIN_SECRET sul server."
    };
  }

  return { authorized: true };
}
