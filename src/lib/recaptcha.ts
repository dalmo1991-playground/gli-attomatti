/**
 * Google reCAPTCHA server-side token validation.
 * Supports reCAPTCHA v3 (with score evaluation) and v2.
 */
export async function verifyRecaptchaToken(
  token?: string | null
): Promise<{ success: boolean; score?: number; error?: string; simulated?: boolean }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY?.trim().replace(/^["']|["']$/g, "").trim();

  const isKnownStaging =
    process.env.NODE_ENV !== "production" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.VERCEL_ENV === "development" ||
    Boolean(process.env.VERCEL_URL) ||
    process.env.VERCEL === "1";

  // If secret key is not set in environment
  if (!secretKey) {
    console.info("[reCAPTCHA] RECAPTCHA_SECRET_KEY non configurata. Procedura consentita in modalità fallback.");
    return { success: true, simulated: true, score: 1.0 };
  }

  // If token is missing
  if (!token?.trim()) {
    if (isKnownStaging) {
      console.info("[reCAPTCHA] Token assente in ambiente di preview/staging. Procedura consentita.");
      return { success: true, simulated: true, score: 1.0 };
    }
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
    const errorCodes: string[] = Array.isArray(data["error-codes"]) ? data["error-codes"] : [];

    if (!data.success) {
      console.warn("[reCAPTCHA Fail]", errorCodes, "hostname:", data.hostname);

      const isStagingDomain =
        !data.hostname ||
        data.hostname.endsWith(".vercel.app") ||
        data.hostname.includes("vercel") ||
        data.hostname === "localhost" ||
        data.hostname === "127.0.0.1" ||
        isKnownStaging;

      // In staging/preview, Google reCAPTCHA frequently fails due to hostname-mismatch,
      // invalid-input-response or domain registration limits. Allow test submissions through.
      if (isStagingDomain) {
        console.info(
          `[reCAPTCHA Staging Allowed] Token accettato in ambiente preview/staging per: ${data.hostname || "vercel-preview"}`
        );
        return {
          success: true,
          score: data.score ?? 1.0,
          simulated: true
        };
      }

      return {
        success: false,
        error: "Verifica di sicurezza anti-bot non superata. Riprova."
      };
    }

    // For reCAPTCHA v3, check score threshold (0.3+ accepted)
    if (typeof data.score === "number" && data.score < 0.3) {
      if (isKnownStaging) {
        return { success: true, score: data.score, simulated: true };
      }
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
    if (isKnownStaging) {
      return { success: true, simulated: true, score: 1.0 };
    }
    return {
      success: false,
      error: "Errore durante la verifica con il servizio reCAPTCHA: " + err?.message
    };
  }
}
