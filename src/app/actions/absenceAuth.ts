"use server";

import { verifyAreaRiservataPin, logoutAreaRiservata } from "./areaRiservataAuth";

/**
 * @deprecated Usa verifyAreaRiservataPin da "@/app/actions/areaRiservataAuth".
 * Reindirizzato alla nuova autenticazione sicura con cookie HttpOnly e HMAC SHA-256.
 */
export async function verifyAbsencePin(
  pin: string
): Promise<{ success: boolean; error?: string }> {
  return verifyAreaRiservataPin(pin);
}

/**
 * @deprecated Usa logoutAreaRiservata da "@/app/actions/areaRiservataAuth".
 */
export async function logoutAbsencePin(): Promise<{ success: boolean }> {
  return logoutAreaRiservata();
}


