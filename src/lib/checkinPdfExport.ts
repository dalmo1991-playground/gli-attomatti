import { MergedTallySubmission } from "@/types/tally";

interface PdfExportOptions {
  formName: string;
  syncedAt: string | null;
  submissions: MergedTallySubmission[];
  fieldLabels: Record<string, string>;
  getPrimaryValue: (sub: MergedTallySubmission) => string;
  primaryFieldId?: string;
  totalParticipants: number;
  checkedInParticipants: number;
  totalSubmissions: number;
  checkedInSubmissions: number;
  hasPendingSync: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateIt(iso?: string | null): string {
  if (!iso) return "Mai";
  try {
    return new Date(iso).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

/**
 * Opens a clean, self-contained A4 printable report window that triggers the browser's
 * native "Save as PDF / Print" dialog with zero external dependencies.
 */
export function exportCheckinPdfReport(options: PdfExportOptions): boolean {
  const win = window.open("", "_blank");
  if (!win) return false;

  const nowStr = new Date().toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const rowsHtml = options.submissions
    .map((sub, index) => {
      const primary = escapeHtml(options.getPrimaryValue(sub));
      const maxCount = sub.participantsCount || 1;
      const presentCount = Math.max(0, Math.min(maxCount, sub.checkedInCount || 0));

      let statusLabel = "Assente";
      let statusClass = "badge-absent";
      if (presentCount >= maxCount) {
        statusLabel = maxCount > 1 ? `Presenti (${presentCount}/${maxCount})` : "Presente";
        statusClass = "badge-present";
      } else if (presentCount > 0) {
        statusLabel = `Parziale (${presentCount}/${maxCount})`;
        statusClass = "badge-partial";
      }

      const otherFields = Object.entries(sub.fields || {})
        .filter(([qId]) => {
          if (sub.isManual && qId === "__manual_name") return false;
          if (!sub.isManual && options.primaryFieldId && qId === options.primaryFieldId) {
            return false;
          }
          return true;
        })
        .map(([qId, val]) => {
          const label = escapeHtml(options.fieldLabels[qId] || qId);
          return `<div class="field-line"><span class="field-label">${label}:</span> ${escapeHtml(val)}</div>`;
        })
        .join("");

      const extraTag = sub.isManual ? ` <span class="tag-extra">In sala</span>` : "";
      const operatorInfo = sub.checkedInBy
        ? `<div class="operator">da ${escapeHtml(sub.checkedInBy)}</div>`
        : "";

      return `
        <tr>
          <td class="col-num">${index + 1}</td>
          <td class="col-name">
            <div class="primary-name">${primary}${extraTag}</div>
            ${otherFields}
          </td>
          <td class="col-count">${presentCount} / ${maxCount}</td>
          <td class="col-status">
            <span class="badge ${statusClass}">${escapeHtml(statusLabel)}</span>
            ${operatorInfo}
          </td>
        </tr>
      `;
    })
    .join("");

  const pendingBanner = options.hasPendingSync
    ? `<div class="pending-note">Nota: il report include modifiche locali non ancora sincronizzate su Vercel Blob.</div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <title>Report Check-in - ${escapeHtml(options.formName)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 20px;
      font-size: 12px;
      line-height: 1.4;
    }
    .no-print {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-bottom: 16px;
    }
    .btn-print {
      background: #111827;
      color: #ffffff;
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
    }
    .header {
      border-bottom: 2px solid #111827;
      padding-bottom: 12px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
    }
    .brand {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6b7280;
    }
    h1 {
      margin: 2px 0 4px 0;
      font-size: 20px;
      font-weight: 900;
    }
    .meta {
      font-size: 11px;
      color: #4b5563;
    }
    .stats {
      display: flex;
      gap: 12px;
      margin-bottom: 14px;
    }
    .stat-box {
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 8px 14px;
      background: #f9fafb;
    }
    .stat-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #6b7280;
    }
    .stat-value {
      font-size: 16px;
      font-weight: 900;
      color: #111827;
    }
    .pending-note {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      color: #92400e;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      text-align: left;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #4b5563;
      border-bottom: 2px solid #d1d5db;
      padding: 8px 6px;
    }
    td {
      border-bottom: 1px solid #e5e7eb;
      padding: 8px 6px;
      vertical-align: top;
    }
    tr { page-break-inside: avoid; }
    .col-num { width: 32px; color: #6b7280; font-weight: 700; }
    .col-count { width: 85px; font-weight: 800; text-align: center; }
    .col-status { width: 135px; }
    .primary-name { font-weight: 800; font-size: 13px; color: #111827; }
    .field-line { font-size: 11px; color: #374151; margin-top: 2px; }
    .field-label { font-weight: 700; color: #6b7280; }
    .tag-extra {
      display: inline-block;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      background: #e0e7ff;
      color: #3730a3;
      padding: 1px 6px;
      border-radius: 999px;
      margin-left: 4px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
    }
    .badge-present { background: #dcfce7; color: #166534; }
    .badge-partial { background: #fef9c3; color: #854d0e; }
    .badge-absent { background: #f3f4f6; color: #4b5563; }
    .operator { font-size: 10px; color: #6b7280; margin-top: 2px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn-print" onclick="window.print()">Stampa / Salva come PDF</button>
  </div>
  <div class="header">
    <div>
      <div class="brand">Gli Attomatti · Area Riservata</div>
      <h1>${escapeHtml(options.formName)}</h1>
      <div class="meta">Generato il: ${escapeHtml(nowStr)} · Sync Tally: ${escapeHtml(formatDateIt(options.syncedAt))}</div>
    </div>
  </div>
  <div class="stats">
    <div class="stat-box">
      <div class="stat-label">Partecipanti Presenti</div>
      <div class="stat-value">${options.checkedInParticipants} / ${options.totalParticipants}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Iscrizioni Presenti</div>
      <div class="stat-value">${options.checkedInSubmissions} / ${options.totalSubmissions}</div>
    </div>
  </div>
  ${pendingBanner}
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Partecipante & Dettagli</th>
        <th style="text-align:center;">Persone</th>
        <th>Stato Check-in</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || '<tr><td colspan="4" style="text-align:center;color:#6b7280;padding:24px;">Nessun partecipante presente.</td></tr>'}
    </tbody>
  </table>
  <script>
    window.addEventListener("load", function () {
      setTimeout(function () { window.print(); }, 250);
    });
  </script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}

