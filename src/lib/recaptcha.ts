/**
 * Google reCAPTCHA server-side token validation.
 * Supports reCAPTCHA v3 (with score evaluation) and v2.
 */
export async function verifyRecaptchaToken(
  token?: string | null
): Promise<{ success: boolean; score?: number; error?: string; simulated?: boolean }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY?.trim();

  // If secret key is not yet set in environment, allow with simulation warning
  if (!secretKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[reCAPTCHA SIMULATION] RECAPTCHA_SECRET_KEY non configurata. Token accettato in modalità sviluppo.");
    }
    return { success: true, simulated: true, score: 1.0 };
  }

  if (!token?.trim()) {
    return { success: false, error: "Token di verifica di sicurezza mancante." };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token.trim());

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString()
    });

    const data = await response.json();

    if (!data.success) {
      console.warn("[reCAPTCHA Fail]", data["error-codes"]);
      return {
        success: false,
        error: "Verifica di sicurezza anti-bot non superata. Riprova."
      };
    }

    // For reCAPTCHA v3, check score threshold (0.5 is Google's recommended standard)
    if (typeof data.score === "number" && data.score < 0.4) {
      console.warn(`[reCAPTCHA Low Score: ${data.score}]`);
      return {
        success: false,
        score: data.score,
        error: "Richiesta contrassegnata come potenziale traffico automatizzato."
      };
    }

    return {
      success: true,
      score: data.score ?? 1.0
    };
  } catch (err: any) {
    console.error("[reCAPTCHA Exception]", err);
    return {
      success: false,
      error: "Errore durante la verifica con il servizio reCAPTCHA: " + err?.message
    };
  }
}
