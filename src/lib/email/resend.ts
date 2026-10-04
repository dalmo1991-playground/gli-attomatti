import { Resend } from "resend";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Returns a configured Resend client or null if the API key is not configured.
 */
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/**
 * Sends a transactional email using Resend.
 * In development or when RESEND_API_KEY is not configured, it simulates the delivery
 * and outputs details to the server console, allowing safe testing without breaking the workflow.
 */
export async function sendTransactionalEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const client = getResendClient();

  // Resolve sender address: env var takes precedence, fallback to default or resend test domain
  const fromAddress =
    options.from?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Gli Attomatti <onboarding@resend.dev>";

  const toList = Array.isArray(options.to) ? options.to : [options.to];

  // If no API key is set, simulate send safely
  if (!client) {
    console.info(
      `[Resend SIMULATION] Email non inviata realmente (RESEND_API_KEY mancante nelle variabili d'ambiente).\n` +
      `  Da: ${fromAddress}\n` +
      `  A: ${toList.join(", ")}\n` +
      `  Oggetto: ${options.subject}`
    );
    return {
      success: true,
      simulated: true,
      id: `mock-${Date.now()}`
    };
  }

  try {
    const { data, error } = await client.emails.send({
      from: fromAddress,
      to: toList,
      replyTo: options.replyTo?.trim() || undefined,
      subject: options.subject,
      html: options.html,
      text: options.text || undefined
    });

    if (error) {
      console.error("[Resend Error]", error);
      return {
        success: false,
        error: error.message || "Errore sconosciuto durante l'invio con Resend"
      };
    }

    return {
      success: true,
      id: data?.id
    };
  } catch (err: any) {
    console.error("[Resend Exception]", err);
    return {
      success: false,
      error: err?.message || "Eccezione durante l'invio dell'email"
    };
  }
}
