import { NextRequest, NextResponse } from "next/server";
import { getContent } from "@/lib/data";
import {
  renderEmailHtml,
  renderEmailText,
  resolveEmailTheme,
  EmailTemplateConfig
} from "@/lib/email/template";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { verifyRecaptchaToken } from "@/lib/recaptcha";
import {
  getValueByJsonPath,
  flattenJsonToDotNotation,
  resolveRecipientEmail,
  resolveRecipientName
} from "@/lib/email/jsonPath";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // 1. Query Parameters
    const templateQuery = url.searchParams.get("template") || url.searchParams.get("use_case");
    const secretQuery = url.searchParams.get("secret");
    const themeQuery = url.searchParams.get("theme");
    const isDryRun = url.searchParams.get("test") === "true";
    const toPathQuery = url.searchParams.get("to_path") || url.searchParams.get("email_path");
    const namePathQuery = url.searchParams.get("name_path");

    // 2. Parse Body Payload
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // 3. Security Check (Secret OR reCAPTCHA)
    const configuredApiSecret = process.env.EMAIL_API_SECRET?.trim() || process.env.ADMIN_SECRET?.trim();
    const providedSecret =
      secretQuery ||
      req.headers.get("x-api-secret")?.trim() ||
      req.headers.get("x-admin-secret")?.trim() ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim();

    let isAuthorized = false;

    // A. Check Secret Authorization (for Zapier, Make, cURL, Admin, Backend)
    if (configuredApiSecret && providedSecret === configuredApiSecret) {
      isAuthorized = true;
    }

    // B. Check reCAPTCHA Token (for public website buttons & modals)
    const recaptchaToken = body.recaptchaToken || body.captcha_token;
    if (!isAuthorized && recaptchaToken) {
      const captchaResult = await verifyRecaptchaToken(recaptchaToken);
      if (captchaResult.success) {
        isAuthorized = true;
      } else {
        return NextResponse.json(
          { error: captchaResult.error || "Verifica di sicurezza anti-bot reCAPTCHA non superata." },
          { status: 403 }
        );
      }
    }

    // C. In dev/test when neither secret nor reCAPTCHA key is configured in env
    if (!isAuthorized && !configuredApiSecret && !process.env.RECAPTCHA_SECRET_KEY) {
      if (process.env.NODE_ENV !== "production") {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error: "Non autorizzato. Includi il parametro ?secret=... (o header x-api-secret) oppure fornisci un token reCAPTCHA valido."
        },
        { status: 401 }
      );
    }

    // 4. Load Content & Find Matching Template
    const content = await getContent();
    const emailsConfig = content?.emails || {};
    const emailSettings = emailsConfig.settings || {};
    const templates: EmailTemplateConfig[] = Array.isArray(emailsConfig.templates) ? emailsConfig.templates : [];

    const requestedTemplateId = templateQuery || body.templateId || body.useCase;

    let selectedTemplate: EmailTemplateConfig | undefined;
    if (requestedTemplateId) {
      selectedTemplate = templates.find(
        (t) => t.id === requestedTemplateId || t.name?.toLowerCase() === requestedTemplateId.toLowerCase()
      );
    }

    // If template not found by ID, allow custom blocks in body or fallback
    if (!selectedTemplate) {
      if (Array.isArray(body.blocks) && body.blocks.length > 0) {
        selectedTemplate = {
          id: requestedTemplateId || "custom-adhoc",
          name: "Email Ad-Hoc",
          subject: body.subject || "Notifica da Gli Attomatti",
          blocks: body.blocks,
          theme: themeQuery || body.theme || "default"
        };
      } else {
        selectedTemplate = templates[0] || {
          id: "default-fallback",
          name: "Notifica Gli Attomatti",
          subject: body.subject || "Notifica da Gli Attomatti",
          heading: "Grazie per averci contattato",
          body: "Ciao {{name}},\n\nabbiamo ricevuto la tua richiesta.\n\nA presto!\nGli Attomatti",
          theme: "default"
        };
      }
    }

    // 4b. Respect the enabled flag: a disabled template never sends
    if (selectedTemplate.enabled === false) {
      return NextResponse.json({
        success: false,
        skipped: true,
        message: `Il template "${selectedTemplate.name || selectedTemplate.id}" è disattivato: nessuna email inviata.`
      });
    }

    // 5. Resolve Recipient Email & Name via JSONPath
    const emailJsonPath = toPathQuery || selectedTemplate?.field_mapping?.recipient_email_path;
    const nameJsonPath = namePathQuery || selectedTemplate?.field_mapping?.recipient_name_path;

    const recipientEmail = resolveRecipientEmail(body, emailJsonPath);

    if (!recipientEmail || !recipientEmail.includes("@")) {
      return NextResponse.json(
        {
          error:
            "Nessun indirizzo email valido trovato nel payload. Specifica un campo email valido o configura il percorso con ?to_path=percorso_json (es. ?to_path=pippo o customer.email)."
        },
        { status: 400 }
      );
    }

    const recipientName = resolveRecipientName(body, nameJsonPath);

    // 6. Build Variables Record (Flattened JSON + Mapped Fields)
    const flattenedPayload = flattenJsonToDotNotation(body);
    const customMappedVars: Record<string, string> = {};

    if (selectedTemplate?.field_mapping?.variables_mapping) {
      for (const [varName, pathStr] of Object.entries(selectedTemplate.field_mapping.variables_mapping)) {
        const val = getValueByJsonPath(body, pathStr);
        if (val !== undefined && val !== null) {
          customMappedVars[varName] = String(val);
        }
      }
    }

    const variables: Record<string, string> = {
      ...flattenedPayload, // Allows direct referencing of any incoming field (e.g. {{customer.city}} or {{pippo}})
      name: recipientName || "Gentile spettatore",
      nome: recipientName || "Gentile spettatore",
      email: recipientEmail,
      event_title: body.event_title || body.eventTitle || "Evento Teatrale",
      titolo: body.event_title || body.eventTitle || "Evento Teatrale",
      event_date: body.event_date || body.eventDate || "",
      data: body.event_date || body.eventDate || "",
      event_location: body.event_location || body.eventLocation || "Zurigo",
      event_url: body.event_url || body.eventUrl || "https://gliattomatti.ch",
      ...customMappedVars,
      ...(body.variables || {})
    };

    // 7. Resolve Theme & Render Email
    const chosenTheme = themeQuery || body.theme || selectedTemplate.theme || "default";
    const customColors = body.customColors || selectedTemplate.customColors;
    const themeColors = resolveEmailTheme(chosenTheme, content?.landings || [], customColors);

    const emailHtml = renderEmailHtml({
      template: selectedTemplate,
      variables,
      rawJsonObj: body,
      themeColors,
      settings: emailSettings
    });

    const emailText = renderEmailText({
      template: selectedTemplate,
      variables,
      rawJsonObj: body,
      settings: emailSettings
    });

    const subject = body.subject || selectedTemplate.subject || "Notifica da Gli Attomatti";
    const resolvedSubject = subject.replace(/\{\{\s*([a-zA-Z0-9_.[\]$-]+)\s*\}\}/g, (_: string, rawKey: string) => {
      const k = rawKey.trim();
      if (variables[k] !== undefined) return variables[k];
      const normalizedKey = k.replace(/\[['"]?([^'"\]]+)['"]?\]/g, ".$1");
      return variables[normalizedKey] !== undefined ? variables[normalizedKey] : "";
    });

    // If dry run, return rendered preview without sending
    if (isDryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        recipient: recipientEmail,
        subject: resolvedSubject,
        htmlPreview: emailHtml
      });
    }

    // 8. Dispatch Email via Resend
    const sendResult = await sendTransactionalEmail({
      to: recipientEmail,
      subject: resolvedSubject,
      html: emailHtml,
      text: emailText,
      from: body.from || (emailSettings.from_email
        ? `${emailSettings.from_name || "Gli Attomatti"} <${emailSettings.from_email}>`
        : undefined),
      replyTo: body.replyTo || emailSettings.reply_to || undefined
    });

    if (!sendResult.success) {
      return NextResponse.json(
        { error: sendResult.error || "Errore sconosciuto durante l'invio dell'email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email inviata con successo",
      emailId: sendResult.id,
      simulated: sendResult.simulated || false,
      recipient: recipientEmail,
      template: selectedTemplate.id || selectedTemplate.name
    });
  } catch (error: any) {
    console.error("[Email Send API Exception]", error);
    return NextResponse.json(
      { error: "Errore interno durante l'elaborazione della richiesta email: " + error?.message },
      { status: 500 }
    );
  }
}
