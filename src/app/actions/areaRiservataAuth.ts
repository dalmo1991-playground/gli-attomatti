"use server";

import { cookies } from "next/headers";
import crypto from "crypto";
import { constantTimeCompare } from "@/lib/security";

const COOKIE_NAME = "attomatti_area_riservata_auth";

/**
 * Returns the configured secret PIN for the Area Riservata.
 * Prioritizes AREA_RISERVATA_PIN, falling back to legacy ASSENZE_PIN in dev/transition.
 */
function getConfiguredPin(): string {
  const pin =
    process.env.AREA_RISERVATA_PIN ||
    process.env.ASSENZE_PIN ||
    process.env.CALENDARIO_ASSENZE_PIN ||
    (process.env.NODE_ENV === "development" ? "attomatti" : "");
  return pin.trim();
}

/**
 * Generates an HMAC SHA-256 session token based on the current PIN and a server salt.
 */
function generateSessionToken(pin: string): string {
  const secretKey = process.env.SESSION_SECRET || pin || "attomatti_area_riservata_secret";
  return crypto
    .createHmac("sha256", secretKey)
    .update(`attomatti_session:${pin.toLowerCase()}`)
    .digest("hex");
}

/**
 * Server Action: verifies the entered PIN and sets an HttpOnly Session Cookie if valid.
 */
export async function verifyAreaRiservataPin(
  pin: string
): Promise<{ success: boolean; error?: string }> {
  const configuredPin = getConfiguredPin();

  if (!configuredPin) {
    // Artificial delay to prevent timing analysis and brute force
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      success: false,
      error: "PIN non configurato sul server. Imposta la variabile d'ambiente AREA_RISERVATA_PIN."
    };
  }

  const cleanInput = (pin || "").trim().toLowerCase();
  const cleanConfig = configuredPin.toLowerCase();

  if (constantTimeCompare(cleanInput, cleanConfig)) {
    const token = generateSessionToken(configuredPin);
    const cookieStore = await cookies();

    // Session cookie: no maxAge / expires -> automatically wiped when browser window closes.
    // httpOnly: true -> completely inaccessible from client JavaScript (prevents console tampering & XSS).
    cookieStore.set(COOKIE_NAME, token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });

    return { success: true };
  }

  // Rate limiting / brute-force protection: controlled delay on incorrect PIN attempts
  await new Promise((resolve) => setTimeout(resolve, 600));

  return { success: false, error: "PIN non corretto. Riprova." };
}

/**
 * Server-side check: validates whether the current request holds a valid signed session cookie.
 */
export async function isAreaRiservataAuthenticated(): Promise<boolean> {
  const configuredPin = getConfiguredPin();
  if (!configuredPin) return false;

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
    if (!sessionCookie) return false;

    const expectedToken = generateSessionToken(configuredPin);
    return constantTimeCompare(sessionCookie, expectedToken);
  } catch {
    return false;
  }
}

/**
 * Server Action: clears the session cookie on user logout.
 */
export async function logoutAreaRiservata(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  } catch {}
  return { success: true };
}

