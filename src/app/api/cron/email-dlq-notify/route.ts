import { NextRequest, NextResponse } from "next/server";
import { getContent } from "@/lib/data";
import { listFailedEmails } from "@/lib/email/dlq";
import { clearPendingResendBounces, listPendingResendBounces } from "@/lib/email/bounces";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { SITE_URL } from "@/lib/seo";
import { escapeHtml } from "@/lib/email/blocks";

export const dynamic = "force-dynamic";

import { constantTimeCompare, checkRateLimit, getClientIp } from "@/lib/security";

/**
 * Validates whether the incoming request is authorized by Vercel Cron or an Admin.
 */
function isCronAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization")?.trim();
  const bearerToken = authHeader?.replace(/^Bearer\s+/i, "")?.trim();
  const adminSecretHeader = req.headers.get("x-admin-secret")?.trim();
  const querySecret = new URL(req.url).searchParams.get("secret")?.trim();

  const cronSecret = process.env.CRON_SECRET?.trim();
  const adminSecret = process.env.ADMIN_SECRET?.trim() || process.env.EMAIL_API_SECRET?.trim();

  // 1. If Vercel CRON_SECRET is configured, check Bearer token in constant time
  if (cronSecret && bearerToken && constantTimeCompare(bearerToken, cronSecret)) {
    return true;
  }

  // 2. If ADMIN_SECRET is provided (e.g. test button from Admin UI)
  if (adminSecret) {
    if (adminSecretHeader && constantTimeCompare(adminSecretHeader, adminSecret)) return true;
    if (bearerToken && constantTimeCompare(bearerToken, adminSecret)) return true;
    if (querySecret && constantTimeCompare(querySecret, adminSecret)) return true;
  }

  // 3. Allow in local development
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  // 4. In production, authorization must be validated with CRON_SECRET or ADMIN_SECRET
  return false;
}

export async function GET(req: NextRequest) {
  return handleDlqNotification(req);
}

export async function POST(req: NextRequest) {
  return handleDlqNotification(req);
}

async function handleDlqNotification(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json(
      { error: "Non autorizzato. Fornisci un CRON_SECRET o ADMIN_SECRET valido." },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const isForce = url.searchParams.get("force") === "true";

  // Fetch current DLQ items and pending Resend bounce events
  const [queue, bounces] = await Promise.all([
    listFailedEmails(),
    listPendingResendBounces()
  ]);
  const content = await getContent();
  const settings = content?.emails?.settings || {};

  const isEnabled = settings.dlq_alert_enabled !== false;
  const alertRecipient =
    settings.dlq_alert_email?.trim() ||
    settings.reply_to?.trim() ||
    "compagniateatralegliattomatti@gmail.com";

  // If disabled and not forced for testing
  if (!isEnabled && !isForce) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: "Notifiche DLQ disattivate nelle impostazioni admin.",
      queueCount: queue.length,
      bounceCount: bounces.length
    });
  }

  // If both queues are empty and not forced for testing
  if (queue.length === 0 && bounces.length === 0 && !isForce) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: "Nessuna email in coda di errore o rimbalzata. Nessuna notifica necessaria.",
      queueCount: 0,
      bounceCount: 0
    });
  }

  const count = queue.length;
  const bounceCount = bounces.length;
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || SITE_URL || "https://gliattomatti.ch").replace(/\/$/, "");
  const adminUrl = `${baseUrl}/admin`;

  // Sample items for display (up to 10)
  const displayItems = queue.slice(0, 10);
  const displayBounces = bounces.slice(0, 15);

  // If forced test with both queues empty, create a placeholder sample for demonstration
  const sampleList =
    displayItems.length > 0
      ? displayItems
      : bounceCount === 0
        ? [
            {
              id: "demo-sample-1",
              recipient: { email: "mario.rossi@example.com", name: "Mario Rossi" },
              subject: "Conferma Iscrizione: Serata Cineforum",
              error: { message: "Resend: Daily quota limit of 100 emails exceeded" },
              lastAttemptAt: new Date().toISOString(),
              attempts: 1
            }
          ]
        : [];

  const subjectParts: string[] = [];
  if (count > 0) subjectParts.push(`${count} in coda DLQ`);
  if (bounceCount > 0) subjectParts.push(`${bounceCount} rimbalzate (Bounce)`);

  const emailSubject =
    subjectParts.length > 0
      ? `⚠️ [Gli Attomatti] Report Email: ${subjectParts.join(" · ")}`
      : `🧪 [Test Notifica DLQ] Controllo Coda Email Eseguito con Successo`;

  const bounceRowsHtml = displayBounces
    .map((b) => {
      const formattedDate = new Date(b.timestamp).toLocaleString("it-IT", {
        timeZone: "Europe/Zurich",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
      const badge = b.eventType === "email.complained" ? "Spam/Complaint" : "Bounce";
      return `
        <tr>
          <td style="padding: 12px 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); font-size: 13px; color: #f8fafc; font-weight: 600;">
            ${escapeHtml(b.email)}
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); font-size: 12px; color: #cbd5e1;">
            ${escapeHtml(b.subject || "Nessun oggetto")}
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); font-size: 11px; color: #fbbf24; font-family: monospace;">
            [${badge}] ${escapeHtml(b.reason || "Rimbalzo")}
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); font-size: 11px; color: #94a3b8; text-align: right; white-space: nowrap;">
            ${formattedDate}
          </td>
        </tr>
      `;
    })
    .join("");

  const rowsHtml = sampleList
    .map((item) => {
      const recipientStr = item.recipient.name
        ? `${escapeHtml(item.recipient.name)} &lt;${escapeHtml(item.recipient.email)}&gt;`
        : escapeHtml(item.recipient.email);
      const formattedDate = new Date(item.lastAttemptAt).toLocaleString("it-IT", {
        timeZone: "Europe/Zurich",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });

      return `
        <tr>
          <td style="padding: 12px 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); font-size: 13px; color: #f8fafc; font-weight: 600;">
            ${recipientStr}
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); font-size: 12px; color: #cbd5e1;">
            ${escapeHtml(item.subject || "Nessun oggetto")}
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); font-size: 11px; color: #fb7185; font-family: monospace;">
            ${escapeHtml(item.error?.message || "Errore sconosciuto")}
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); font-size: 11px; color: #94a3b8; text-align: right; white-space: nowrap;">
            ${formattedDate}
          </td>
        </tr>
      `;
    })
    .join("");

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="utf-8" />
      <title>${emailSubject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b1120; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; background-color: #0f172a; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);">
              
              <!-- Brand Header -->
              <tr>
                <td style="padding: 24px 32px; background: linear-gradient(135deg, rgba(251, 113, 133, 0.15) 0%, rgba(129, 140, 248, 0.15) 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td>
                        <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #fb7185;">
                          GLI ATTOMATTI • NOTIFICA AMMINISTRATORE
                        </span>
                        <h1 style="margin: 4px 0 0 0; font-size: 20px; font-weight: 900; color: #f8fafc; letter-spacing: -0.02em;">
                          ${
                            count > 0 || bounceCount > 0
                              ? `⚠️ Report Email: ${subjectParts.join(" · ")}`
                              : `✅ Nessuna email in coda (Test di Notifica)`
                          }
                        </h1>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Main Body -->
              <tr>
                <td style="padding: 28px 32px;">
                  <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                    Ciao Amministratore,<br />
                    il controllo automatico programmato ogni notte alle <strong>00:10 UTC</strong> ha esaminato la <strong>Dead Letter Queue (DLQ)</strong> del sistema email.
                  </p>

                  ${
                    count > 0
                      ? `
                    <div style="background-color: rgba(251, 113, 133, 0.1); border: 1px solid rgba(251, 113, 133, 0.25); border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
                      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #fecdd3;">
                        <strong>Perché succede?</strong> Di solito queste email rimangono in coda se durante la giornata è stata raggiunta la quota limite giornaliera di 100 email di Resend, oppure per disconnessioni temporanee.<br />
                        <strong>Cosa fare ora?</strong> Poiché la quota di Resend si ripristina a mezzanotte UTC, ora puoi ritriggerare tutti gli invii con un singolo clic dal pannello di controllo.
                      </p>
                    </div>

                    <h2 style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin: 0 0 10px 0;">
                      Elenco Email in Attesa (${count > 10 ? `Prime 10 di ${count}` : count}):
                    </h2>

                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; overflow: hidden; background-color: rgba(255, 255, 255, 0.02); margin-bottom: 24px;">
                      <thead>
                        <tr style="background-color: rgba(255, 255, 255, 0.04);">
                          <th align="left" style="padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">Destinatario</th>
                          <th align="left" style="padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">Oggetto</th>
                          <th align="left" style="padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">Errore</th>
                          <th align="right" style="padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">Orario</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${rowsHtml}
                      </tbody>
                    </table>
                  `
                      : bounceCount === 0
                        ? `
                    <div style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
                      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #6ee7b7;">
                        Questa è una notifica di test inviata dal pannello di controllo. Attualmente non ci sono email bloccate o in errore nella coda DLQ. Tutte le email inviate sono state recapitate con successo!
                      </p>
                    </div>
                  `
                        : ""
                  }

                  ${
                    bounceCount > 0
                      ? `
                    <h2 style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #fbbf24; margin: 0 0 10px 0;">
                      Email Rimbalzate / Segnalate (Resend Bounce: ${bounceCount > 15 ? `Prime 15 di ${bounceCount}` : bounceCount}):
                    </h2>

                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px; overflow: hidden; background-color: rgba(255, 255, 255, 0.02); margin-bottom: 24px;">
                      <thead>
                        <tr style="background-color: rgba(251, 191, 36, 0.08);">
                          <th align="left" style="padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #fcd34d;">Destinatario</th>
                          <th align="left" style="padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #fcd34d;">Oggetto</th>
                          <th align="left" style="padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #fcd34d;">Motivo</th>
                          <th align="right" style="padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #fcd34d;">Orario</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${bounceRowsHtml}
                      </tbody>
                    </table>
                  `
                      : ""
                  }

                  <!-- CTA Button -->
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 16px 0;">
                    <tr>
                      <td align="center" style="background: linear-gradient(135deg, #fb7185 0%, #e11d48 100%); border-radius: 12px; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.35);">
                        <a href="${adminUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 28px; font-size: 13px; font-weight: 800; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em;">
                          ${count > 0 ? "Apri Pannello Admin & Riprova Invii" : "Apri Pannello Admin"} &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 16px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                    Per modificare l&apos;indirizzo di notifica o disattivare questo avviso, accedi al pannello admin &rarr; tab <strong>Email</strong> &rarr; sezione <strong>Coda Errori (DLQ)</strong>.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 16px 32px; background-color: rgba(15, 23, 42, 0.8); border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center; font-size: 11px; color: #64748b;">
                  Gli Attomatti • Zurigo, Svizzera • Sistema di Notifica Automatizzato Cron (00:10 UTC)
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const emailText =
    count > 0 || bounceCount > 0
      ? `⚠️ GLI ATTOMATTI - REPORT GIORNALIERO EMAIL\n\n` +
        (count > 0
          ? `--- CODA DLQ (${count} non consegnate) ---\n` +
            sampleList.map((i) => `• ${i.recipient.email} - ${i.subject} (${i.error?.message})`).join("\n") +
            "\n\n"
          : "") +
        (bounceCount > 0
          ? `--- EMAIL RIMBALZATE / BOUNCE (${bounceCount}) ---\n` +
            displayBounces.map((b) => `• ${b.email} - ${b.subject} [${b.eventType}: ${b.reason}]`).join("\n") +
            "\n\n"
          : "") +
        `Pannello admin: ${adminUrl}`
      : `GLI ATTOMATTI - TEST NOTIFICA DLQ\n\nNessuna email bloccata in coda. Tutte le email sono state consegnate.\n${adminUrl}`;

  // Send the notification email
  const fromEmail = settings.from_email || "no-reply@mail.gliattomatti.ch";
  const fromName = settings.from_name || "Gli Attomatti";

  const sendResult = await sendTransactionalEmail({
    from: `${fromName} System <${fromEmail}>`,
    to: alertRecipient,
    subject: emailSubject,
    html: emailHtml,
    text: emailText
  });

  if (sendResult.success && bounceCount > 0) {
    await clearPendingResendBounces().catch((err) => {
      console.warn("[DLQ Notify] Impossibile pulire bounce Redis:", err);
    });
  }

  return NextResponse.json({
    success: sendResult.success,
    notifiedTo: alertRecipient,
    queueCount: count,
    bounceCount,
    emailId: sendResult.id,
    simulated: sendResult.simulated || false,
    error: sendResult.error
  });
}
