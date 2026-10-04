import { NextRequest, NextResponse } from "next/server";
import { getContent } from "@/lib/data";
import {
  renderEmailHtml,
  renderEmailText,
  resolveEmailTheme,
  replaceVariables,
  EmailTemplateConfig
} from "@/lib/email/template";
import { sendTransactionalEmail, SendEmailAttachment } from "@/lib/email/resend";
import { flattenJsonToDotNotation } from "@/lib/email/jsonPath";
import { parseEventDate, generateIcsCalendarContent } from "@/lib/email/calendar";
import { checkAdminAuth } from "../queue/route";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = checkAdminAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { to, template, variables = {}, rawJsonObj, subcaseId } = body;

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

    // Find subcase if selected
    let activeSubcase: any = undefined;
    if (subcaseId && Array.isArray(template.subcases)) {
      activeSubcase = template.subcases.find(
        (s: any) => s.id === subcaseId || s.name === subcaseId
      );
    }

    // Flatten rawJsonObj if provided
    const flattenedRaw = rawJsonObj && typeof rawJsonObj === "object"
      ? flattenJsonToDotNotation(rawJsonObj)
      : {};

    // Strict variables: only data from json payload, subcase custom fields, and explicit test variables
    const mergedVariables: Record<string, string> = {
      ...flattenedRaw,
      ...variables,
      ...(activeSubcase?.custom_fields || {}),
      email: to
    };

    const themeColors = resolveEmailTheme(template.theme || "default", content?.landings || [], template.customColors);
    const baseUrl =
      req.nextUrl?.origin && !req.nextUrl.origin.includes("localhost")
        ? req.nextUrl.origin
        : (process.env.NEXT_PUBLIC_SITE_URL || "https://gliattomatti.ch");

    const emailHtml = renderEmailHtml({
      template,
      variables: mergedVariables,
      rawJsonObj,
      themeColors,
      settings: emailSettings,
      baseUrl
    });
    const emailText = renderEmailText({
      template,
      variables: mergedVariables,
      rawJsonObj,
      settings: emailSettings,
      baseUrl
    });

    const subjectTemplate = template.subject || "Notifica di prova — Gli Attomatti";
    const subject = `[TEST] ${replaceVariables(subjectTemplate, mergedVariables)}`;

    // Resolve Sender Profile (Subcase -> Template -> Global)
    const senderProfile = activeSubcase?.sender_profile || template.sender_profile || {};
    let fromName = senderProfile.from_name || emailSettings.from_name || "Gli Attomatti";
    fromName = replaceVariables(fromName, mergedVariables);

    const fromEmail = senderProfile.from_email || emailSettings.from_email;
    let replyTo = senderProfile.reply_to || emailSettings.reply_to || undefined;
    if (replyTo) {
      replyTo = replaceVariables(replyTo, mergedVariables);
    }

    const fromHeader = fromEmail ? `${fromName} <${fromEmail}>` : undefined;

    // Attach .ics invite if calendar block exists in template
    const attachments: SendEmailAttachment[] = [];
    const calendarBlock = (template.blocks || []).find(
      (b: any) => b.type === "calendar" && b.enabled !== false
    ) as any;

    if (calendarBlock) {
      const calTitle = replaceVariables(calendarBlock.title || subject, mergedVariables);
      const calStart = replaceVariables(calendarBlock.start_date || "", mergedVariables);
      const calEnd = replaceVariables(calendarBlock.end_date || "", mergedVariables);
      const calLoc = replaceVariables(calendarBlock.location || "", mergedVariables);
      const calDesc = replaceVariables(calendarBlock.description || "", mergedVariables);

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

    const sendResult = await sendTransactionalEmail({
      to,
      subject,
      html: emailHtml,
      text: emailText,
      from: fromHeader,
      replyTo,
      attachments: attachments.length > 0 ? attachments : undefined
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
