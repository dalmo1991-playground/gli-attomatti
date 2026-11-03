"use server";

import { cookies } from "next/headers";
import { constantTimeCompare } from "@/lib/security";

const COOKIE_NAME = "attomatti_assenze_auth";

/**
 * Verifies the PIN entered by the user against the server environment variable ASSENZE_PIN.
 * Uses constant-time comparison to prevent timing side-channel attacks.
 */
export async function verifyAbsencePin(
  pin: string
): Promise<{ success: boolean; error?: string }> {
  const configuredPin =
    process.env.ASSENZE_PIN ||
    process.env.CALENDARIO_ASSENZE_PIN ||
    (process.env.NODE_ENV === "development" ? "attomatti" : "");

  if (!configuredPin) {
    return {
      success: false,
      error: "PIN non configurato sul server. Imposta la variabile d'ambiente ASSENZE_PIN."
    };
  }

  const cleanInput = (pin || "").trim().toLowerCase();
  const cleanConfig = configuredPin.trim().toLowerCase();

  if (constantTimeCompare(cleanInput, cleanConfig)) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year persistence
      sameSite: "lax",
      httpOnly: false
    });
    return { success: true };
  }

  return { success: false, error: "PIN non corretto. Riprova." };
}

/**
 * Clears the session cookie when the user manually locks the page.
 */
export async function logoutAbsencePin(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  } catch {}
  return { success: true };
}

