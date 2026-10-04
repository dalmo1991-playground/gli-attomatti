import { NextRequest, NextResponse } from "next/server";
import { getContent } from "@/lib/data";
import {
  renderEmailHtml,
  renderEmailText,
  resolveEmailTheme,
  EmailTemplateConfig
} from "@/lib/email/template";
import { sendTransactionalEmail } from "@/lib/email/resend";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-admin-secret")?.trim();
    const configuredSecret = process.env.ADMIN_SECRET?.trim();

    if (!configuredSecret) {
      return NextResponse.json(
        { error: "ADMIN_SECRET non è configurato nelle variabili d'ambiente del server." },
        { status: 500 }
      );
    }

    if (secret !== configuredSecret) {
      return NextResponse.json(
        { error: "Accesso non autorizzato: chiave segreta admin non valida." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { to, template, variables = {} } = body;

    if (!to || !to.includes("@")) {
      return NextResponse.json(
        { error: "Specifica un indirizzo email di destinazione valido." },
        { status: 400 }
      );
    }

    if (!template) {
      return NextResponse.json(
        { error: "Dati del template email mancanti." },
        { status: 400 }
      );
    }

    const content = await getContent();
    const emailsConfig = content?.emails || {};
    const emailSettings = emailsConfig.settings || {};

    // Default sample variables if none provided
    const mergedVariables: Record<string, string> = {
      name: "Nome di Prova",
      nome: "Nome di Prova",
      email: to,
      event_title: "Titolo Evento di Prova",
      titolo: "Titolo Evento di Prova",
      event_date: "14 Novembre 2026",
      data: "14 Novembre 2026",
      event_url: "https://gliattomatti.ch",
      ...variables
    };

    const themeColors = resolveEmailTheme(template.theme || "default", content?.landings || []);
    const emailHtml = renderEmailHtml({
      template,
      variables: mergedVariables,
      themeColors,
      settings: emailSettings
    });
    const emailText = renderEmailText({
      template,
      variables: mergedVariables,
      settings: emailSettings
    });

    const subject = template.subject
      ? `[TEST] ${template.subject.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_: string, k: string) => mergedVariables[k] || "")}`
      : `[TEST] Notifica di prova — Gli Attomatti`;

    const sendResult = await sendTransactionalEmail({
      to,
      subject,
      html: emailHtml,
      text: emailText,
      from: emailSettings.from_email
        ? `${emailSettings.from_name || "Gli Attomatti"} <${emailSettings.from_email}>`
        : undefined,
      replyTo: emailSettings.reply_to || undefined
    });

    if (!sendResult.success) {
      return NextResponse.json(
        { error: sendResult.error || "Errore sconosciuto durante l'invio dell'email di test" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: sendResult.simulated
        ? "Simulazione completata con successo (RESEND_API_KEY non ancora configurata in Vercel)"
        : "Email di test inviata con successo tramite Resend!",
      simulated: sendResult.simulated || false,
      id: sendResult.id
    });
  } catch (error: any) {
    console.error("[Test Email Exception]", error);
    return NextResponse.json(
      { error: "Errore interno durante l'invio dell'email di test: " + error?.message },
      { status: 500 }
    );
  }
}
