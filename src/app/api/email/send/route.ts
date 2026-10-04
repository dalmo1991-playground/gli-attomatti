import { NextRequest, NextResponse } from "next/server";
import { getContent } from "@/lib/data";
import {
  renderEmailHtml,
  renderEmailText,
  resolveEmailTheme,
  replaceVariables,
  EmailTemplateConfig,
  EmailSubcaseConfig
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
    const subcaseQuery =
      url.searchParams.get("subcase") ||
      url.searchParams.get("subcase_id") ||
      url.searchParams.get("subcaseId");
    const secretQuery = url.searchParams.get("secret");
    const themeQuery = url.searchParams.get("theme");
    const isDryRun = url.searchParams.get("test") === "true";
    const toPathQuery = url.searchParams.get("to_path") || url.searchParams.get("email_path");
    const namePathQuery = url.searchParams.get("name_path");

    // Extract incoming HTTP headers for webhook customization (e.g. x-event-date, x-subcase)
    const headersObj: Record<string, string> = {};
    const headerVars: Record<string, string> = {};
    for (const [key, value] of req.headers.entries()) {
      const lowerKey = key.toLowerCase();
      headersObj[lowerKey] = value;
      // Expose headers with x-var- or custom headers directly as variables
      if (lowerKey.startsWith("x-var-")) {
        headerVars[lowerKey.replace("x-var-", "")] = value;
      } else if (lowerKey.startsWith("x-event-")) {
        headerVars[lowerKey.replace("x-", "")] = value;
      }
    }

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

    // 4. Load Content & Find Matching Template & Subcase
    const content = await getContent();
    const emailsConfig = content?.emails || {};
    const emailSettings = emailsConfig.settings || {};
    const templates: EmailTemplateConfig[] = Array.isArray(emailsConfig.templates) ? emailsConfig.templates : [];

    let rawTemplateParam =
      templateQuery ||
      body.template ||
      body.templateId ||
      body.use_case ||
      body.useCase ||
      "";
    let requestedSubcaseId =
      subcaseQuery ||
      body.subcase ||
      body.subcaseId ||
      body.subcase_id ||
      req.headers.get("x-subcase")?.trim();

    // Strip optional #email: or email: prefix if caller passed the full tag
    if (typeof rawTemplateParam === "string") {
      rawTemplateParam = rawTemplateParam.replace(/^#?email:/i, "").trim();

      // Syntax supported: templateId:subcaseId
      if (rawTemplateParam.includes(":")) {
        const parts = rawTemplateParam.split(":");
        rawTemplateParam = parts[0]?.trim();
        if (!requestedSubcaseId) {
          requestedSubcaseId = parts[1]?.trim();
        }
      }
    }

    let selectedTemplate: EmailTemplateConfig | undefined;
    if (rawTemplateParam) {
      selectedTemplate = templates.find(
        (t) => t.id === rawTemplateParam || t.name?.toLowerCase() === rawTemplateParam.toLowerCase()
      );
    }

    // If template not found by ID, allow custom blocks in body or fallback
    if (!selectedTemplate) {
      if (Array.isArray(body.blocks) && body.blocks.length > 0) {
        selectedTemplate = {
          id: rawTemplateParam || "custom-adhoc",
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

    // 4c. Resolve Subcase (if specified)
    let activeSubcase: EmailSubcaseConfig | undefined;
    if (requestedSubcaseId && Array.isArray(selectedTemplate.subcases)) {
      activeSubcase = selectedTemplate.subcases.find(
        (s) =>
          s.id?.toLowerCase() === requestedSubcaseId.toLowerCase() ||
          s.name?.toLowerCase() === requestedSubcaseId.toLowerCase()
      );
    }

    // 5. Resolve Recipient Email & Name strictly (no fuzzy guessing)
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

    // 6. Build Variables Record (Flattened JSON + Webhook Headers + Mapped Fields + Subcase)
    const payloadContext = {
      ...body,
      headers: headersObj,
      header: headersObj
    };

    const flattenedPayload = flattenJsonToDotNotation(body);
    const customMappedVars: Record<string, string> = {};

    if (selectedTemplate?.field_mapping?.variables_mapping) {
      for (const [varName, pathStr] of Object.entries(selectedTemplate.field_mapping.variables_mapping)) {
        const val = getValueByJsonPath(payloadContext, pathStr);
        if (val !== undefined && val !== null) {
          customMappedVars[varName] = String(val);
        }
      }
    }

    // Strict variables: only variables actually present in payload, headers, or subcase custom fields
    const variables: Record<string, string> = {
      ...headerVars,
      ...flattenedPayload,
      ...(recipientName ? { name: recipientName, nome: recipientName } : {}),
      ...(recipientEmail ? { email: recipientEmail } : {}),
      ...(body.event_title || body.eventTitle ? { event_title: body.event_title || body.eventTitle, titolo: body.event_title || body.eventTitle } : {}),
      ...(body.event_date || body.eventDate ? { event_date: body.event_date || body.eventDate, data: body.event_date || body.eventDate } : {}),
      ...(body.event_location || body.eventLocation ? { event_location: body.event_location || body.eventLocation } : {}),
      ...(body.event_url || body.eventUrl ? { event_url: body.event_url || body.eventUrl } : {}),
      ...customMappedVars,
      ...(activeSubcase?.custom_fields || {}),
      ...(body.variables || {})
    };

    // 7. Resolve Theme & Render Email
    const chosenTheme = themeQuery || body.theme || selectedTemplate.theme || "default";
    const customColors = body.customColors || selectedTemplate.customColors;
    const themeColors = resolveEmailTheme(chosenTheme, content?.landings || [], customColors);

    const baseUrl =
      req.nextUrl?.origin && !req.nextUrl.origin.includes("localhost")
        ? req.nextUrl.origin
        : (process.env.NEXT_PUBLIC_SITE_URL || "https://gliattomatti.ch");

    const emailHtml = renderEmailHtml({
      template: selectedTemplate,
      variables,
      rawJsonObj: payloadContext,
      themeColors,
      settings: emailSettings,
      baseUrl
    });

    const emailText = renderEmailText({
      template: selectedTemplate,
      variables,
      rawJsonObj: payloadContext,
      settings: emailSettings,
      baseUrl
    });

    const subjectTemplate = body.subject || selectedTemplate.subject || "Notifica da Gli Attomatti";
    const resolvedSubject = replaceVariables(subjectTemplate, variables);

    // If dry run, return rendered preview without sending
    if (isDryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        recipient: recipientEmail,
        subject: resolvedSubject,
        subcase: activeSubcase?.id,
        htmlPreview: emailHtml
      });
    }

    // 8. Resolve Sender Profile (Subcase -> Template -> Global Settings)
    const senderProfile = activeSubcase?.sender_profile || selectedTemplate.sender_profile || {};

    let fromName =
      body.from_name ||
      req.headers.get("x-sender-name")?.trim() ||
      senderProfile.from_name ||
      emailSettings.from_name ||
      "Gli Attomatti";
    fromName = replaceVariables(fromName, variables);

    const fromEmail =
      body.from_email ||
      req.headers.get("x-from-email")?.trim() ||
      senderProfile.from_email ||
      emailSettings.from_email;

    let replyTo =
      body.reply_to ||
      body.replyTo ||
      req.headers.get("x-reply-to")?.trim() ||
      senderProfile.reply_to ||
      emailSettings.reply_to ||
      undefined;
    if (replyTo) {
      replyTo = replaceVariables(replyTo, variables);
    }

    const fromHeader = fromEmail ? `${fromName} <${fromEmail}>` : undefined;

    // 9. Dispatch Email via Resend
    const sendResult = await sendTransactionalEmail({
      to: recipientEmail,
      subject: resolvedSubject,
      html: emailHtml,
      text: emailText,
      from: fromHeader,
      replyTo
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
