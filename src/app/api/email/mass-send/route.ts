import { NextRequest, NextResponse } from "next/server";
import { getContent } from "@/lib/data";
import {
  renderEmailHtml,
  renderEmailText,
  resolveEmailTheme,
  EmailTemplateConfig
} from "@/lib/email/template";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { checkAdminAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export interface MassSendRecipient {
  to: string;
  variables: Record<string, string>;
}

export interface MassSendResultItem {
  to: string;
  success: boolean;
  id?: string;
  error?: string;
  simulated?: boolean;
}

// Ritardo helper per evitare picchi di rate-limit su Resend
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  try {
    const auth = checkAdminAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const {
      template,
      recipients,
      isDryRun = false,
      delayBetweenMs = 150
    }: {
      template: EmailTemplateConfig;
      recipients: MassSendRecipient[];
      isDryRun?: boolean;
      delayBetweenMs?: number;
    } = body;

    if (!template) {
      return NextResponse.json(
        { error: "Dati del template email mancanti." },
        { status: 400 }
      );
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "Nessun destinatario specificato per l'invio." },
        { status: 400 }
      );
    }

    const content = await getContent();
    const emailsConfig = content?.emails || {};
    const emailSettings = emailsConfig.settings || {};

    const themeColors = resolveEmailTheme(
      template.theme || "default",
      content?.landings || [],
      template.customColors
    );

    const baseUrl =
      req.nextUrl?.origin && !req.nextUrl.origin.includes("localhost")
        ? req.nextUrl.origin
        : (process.env.NEXT_PUBLIC_SITE_URL || "https://gliattomatti.ch");

    const senderProfile = template.sender_profile || {};
    const fromName = senderProfile.from_name || emailSettings.from_name || "Gli Attomatti";
    const fromEmail = senderProfile.from_email || emailSettings.from_email || "";
    const fromAddress = fromEmail ? `${fromName} <${fromEmail}>` : undefined;
    const replyTo = senderProfile.reply_to || emailSettings.reply_to || undefined;

    const results: MassSendResultItem[] = [];

    // Validazione preliminare o Dry-Run
    if (isDryRun) {
      for (const item of recipients) {
        const to = item.to?.trim() || "";
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to);

        if (!emailValid) {
          results.push({
            to,
            success: false,
            error: "Formato indirizzo email non valido",
            simulated: true
          });
          continue;
        }

        try {
          const mergedVariables = {
            ...item.variables,
            email: to
          };

          // Renderizza di prova per testare la compilazione
          renderEmailHtml({
            template,
            variables: mergedVariables,
            themeColors,
            settings: emailSettings,
            baseUrl
          });

          results.push({
            to,
            success: true,
            id: `dry-run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            simulated: true
          });
        } catch (renderErr: unknown) {
          const errMsg = renderErr instanceof Error ? renderErr.message : "errore sconosciuto";
          results.push({
            to,
            success: false,
            error: `Errore compilazione template: ${errMsg}`,
            simulated: true
          });
        }
      }

      const totalSent = results.filter((r) => r.success).length;
      const totalFailed = results.length - totalSent;

      return NextResponse.json({
        success: true,
        dryRun: true,
        total: results.length,
        sent: totalSent,
        failed: totalFailed,
        results
      });
    }

    // Invio Effettivo sequenziale a ritmo controllato
    const throttleMs = Math.max(50, Math.min(delayBetweenMs, 1000));

    for (let i = 0; i < recipients.length; i++) {
      const item = recipients[i];
      const to = item.to?.trim() || "";
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to);

      if (!emailValid) {
        results.push({
          to,
          success: false,
          error: "Indirizzo email non valido"
        });
        continue;
      }

      try {
        const mergedVariables: Record<string, string> = {
          ...item.variables,
          email: to
        };

        const emailHtml = renderEmailHtml({
          template,
          variables: mergedVariables,
          themeColors,
          settings: emailSettings,
          baseUrl
        });

        const emailText = renderEmailText({
          template,
          variables: mergedVariables,
          settings: emailSettings,
          baseUrl
        });

        const emailSubject = template.subject || "Comunicazione da Gli Attomatti";

        const sendRes = await sendTransactionalEmail({
          to,
          from: fromAddress,
          replyTo,
          subject: emailSubject,
          html: emailHtml,
          text: emailText
        });

        results.push({
          to,
          success: sendRes.success,
          id: sendRes.id,
          error: sendRes.error,
          simulated: sendRes.simulated
        });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Eccezione durante l'invio";
        results.push({
          to,
          success: false,
          error: errMsg
        });
      }

      // Applicazione del delay se non siamo all'ultimo destinatario
      if (i < recipients.length - 1 && throttleMs > 0) {
        await sleep(throttleMs);
      }
    }

    const totalSent = results.filter((r) => r.success).length;
    const totalFailed = results.length - totalSent;

    return NextResponse.json({
      success: true,
      dryRun: false,
      total: results.length,
      sent: totalSent,
      failed: totalFailed,
      results
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Errore imprevisto durante l'invio massivo.";
    console.error("[Email Mass Send Error]", error);
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}

