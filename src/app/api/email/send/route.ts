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
import { sendTransactionalEmail, SendEmailAttachment } from "@/lib/email/resend";
import { verifyRecaptchaToken } from "@/lib/recaptcha";
import { parseEventDate, generateIcsCalendarContent } from "@/lib/email/calendar";
import {
  getValueByJsonPath,
  flattenJsonToDotNotation,
  resolveRecipientEmail,
  resolveRecipientName
} from "@/lib/email/jsonPath";
import { enqueueFailedEmail } from "@/lib/email/dlq";

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

    // 3. Security & Access Control Check
    const configuredApiSecret = (process.env.EMAIL_API_SECRET || process.env.ADMIN_SECRET || "")
      .trim()
      .replace(/^["']|["']$/g, "")
      .trim();

    const providedSecret = (
      secretQuery ||
      req.headers.get("x-api-secret") ||
      req.headers.get("x-admin-secret") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      ""
    )
      .trim()
      .replace(/^["']|["']$/g, "")
      .trim();

    // Import security utilities
    const { constantTimeCompare, getClientIp, checkRateLimit, verifyTallySignature } = await import("@/lib/security");
    const clientIp = getClientIp(req);

    let isSecretAuthorized = false;

    // A. Check Secret Authorization (for Zapier, Make, cURL, Admin, Backend, Webhooks)
    if (configuredApiSecret && providedSecret) {
      isSecretAuthorized = constantTimeCompare(configuredApiSecret, providedSecret);
    }

    // B. Check Tally Webhook cryptographic signature (if tally-signature header is present)
    const tallySignature = req.headers.get("tally-signature");
    if (!isSecretAuthorized && tallySignature && configuredApiSecret) {
      const rawBodyText = JSON.stringify(body);
      const tallySigningSecret = process.env.TALLY_SIGNING_SECRET?.trim() || configuredApiSecret;
      if (verifyTallySignature(rawBodyText, tallySignature, tallySigningSecret)) {
        isSecretAuthorized = true;
      }
    }

    let isPublicFormAuthorized = false;

    // C. Public Browser Submission (Modal form on Gli Attomatti website)
    if (!isSecretAuthorized) {
      // Apply strict rate limiting on public submissions (max 10 email sends / 60 seconds per IP)
      const rateCheck = checkRateLimit(`email-send-public:${clientIp}`, 10, 60_000);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { error: "Troppe richieste inviate in poco tempo. Attendi un momento prima di riprovare." },
          { status: 429 }
        );
      }

      // 1. Decoy honeypot fields inspection
      const honeypotWebsite = body.website_url_check || body.website;
      const honeypotCompany = body.business_company_name || body.company;
      const honeypotHoney = body.bot_field_honey || body.honeypot;

      const isHoneypotTriggered = Boolean(
        (typeof honeypotWebsite === "string" && honeypotWebsite.trim().length > 0) ||
        (typeof honeypotCompany === "string" && honeypotCompany.trim().length > 0) ||
        (typeof honeypotHoney === "string" && honeypotHoney.trim().length > 0)
      );

      // 2. Speed trap inspection: Humans take > 600ms between opening the modal and clicking submit
      const openedAt = Number(body.openedAt) || 0;
      const submittedAt = Number(body.submittedAt) || Date.now();
      const elapsedMs = openedAt > 0 ? submittedAt - openedAt : 9999;
      const isSpeedTrapTriggered = openedAt > 0 && elapsedMs < 600;

      if (isHoneypotTriggered || isSpeedTrapTriggered) {
        console.warn(
          `[HONEYPOT BOT INTERCEPTED] Automated submission silently dropped from IP ${clientIp}:` +
          ` website="${honeypotWebsite || ""}", company="${honeypotCompany || ""}", elapsedMs=${elapsedMs}ms`
        );
        // Silently return 200 OK so automated bots do not learn or mutate their attack vector
        return NextResponse.json({
          success: true,
          simulated: true,
          message: "Richiesta elaborata con successo."
        });
      }

      // 3. Verify anti-bot reCAPTCHA token
      const recaptchaToken = body.recaptchaToken || body.captcha_token;
      const captchaResult = await verifyRecaptchaToken(recaptchaToken);
      if (!captchaResult.success) {
        return NextResponse.json(
          { error: captchaResult.error || "Verifica di sicurezza anti-bot reCAPTCHA non superata." },
          { status: 403 }
        );
      }

      // 4. CRITICAL DEFENSE: Public submissions CANNOT send custom ad-hoc blocks or spoof sender headers!
      if (Array.isArray(body.blocks) && body.blocks.length > 0) {
        return NextResponse.json(
          { error: "L'invio di blocchi email ad-hoc richiede autenticazione tramite chiave segreta API." },
          { status: 403 }
        );
      }

      isPublicFormAuthorized = true;
    }

    if (!isSecretAuthorized && !isPublicFormAuthorized) {
      return NextResponse.json(
        {
          error: "Non autorizzato. Includi il parametro ?secret=... (o header x-api-secret) oppure compila il modulo direttamente dal sito."
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

    // Only secret-authorized callers (Zapier, Admin, Server API) can override fromName and fromEmail directly
    let fromName =
      (isSecretAuthorized ? (body.from_name || req.headers.get("x-sender-name")?.trim()) : null) ||
      senderProfile.from_name ||
      emailSettings.from_name ||
      "Gli Attomatti";
    fromName = replaceVariables(fromName, variables);

    const fromEmail =
      (isSecretAuthorized ? (body.from_email || req.headers.get("x-from-email")?.trim()) : null) ||
      senderProfile.from_email ||
      emailSettings.from_email;

    let replyTo =
      (isSecretAuthorized ? (body.reply_to || body.replyTo || req.headers.get("x-reply-to")?.trim()) : null) ||
      senderProfile.reply_to ||
      emailSettings.reply_to ||
      undefined;
    if (replyTo) {
      replyTo = replaceVariables(replyTo, variables);
    }

    const fromHeader = fromEmail ? `${fromName} <${fromEmail}>` : undefined;

    // 8b. Check for Calendar Appointment block and attach universal .ics file
    const attachments: SendEmailAttachment[] = [];
    const calendarBlock = (selectedTemplate.blocks || []).find(
      (b: any) => b.type === "calendar" && b.enabled !== false
    ) as any;

    if (calendarBlock) {
      const calTitle = replaceVariables(calendarBlock.title || resolvedSubject, variables);
      const calStart = replaceVariables(calendarBlock.start_date || "", variables);
      const calEnd = replaceVariables(calendarBlock.end_date || "", variables);
      const calLoc = replaceVariables(calendarBlock.location || "", variables);
      const calDesc = replaceVariables(calendarBlock.description || "", variables);

      const startDate = parseEventDate(calStart) || new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endDate = parseEventDate(calEnd) || new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

      const icsContent = generateIcsCalendarContent({
        title: calTitle,
        description: calDesc,
        location: calLoc,
        startDate,
        endDate,
        organizerName: fromName,
        organizerEmail: fromEmail
      });

      attachments.push({
        filename: "invito-evento.ics",
        content: Buffer.from(icsContent, "utf-8"),
        contentType: "text/calendar; charset=utf-8; method=PUBLISH"
      });
    }

    // 9. Dispatch Email via Resend
    const sendResult = await sendTransactionalEmail({
      to: recipientEmail,
      subject: resolvedSubject,
      html: emailHtml,
      text: emailText,
      from: fromHeader,
      replyTo,
      attachments: attachments.length > 0 ? attachments : undefined
    });

    if (!sendResult.success) {
      // Save failed email to DLQ for on-demand retry via Admin or API
      const queuedRecord = await enqueueFailedEmail({
        error: {
          message: sendResult.error || "Errore sconosciuto durante l'invio dell'email"
        },
        recipient: {
          email: recipientEmail,
          name: recipientName
        },
        subject: resolvedSubject,
        templateId: selectedTemplate.id || selectedTemplate.name,
        subcaseId: activeSubcase?.id,
        compiledOptions: {
          to: recipientEmail,
          subject: resolvedSubject,
          html: emailHtml,
          text: emailText,
          from: fromHeader,
          replyTo,
          attachments: attachments.length > 0 ? attachments : undefined
        },
        originalRequest: {
          url: req.url,
          body,
          templateParam: rawTemplateParam,
          subcaseParam: requestedSubcaseId
        }
      });

      return NextResponse.json(
        {
          success: false,
          queued: true,
          queueId: queuedRecord.id,
          message: "Invio fallito. L'email è stata salvata nella coda di recupero (DLQ) per essere ritriggerata.",
          error: sendResult.error || "Errore sconosciuto durante l'invio dell'email"
        },
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
