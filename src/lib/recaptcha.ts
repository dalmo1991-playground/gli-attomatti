/**
 * Google reCAPTCHA server-side token validation — SOFT MODE with suspicion detection.
 *
 * If reCAPTCHA fails, is unavailable or reports a low score (< 0.5):
 * - It never crashes or blocks the user immediately.
 * - It sets `isSuspicious = true`.
 * - The calling route can then apply a strict 1-submission-per-day restriction for that IP.
 */
export async function verifyRecaptchaToken(
  token?: string | null
): Promise<{ success: boolean; score?: number; isSuspicious: boolean; error?: string; simulated?: boolean }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY?.trim().replace(/^["']|["']$/g, "").trim();

  // If reCAPTCHA is not configured or token is missing, treat as suspicious for safety
  if (!secretKey || !token?.trim()) {
    return { success: true, simulated: true, isSuspicious: true, score: 0 };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token.trim());

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
      signal: AbortSignal.timeout(4000)
    });

    const data = await response.json();

    if (!data.success) {
      console.warn("[reCAPTCHA] Verifica fallita da Google:", data["error-codes"]);
      return { success: true, isSuspicious: true, score: 0, simulated: false };
    }

    const score = typeof data.score === "number" ? data.score : 1.0;
    // Score < 0.5 is considered suspicious by Google standards
    const isSuspicious = score < 0.5;

    if (isSuspicious) {
      console.warn(`[reCAPTCHA] Punteggio basso rilevato: ${score} (richiesta contrassegnata come sospetta)`);
    }

    return {
      success: true,
      score,
      isSuspicious,
      simulated: false
    };
  } catch (err) {
    console.warn("[reCAPTCHA] Servizio non raggiungibile (contrassegnato come sospetto):", err);
    return { success: true, simulated: true, isSuspicious: true, score: 0 };
  }
}
